import { Module } from '@nestjs/common';
import { MediaController } from './media.controller';
import { MediaService, STORAGE_PROVIDER } from './media.service';
import { S3StorageProvider } from './providers/s3-storage.provider';

@Module({
  controllers: [MediaController],
  providers: [MediaService, { provide: STORAGE_PROVIDER, useClass: S3StorageProvider }],
  exports: [MediaService],
})
export class MediaModule {}
