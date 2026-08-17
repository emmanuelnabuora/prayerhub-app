import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../database/database.module';
import { CreateReportDto, ResolveModerationCaseDto } from './dto';
import { AiTriageService } from './ai-triage.service';

@Injectable()
export class ModerationService {
  constructor(
    @Inject(PG_POOL) private readonly db: Pool,
    private readonly aiTriage: AiTriageService,
  ) {}

  async createReport(reporterId: string, dto: CreateReportDto) {
    const result = await this.db.query(
      `insert into reports (reporter_id, target_type, target_id, reason) values ($1, $2, $3, $4) returning *`,
      [reporterId, dto.targetType, dto.targetId, dto.reason],
    );
    const report = result.rows[0];

    // Fire-and-forget: the report is filed and visible to the reporter
    // immediately; AI triage fills in moderation_cases moments later. A slow or
    // failed AI call never delays the report confirmation the user sees.
    this.aiTriage.triage(report.id, dto.reason, dto.targetType).catch(() => undefined);

    return report;
  }

  // Queue listing and resolution are gated by RolesGuard at the controller
  // level (moderator/admin/super_admin) — see moderation.controller.ts.
  async listQueue(status = 'open') {
    const result = await this.db.query(
      `select mc.*, r.target_type, r.target_id, r.reason, r.reporter_id, r.created_at as reported_at
       from moderation_cases mc join reports r on r.id = mc.report_id
       where mc.status = $1
       order by
         case mc.ai_suggested_severity when 'high' then 0 when 'medium' then 1 when 'low' then 2 else 3 end,
         mc.created_at asc`,
      [status],
    );
    return result.rows;
  }

  async resolve(caseId: string, moderatorId: string, dto: ResolveModerationCaseDto) {
    const result = await this.db.query(
      `update moderation_cases set status = $2, reviewed_by = $3, reviewed_at = now(), resolution_notes = $4
       where id = $1 returning *`,
      [caseId, dto.status, moderatorId, dto.resolutionNotes],
    );
    if (!result.rowCount) throw new NotFoundException('Moderation case not found');

    await this.db.query(
      `insert into audit_logs (actor_id, action, target_type, target_id, reason)
       values ($1, 'moderation_case_resolved', 'moderation_case', $2, $3)`,
      [moderatorId, caseId, dto.resolutionNotes],
    );
    return result.rows[0];
  }
}
