import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { ModerationService } from './moderation.service';
import { CreateReportDto, ResolveModerationCaseDto } from './dto';

@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly moderationService: ModerationService) {}

  @Post()
  create(@Req() req: any, @Body() dto: CreateReportDto) {
    return this.moderationService.createReport(req.user.userId, dto);
  }
}

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('moderator', 'admin', 'super_admin')
@Controller('admin/moderation')
export class ModerationController {
  constructor(private readonly moderationService: ModerationService) {}

  @Get('queue')
  queue(@Query('status') status?: string) {
    return this.moderationService.listQueue(status);
  }

  @Post(':caseId/resolve')
  resolve(@Param('caseId') caseId: string, @Req() req: any, @Body() dto: ResolveModerationCaseDto) {
    return this.moderationService.resolve(caseId, req.user.userId, dto);
  }
}
