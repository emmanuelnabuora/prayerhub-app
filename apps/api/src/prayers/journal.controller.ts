import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { JournalService } from './journal.service';
import { CreateJournalEntryDto } from './dto';

@UseGuards(JwtAuthGuard)
@Controller('journal')
export class JournalController {
  constructor(private readonly journalService: JournalService) {}

  @Get()
  list(@Req() req: any) {
    return this.journalService.list(req.user.userId);
  }

  @Post()
  create(@Req() req: any, @Body() dto: CreateJournalEntryDto) {
    return this.journalService.create(req.user.userId, dto);
  }

  @Post(':id/mark-answered')
  markAnswered(@Param('id') id: string, @Req() req: any) {
    return this.journalService.markAnswered(id, req.user.userId);
  }

  @Post(':id/convert-to-testimony')
  convertToTestimony(@Param('id') id: string, @Req() req: any) {
    return this.journalService.convertToTestimony(id, req.user.userId);
  }
}
