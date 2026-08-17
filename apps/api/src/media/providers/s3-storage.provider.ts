import { Injectable } from '@nestjs/common';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';
import { StorageProvider, UploadTarget } from '../storage-provider.interface';

// Works against S3 itself or any S3-compatible provider (Cloudflare R2, Backblaze
// B2, MinIO for local dev) by pointing STORAGE_ENDPOINT at it — this is the
// "cloud object storage compatible with secure signed URLs" requirement from
// docs/02-ARCHITECTURE.md, not locked to one vendor.
@Injectable()
export class S3StorageProvider implements StorageProvider {
  private client = new S3Client({
    region: process.env.STORAGE_REGION ?? 'auto',
    endpoint: process.env.STORAGE_ENDPOINT,
    credentials: {
      accessKeyId: process.env.STORAGE_ACCESS_KEY_ID ?? '',
      secretAccessKey: process.env.STORAGE_SECRET_ACCESS_KEY ?? '',
    },
  });
  private bucket = process.env.STORAGE_BUCKET ?? 'prayerhub-media';
  private publicBaseUrl = process.env.STORAGE_PUBLIC_BASE_URL ?? '';

  async createUploadUrl(userId: string, contentType: string, extension: string): Promise<UploadTarget> {
    const storageKey = `uploads/${userId}/${randomUUID()}.${extension}`;
    const command = new PutObjectCommand({ Bucket: this.bucket, Key: storageKey, ContentType: contentType });
    const uploadUrl = await getSignedUrl(this.client, command, { expiresIn: 300 }); // 5 min to upload
    return { uploadUrl, storageKey, publicUrl: `${this.publicBaseUrl}/${storageKey}` };
  }
}
