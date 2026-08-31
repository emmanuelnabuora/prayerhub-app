import { Controller, Get, Inject } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../database/database.module';
// Cloud Run's health/startup probes hit this — deliberately outside the global
// 'api/v1' prefix concern (see main.ts) is fine either way since Cloud Run just
// needs *a* 200. Checks the DB connection too, not just "the process is up,"
// since a container that's running but can't reach Cloud SQL should fail its
// health check and get recycled rather than serve broken requests.
@Controller('health')
export class HealthController {
  constructor(@Inject(PG_POOL) private readonly db: Pool) {}
  @Get()
  async check() {
    await this.db.query('select 1');
    return { status: 'ok', service: 'prayerhub-api', timestamp: new Date().toISOString() };
  }
}
