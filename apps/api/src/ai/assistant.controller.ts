import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { AssistantService } from './assistant.service';
import {
  AskDto, StudyQuestionsDto, DevotionalPromptDto, ReadingPlanDto,
  SummarizeDiscussionDto, StructurePrayerDto,
} from './dto';

// Every route is throttled more tightly than typical CRUD endpoints — each call
// is a real LLM API request with real cost, unlike the rest of this API.
@UseGuards(JwtAuthGuard)
@Throttle({ default: { limit: 15, ttl: 60000 } })
@Controller('assistant')
export class AssistantController {
  constructor(private readonly assistantService: AssistantService) {}

  @Post('ask')
  ask(@Req() req: any, @Body() dto: AskDto) {
    return this.assistantService.ask(req.user.userId, dto);
  }

  @Post('study-questions')
  studyQuestions(@Req() req: any, @Body() dto: StudyQuestionsDto) {
    return this.assistantService.studyQuestions(req.user.userId, dto);
  }

  @Post('devotional-prompt')
  devotionalPrompt(@Req() req: any, @Body() dto: DevotionalPromptDto) {
    return this.assistantService.devotionalPrompt(req.user.userId, dto);
  }

  @Post('reading-plan')
  readingPlan(@Req() req: any, @Body() dto: ReadingPlanDto) {
    return this.assistantService.readingPlan(req.user.userId, dto);
  }

  @Post('summarize-discussion')
  summarizeDiscussion(@Req() req: any, @Body() dto: SummarizeDiscussionDto) {
    return this.assistantService.summarizeDiscussion(req.user.userId, dto);
  }

  @Post('structure-prayer')
  structurePrayer(@Req() req: any, @Body() dto: StructurePrayerDto) {
    return this.assistantService.structurePrayer(req.user.userId, dto);
  }

  @Get('conversations/:id')
  getConversation(@Param('id') id: string, @Req() req: any) {
    return this.assistantService.getConversation(id, req.user.userId);
  }
}
