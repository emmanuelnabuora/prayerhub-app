import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../database/database.module';
import { StorageProvider } from './storage-provider.interface';

export const STORAGE_PROVIDER = 'STORAGE_PROVIDER';

@Injectable()
export class MediaService {
  constructor(
    @Inject(PG_POOL) private readonly db: Pool,
    @Inject(STORAGE_PROVIDER) private readonly storage: StorageProvider,
  ) {}

  async requestUpload(userId: string, mediaType: 'audio' | 'image' | 'video', contentType: string) {
    const extension = contentType.split('/')[1] ?? 'bin';
    const target = await this.storage.createUploadUrl(userId, contentType, extension);
    // The DB row is created now, in 'pending' shape (no durationSeconds yet), and
    // the caller PUTs bytes to uploadUrl, then calls /media/:id/confirm once done —
    // this keeps the API server out of the actual file transfer entirely.
    const result = await this.db.query(
      `insert into media_assets (user_id, storage_key, public_url, media_type, mime_type)
       values ($1, $2, $3, $4, $5) returning *`,
      [userId, target.storageKey, target.publicUrl, mediaType, contentType],
    );
    return { mediaAssetId: result.rows[0].id, uploadUrl: target.uploadUrl, publicUrl: target.publicUrl };
  }

  async confirmUpload(mediaAssetId: string, userId: string, durationSeconds?: number) {
    await this.db.query(
      `update media_assets set duration_seconds = coalesce($3, duration_seconds)
       where id = $1 and user_id = $2`,
      [mediaAssetId, userId, durationSeconds ?? null],
    );
    return { success: true };
  }
}
