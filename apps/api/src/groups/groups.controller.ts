import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { GroupsService } from './groups.service';
import { CreateGroupDto, UpdateGroupDto, InviteMemberDto, ChangeMemberRoleDto, SetScheduleDto, PostDiscussionDto } from './dto';

@UseGuards(JwtAuthGuard)
@Controller('groups')
export class GroupsController {
  constructor(private readonly groupsService: GroupsService) {}

  @Get()
  discover(@Req() req: any, @Query('type') type?: string) {
    return this.groupsService.discover(req.user.userId, type);
  }

  @Get('mine')
  mine(@Req() req: any) {
    return this.groupsService.myGroups(req.user.userId);
  }

  @Post()
  create(@Req() req: any, @Body() dto: CreateGroupDto) {
    return this.groupsService.create(req.user.userId, dto);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.groupsService.findOne(id, req.user.userId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Req() req: any, @Body() dto: UpdateGroupDto) {
    return this.groupsService.update(id, req.user.userId, dto);
  }

  @Post(':id/join')
  join(@Param('id') id: string, @Req() req: any) {
    return this.groupsService.join(id, req.user.userId);
  }

  @Delete(':id/members/me')
  leave(@Param('id') id: string, @Req() req: any) {
    return this.groupsService.leave(id, req.user.userId);
  }

  @Post(':id/invite')
  invite(@Param('id') id: string, @Req() req: any, @Body() dto: InviteMemberDto) {
    return this.groupsService.invite(id, req.user.userId, dto.userId);
  }

  @Post('invites/:inviteId/respond')
  respondToInvite(@Param('inviteId') inviteId: string, @Req() req: any, @Body('accept') accept: boolean) {
    return this.groupsService.respondToInvite(inviteId, req.user.userId, accept);
  }

  @Post('invites/:inviteId/approve')
  approveJoinRequest(@Param('inviteId') inviteId: string, @Req() req: any, @Body('approve') approve: boolean) {
    return this.groupsService.approveJoinRequest(inviteId, req.user.userId, approve);
  }

  @Get(':id/members')
  listMembers(@Param('id') id: string, @Req() req: any) {
    return this.groupsService.listMembers(id, req.user.userId);
  }

  @Patch(':id/members/:userId')
  changeMemberRole(@Param('id') id: string, @Param('userId') userId: string, @Req() req: any, @Body() dto: ChangeMemberRoleDto) {
    return this.groupsService.changeMemberRole(id, req.user.userId, userId, dto);
  }

  @Delete(':id/members/:userId')
  removeMember(@Param('id') id: string, @Param('userId') userId: string, @Req() req: any) {
    return this.groupsService.removeMember(id, req.user.userId, userId);
  }

  @Patch(':id/schedule')
  setSchedule(@Param('id') id: string, @Req() req: any, @Body() dto: SetScheduleDto) {
    return this.groupsService.setSchedule(id, req.user.userId, dto);
  }

  @Get(':id/discussions')
  listDiscussions(@Param('id') id: string, @Req() req: any) {
    return this.groupsService.listDiscussions(id, req.user.userId);
  }

  @Post(':id/discussions')
  postDiscussion(@Param('id') id: string, @Req() req: any, @Body() dto: PostDiscussionDto) {
    return this.groupsService.postDiscussion(id, req.user.userId, dto);
  }
}
