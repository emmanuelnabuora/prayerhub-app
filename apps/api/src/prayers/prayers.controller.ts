import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PrayersService } from './prayers.service';
import { CreatePrayerRequestDto, UpdatePrayerRequestDto, CreateCommentDto } from './dto';

@UseGuards(JwtAuthGuard)
@Controller('prayers')
export class PrayersController {
  constructor(private readonly prayersService: PrayersService) {}

  @Get()
  feed(@Req() req: any, @Query('page') page?: string, @Query('limit') limit?: string) {
    return this.prayersService.feed(req.user.userId, Number(page) || 1, Number(limit) || 20);
  }

  @Post()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  create(@Req() req: any, @Body() dto: CreatePrayerRequestDto) {
    return this.prayersService.create(req.user.userId, dto);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.prayersService.findOne(id, req.user.userId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Req() req: any, @Body() dto: UpdatePrayerRequestDto) {
    return this.prayersService.update(id, req.user.userId, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.prayersService.remove(id, req.user.userId);
  }

  @Post(':id/pray')
  markPrayed(@Param('id') id: string, @Req() req: any) {
    return this.prayersService.markPrayed(id, req.user.userId);
  }

  @Get(':id/comments')
  listComments(@Param('id') id: string, @Req() req: any) {
    return this.prayersService.listComments(id, req.user.userId);
  }

  @Post(':id/comments')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  addComment(@Param('id') id: string, @Req() req: any, @Body() dto: CreateCommentDto) {
    return this.prayersService.addComment(id, req.user.userId, dto);
  }
}
