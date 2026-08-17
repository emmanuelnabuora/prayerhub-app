import { ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../database/database.module';

@Injectable()
export class AdminService {
  constructor(@Inject(PG_POOL) private readonly db: Pool) {}

  // Deliberately simple counts, not a full analytics pipeline — matches
  // docs/02-ARCHITECTURE.md's modular-monolith-first stance. DAU/MAU here are
  // approximated from session activity rather than a dedicated events table,
  // which is an honest simplification worth revisiting once real usage exists
  // to validate against (see docs/15-ADMIN-CONSOLE.md).
  async stats() {
    const [users, dau, mau, activeRooms, prayerRequests, groups, organizations, openReports] = await Promise.all([
      this.db.query('select count(*) from users where deleted_at is null'),
      this.db.query(`select count(distinct user_id) from sessions where created_at > now() - interval '1 day'`),
      this.db.query(`select count(distinct user_id) from sessions where created_at > now() - interval '30 days'`),
      this.db.query(`select count(*) from live_rooms where status = 'live'`),
      this.db.query('select count(*) from prayer_requests where deleted_at is null'),
      this.db.query('select count(*) from groups where deleted_at is null'),
      this.db.query('select count(*) from organizations where deleted_at is null'),
      this.db.query(`select count(*) from moderation_cases where status = 'open'`),
    ]);
    return {
      totalUsers: Number(users.rows[0].count),
      dailyActiveUsers: Number(dau.rows[0].count),
      monthlyActiveUsers: Number(mau.rows[0].count),
      activeLiveRooms: Number(activeRooms.rows[0].count),
      totalPrayerRequests: Number(prayerRequests.rows[0].count),
      totalGroups: Number(groups.rows[0].count),
      totalOrganizations: Number(organizations.rows[0].count),
      openModerationCases: Number(openReports.rows[0].count),
    };
  }

  async listAuditLogs(limit = 50) {
    const result = await this.db.query(
      `select al.*, u.display_name as actor_name from audit_logs al
       left join users u on u.id = al.actor_id
       order by al.created_at desc limit $1`,
      [limit],
    );
    return result.rows;
  }

  async searchUsers(query: string) {
    const result = await this.db.query(
      `select u.id, u.username, u.display_name, u.email, u.created_at,
              coalesce(array_agg(r.key) filter (where r.key is not null), '{}') as roles
       from users u
       left join user_roles ur on ur.user_id = u.id and ur.scope_type = 'platform'
       left join roles r on r.id = ur.role_id
       where u.deleted_at is null and (u.username ilike $1 or u.display_name ilike $1 or u.email ilike $1)
       group by u.id limit 20`,
      [`%${query}%`],
    );
    return result.rows;
  }

  // Only a super_admin can grant admin/super_admin; a plain admin can grant
  // moderator only — prevents privilege escalation by a lower-tier admin
  // creating peers or superiors. Enforced here, in the one place a role grant
  // can happen, not just documented in the RBAC matrix.
  async grantRole(actorId: string, targetUserId: string, role: string) {
    if (role !== 'moderator') {
      const actorRoles = await this.db.query(
        `select r.key from user_roles ur join roles r on r.id = ur.role_id
         where ur.user_id = $1 and ur.scope_type = 'platform' and r.key = 'super_admin'`,
        [actorId],
      );
      if (!actorRoles.rowCount) throw new ForbiddenException('Only a super_admin can grant admin or super_admin roles');
    }

    const roleRow = await this.db.query('select id from roles where key = $1', [role]);
    if (!roleRow.rowCount) throw new NotFoundException('Unknown role');

    await this.db.query(
      `insert into user_roles (user_id, role_id, scope_type) values ($1, $2, 'platform')
       on conflict do nothing`,
      [targetUserId, roleRow.rows[0].id],
    );
    await this.db.query(
      `insert into audit_logs (actor_id, action, target_type, target_id, reason)
       values ($1, 'role_granted', 'user', $2, $3)`,
      [actorId, targetUserId, `Granted role: ${role}`],
    );
    return { success: true };
  }

  async revokeRole(actorId: string, targetUserId: string, role: string) {
    const roleRow = await this.db.query('select id from roles where key = $1', [role]);
    if (!roleRow.rowCount) throw new NotFoundException('Unknown role');

    await this.db.query(
      `delete from user_roles where user_id = $1 and role_id = $2 and scope_type = 'platform'`,
      [targetUserId, roleRow.rows[0].id],
    );
    await this.db.query(
      `insert into audit_logs (actor_id, action, target_type, target_id, reason)
       values ($1, 'role_revoked', 'user', $2, $3)`,
      [actorId, targetUserId, `Revoked role: ${role}`],
    );
    return { success: true };
  }
}
