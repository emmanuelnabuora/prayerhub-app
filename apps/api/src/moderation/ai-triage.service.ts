import { Inject, Injectable, Logger } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../database/database.module';
import { AnthropicProvider } from '../ai/anthropic.provider';

// Advisory only, per docs/13-SPRINT-8.md's pattern of admin-gated actions and
// the master spec's explicit "content moderation assistance," not "content
// moderation automation." This service NEVER changes report status, bans a
// user, or removes content — it only writes a suggestion for a human moderator
// to read in the queue. ModerationController's actual resolve action requires
// a moderator/admin role and a human-written resolution note.
@Injectable()
export class AiTriageService {
  private readonly logger = new Logger(AiTriageService.name);

  constructor(
    @Inject(PG_POOL) private readonly db: Pool,
    private readonly anthropic: AnthropicProvider,
  ) {}

  async triage(reportId: string, reason: string, targetType: string) {
    const prompt = `A user reported ${targetType} content on a Christian prayer/community app
      with this stated reason: "${reason}"
      Respond with exactly three lines, no other text:
      SEVERITY: low, medium, or high
      ACTION: a short suggested next step for a human moderator (e.g. "review and likely dismiss",
        "remove content and warn user", "escalate — possible safety concern")
      RATIONALE: one sentence explaining the severity call`;

    let severity: string | null = null;
    let action: string | null = null;
    let rationale: string | null = null;

    try {
      const raw = await this.anthropic.complete(prompt);
      severity = /SEVERITY:\s*(low|medium|high)/i.exec(raw)?.[1]?.toLowerCase() ?? null;
      action = /ACTION:\s*(.+)/i.exec(raw)?.[1]?.trim() ?? null;
      rationale = /RATIONALE:\s*(.+)/i.exec(raw)?.[1]?.trim() ?? null;
    } catch (err) {
      // A failed AI call still produces a moderation case — it just goes to the
      // queue without a suggestion attached, rather than blocking the report.
      this.logger.warn(`AI triage failed for report ${reportId}, filing without suggestion: ${err}`);
    }

    await this.db.query(
      `insert into moderation_cases (report_id, ai_suggested_severity, ai_suggested_action, ai_rationale)
       values ($1, $2, $3, $4)`,
      [reportId, severity, action, rationale],
    );
  }
}
