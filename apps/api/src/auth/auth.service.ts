import { ConflictException, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import * as crypto from 'crypto';
import { Pool } from 'pg';
import { PG_POOL } from '../database/database.module';
import { RegisterDto, LoginDto } from './dto';

// Auth against the `users` / `sessions` tables defined in migrations/0001_init.sql.
// Access tokens are short-lived JWTs; refresh tokens are opaque, stored hashed, and
// rotated on every use (see /auth/refresh) so a leaked refresh token has a single use.
@Injectable()
export class AuthService {
  constructor(
    @Inject(PG_POOL) private readonly db: Pool,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existing = await this.db.query('select id from users where email = $1', [dto.email]);
    if (existing.rowCount) throw new ConflictException('Email already registered');

    const passwordHash = await argon2.hash(dto.password);
    const result = await this.db.query(
      `insert into users (email, password_hash, username, display_name, timezone)
       values ($1, $2, $3, $4, $5) returning id, email, username, display_name`,
      [dto.email, passwordHash, dto.username, dto.displayName, dto.timezone ?? null],
    );
    const user = result.rows[0];

    await this.db.query(
      `insert into user_roles (user_id, role_id, scope_type)
       select $1, id, 'platform' from roles where key = 'member'`,
      [user.id],
    );

    return this.issueTokens(user.id, dto.username, user.email);
  }

  async login(dto: LoginDto) {
    const result = await this.db.query(
      'select id, email, username, password_hash from users where email = $1 and deleted_at is null',
      [dto.email],
    );
    const user = result.rows[0];
    if (!user || !user.password_hash) throw new UnauthorizedException('Invalid credentials');

    const valid = await argon2.verify(user.password_hash, dto.password);
    if (!valid) throw new UnauthorizedException('Invalid credentials');

    return this.issueTokens(user.id, user.username, user.email);
  }

  async refresh(refreshToken: string) {
    const tokenHash = this.hashToken(refreshToken);
    const result = await this.db.query(
      `select s.id, s.user_id, u.username, u.email from sessions s
       join users u on u.id = s.user_id
       where s.refresh_token_hash = $1 and s.revoked_at is null and s.expires_at > now()`,
      [tokenHash],
    );
    const session = result.rows[0];
    if (!session) throw new UnauthorizedException('Invalid or expired refresh token');

    await this.db.query('update sessions set revoked_at = now() where id = $1', [session.id]);
    return this.issueTokens(session.user_id, session.username, session.email);
  }

  async logout(userId: string, refreshToken: string) {
    const tokenHash = this.hashToken(refreshToken);
    await this.db.query(
      'update sessions set revoked_at = now() where user_id = $1 and refresh_token_hash = $2',
      [userId, tokenHash],
    );
    return { success: true };
  }

  private async issueTokens(userId: string, username: string, email: string) {
    const accessToken = await this.jwt.signAsync(
      { sub: userId, username, email },
      { secret: process.env.JWT_ACCESS_SECRET, expiresIn: process.env.JWT_ACCESS_TTL ?? '15m' },
    );

    const refreshToken = crypto.randomBytes(48).toString('hex');
    const tokenHash = this.hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await this.db.query(
      `insert into sessions (user_id, refresh_token_hash, expires_at) values ($1, $2, $3)`,
      [userId, tokenHash, expiresAt],
    );

    return { accessToken, refreshToken, expiresIn: 900 };
  }

  private hashToken(token: string) {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}
