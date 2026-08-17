import { Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MessagesService } from './messages.service';
import { StartDirectConversationDto, StartGroupConversationDto, SendMessageDto } from './dto';

@UseGuards(JwtAuthGuard)
@Controller('conversations')
export class MessagesController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get()
  list(@Req() req: any) {
    return this.messagesService.listConversations(req.user.userId);
  }

  @Post('direct')
  startDirect(@Req() req: any, @Body() dto: StartDirectConversationDto) {
    return this.messagesService.findOrCreateDirect(req.user.userId, dto.userId);
  }

  @Post('group')
  startGroup(@Req() req: any, @Body() dto: StartGroupConversationDto) {
    return this.messagesService.createGroupConversation(req.user.userId, dto);
  }

  @Get(':id')
  getOne(@Param('id') id: string, @Req() req: any) {
    return this.messagesService.getConversation(id, req.user.userId);
  }

  @Get(':id/messages')
  listMessages(@Param('id') id: string, @Req() req: any, @Query('before') before?: string) {
    return this.messagesService.listMessages(id, req.user.userId, before);
  }

  @Post(':id/messages')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  sendMessage(@Param('id') id: string, @Req() req: any, @Body() dto: SendMessageDto) {
    return this.messagesService.sendMessage(id, req.user.userId, dto);
  }

  @Post(':id/read')
  markRead(@Param('id') id: string, @Req() req: any) {
    return this.messagesService.markRead(id, req.user.userId);
  }
}
