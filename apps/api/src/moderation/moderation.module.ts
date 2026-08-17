import { Module } from '@nestjs/common';
import { ReportsController, ModerationController } from './moderation.controller';
import { ModerationService } from './moderation.service';
import { AiTriageService } from './ai-triage.service';
import { AnthropicProvider } from '../ai/anthropic.provider';

@Module({
  controllers: [ReportsController, ModerationController],
  providers: [ModerationService, AiTriageService, AnthropicProvider],
})
export class ModerationModule {}
