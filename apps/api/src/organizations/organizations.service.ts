import { ConflictException, ForbiddenException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../database/database.module';
import { CreateOrganizationDto, UpdateOrganizationDto, CreateAnnouncementDto } from './dto';

@Injectable()
export class OrganizationsService {
  constructor(@Inject(PG_POOL) private readonly db: Pool) {}

  async create(userId: string, dto: CreateOrganizationDto) {
    const slugTaken = await this.db.query('select 1 from organizations where slug = $1', [dto.slug]);
    if (slugTaken.rowCount) throw new ConflictException('That slug is already taken');

    const result = await this.db.query(
      `insert into organizations (name, slug, type, description, cover_image_url, website_url, owner_id)
       values ($1, $2, $3, $4, $5, $6, $7) returning *`,
      [dto.name, dto.slug, dto.type, dto.description ?? null, dto.coverImageUrl ?? null,
       dto.websiteUrl ?? null, userId],
    );
    await this.db.query(
      `insert into organization_members (organization_id, user_id, role) values ($1, $2, 'leader')`,
      [result.rows[0].id, userId],
    );
    return this.findOne(result.rows[0].id, userId);
  }

  async discover(type?: string) {
    const result = await this.db.query(
      `select o.*,
              (select count(*) from organization_followers f where f.organization_id = o.id) as follower_count,
              (select count(*) from groups g where g.organization_id = o.id) as group_count
       from organizations o
       where o.deleted_at is null ${type ? 'and o.type = $1' : ''}
       order by o.verified desc, o.created_at desc`,
      type ? [type] : [],
    );
    return result.rows.map(this.serialize);
  }

  async findOne(id: string, viewerId: string) {
    const result = await this.db.query(
      `select o.*,
              (select count(*) from organization_followers f where f.organization_id = o.id) as follower_count,
              (select count(*) from groups g where g.organization_id = o.id) as group_count,
              exists(select 1 from organization_followers f where f.organization_id = o.id and f.user_id = $2) as is_following,
              (select role from organization_members m where m.organization_id = o.id and m.user_id = $2) as viewer_role
       from organizations o where o.id = $1 and o.deleted_at is null`,
      [id, viewerId],
    );
    if (!result.rowCount) throw new NotFoundException('Organization not found');

    const leaders = await this.db.query(
      `select u.id, u.username, u.display_name, u.avatar_url, m.role
       from organization_members m join users u on u.id = m.user_id
       where m.organization_id = $1`,
      [id],
    );
    const groups = await this.db.query(
      `select id, name, group_type from groups where organization_id = $1 and deleted_at is null`,
      [id],
    );

    return { ...this.serialize(result.rows[0]), leadership: leaders.rows, groups: groups.rows };
  }

  async update(id: string, userId: string, dto: UpdateOrganizationDto) {
    await this.assertLeader(id, userId);
    await this.db.query(
      `update organizations set description = coalesce($2, description),
         cover_image_url = coalesce($3, cover_image_url), website_url = coalesce($4, website_url),
         livestream_url = coalesce($5, livestream_url), updated_at = now()
       where id = $1`,
      [id, dto.description, dto.coverImageUrl, dto.websiteUrl, dto.livestreamUrl],
    );
    return this.findOne(id, userId);
  }

  // Verification is deliberately platform-admin-only (see RolesGuard on the
  // controller endpoint) — no leader can self-verify their own organization.
  async verify(id: string, adminUserId: string) {
    const result = await this.db.query(
      `update organizations set verified = true, verified_at = now(), verified_by = $2
       where id = $1 and deleted_at is null returning *`,
      [id, adminUserId],
    );
    if (!result.rowCount) throw new NotFoundException('Organization not found');
    return this.serialize(result.rows[0]);
  }

  async follow(id: string, userId: string) {
    await this.db.query(
      `insert into organization_followers (organization_id, user_id) values ($1, $2) on conflict do nothing`,
      [id, userId],
    );
    return { success: true };
  }

  async unfollow(id: string, userId: string) {
    await this.db.query('delete from organization_followers where organization_id = $1 and user_id = $2', [id, userId]);
    return { success: true };
  }

  async addLeader(id: string, actorId: string, newLeaderUserId: string) {
    await this.assertLeader(id, actorId);
    await this.db.query(
      `insert into organization_members (organization_id, user_id, role) values ($1, $2, 'leader')
       on conflict (organization_id, user_id) do update set role = 'leader'`,
      [id, newLeaderUserId],
    );
    return { success: true };
  }

  async postAnnouncement(id: string, userId: string, dto: CreateAnnouncementDto) {
    await this.assertLeader(id, userId);
    const result = await this.db.query(
      `insert into organization_announcements (organization_id, created_by, title, body)
       values ($1, $2, $3, $4) returning *`,
      [id, userId, dto.title, dto.body],
    );
    return result.rows[0];
  }

  async listAnnouncements(id: string) {
    const result = await this.db.query(
      `select a.*, u.display_name as author_name from organization_announcements a
       join users u on u.id = a.created_by
       where a.organization_id = $1 order by a.created_at desc`,
      [id],
    );
    return result.rows;
  }

  // Links an existing prayer/cell/Bible-study group under this organization —
  // requires leadership of *both* the org and the group, so an org leader can't
  // unilaterally annex someone else's independent group.
  async linkGroup(orgId: string, userId: string, groupId: string) {
    await this.assertLeader(orgId, userId);
    const groupLeader = await this.db.query(
      `select 1 from group_members where group_id = $1 and user_id = $2 and role = 'leader'`,
      [groupId, userId],
    );
    if (!groupLeader.rowCount) throw new ForbiddenException('You must lead the group to link it to an organization');

    await this.db.query('update groups set organization_id = $1 where id = $2', [orgId, groupId]);
    return { success: true };
  }

  private async assertLeader(orgId: string, userId: string) {
    const result = await this.db.query(
      `select 1 from organization_members where organization_id = $1 and user_id = $2 and role = 'leader'`,
      [orgId, userId],
    );
    if (!result.rowCount) throw new ForbiddenException('Organization leader only');
  }

  private serialize(row: any) {
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      type: row.type,
      description: row.description,
      coverImageUrl: row.cover_image_url,
      websiteUrl: row.website_url,
      livestreamUrl: row.livestream_url,
      verified: row.verified,
      verifiedAt: row.verified_at,
      followerCount: Number(row.follower_count ?? 0),
      groupCount: Number(row.group_count ?? 0),
      isFollowing: Boolean(row.is_following),
      viewerRole: row.viewer_role ?? null,
      createdAt: row.created_at,
    };
  }
}
