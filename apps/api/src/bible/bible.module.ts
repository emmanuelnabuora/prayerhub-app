import { Module } from '@nestjs/common';
import { BibleController } from './bible.controller';
import { BibleService } from './bible.service';
import { bibleProviderFactory } from './bible-provider.factory';

@Module({
  controllers: [BibleController],
  providers: [BibleService, bibleProviderFactory],
})
export class BibleModule {}
