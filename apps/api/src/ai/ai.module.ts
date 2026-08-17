import { Module } from '@nestjs/common';
import { AssistantController } from './assistant.controller';
import { AssistantService } from './assistant.service';
import { AnthropicProvider } from './anthropic.provider';

@Module({
  controllers: [AssistantController],
  providers: [AssistantService, AnthropicProvider],
})
export class AiModule {}
