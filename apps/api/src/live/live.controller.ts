import { Body, Controller, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { LiveRoomsService } from './live.service';
import { CreateRoomDto, RoomRoleChangeDto, RemoveParticipantDto } from './dto';

@UseGuards(JwtAuthGuard)
@Controller('live')
export class LiveController {
  constructor(private readonly liveRoomsService: LiveRoomsService) {}

  @Get('rooms')
  list() {
    return this.liveRoomsService.list();
  }

  @Post('rooms')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  create(@Req() req: any, @Body() dto: CreateRoomDto) {
    return this.liveRoomsService.create(req.user.userId, dto);
  }

  @Get('rooms/:id')
  getRoom(@Param('id') id: string) {
    return this.liveRoomsService.getRoom(id);
  }

  @Post('rooms/:id/start')
  start(@Param('id') id: string, @Req() req: any) {
    return this.liveRoomsService.startScheduled(id, req.user.userId);
  }

  @Post('rooms/:id/token')
  join(@Param('id') id: string, @Req() req: any) {
    return this.liveRoomsService.joinAndGetToken(id, req.user.userId, req.user.username);
  }

  @Post('rooms/:id/raise-hand')
  raiseHand(@Param('id') id: string, @Req() req: any) {
    return this.liveRoomsService.raiseHand(id, req.user.userId);
  }

  @Post('rooms/:id/role')
  changeRole(@Param('id') id: string, @Req() req: any, @Body() dto: RoomRoleChangeDto) {
    return this.liveRoomsService.changeRole(id, req.user.userId, dto);
  }

  @Post('rooms/:id/remove')
  remove(@Param('id') id: string, @Req() req: any, @Body() dto: RemoveParticipantDto) {
    return this.liveRoomsService.removeParticipant(id, req.user.userId, dto.targetUserId, dto.reason);
  }

  @Post('rooms/:id/end')
  end(@Param('id') id: string, @Req() req: any) {
    return this.liveRoomsService.endRoom(id, req.user.userId);
  }
}
