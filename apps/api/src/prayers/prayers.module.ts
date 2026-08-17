import { Module } from '@nestjs/common';
import { PrayersController } from './prayers.controller';
import { PrayersService } from './prayers.service';
import { JournalController } from './journal.controller';
import { JournalService } from './journal.service';

@Module({
  controllers: [PrayersController, JournalController],
  providers: [PrayersService, JournalService],
})
export class PrayersModule {}
