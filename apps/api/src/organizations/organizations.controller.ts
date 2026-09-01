import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { OrganizationsService } from './organizations.service';
import { CreateOrganizationDto, UpdateOrganizationDto, AddLeaderDto, CreateAnnouncementDto, LinkGroupDto } from './dto';

@UseGuards(JwtAuthGuard)
@Controller('organizations')
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Get()
  discover(@Query('type') type?: string) {
    return this.organizationsService.discover(type);
  }

  @Post()
  create(@Req() req: any, @Body() dto: CreateOrganizationDto) {
    return this.organizationsService.create(req.user.userId, dto);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.organizationsService.findOne(id, req.user.userId);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Req() req: any, @Body() dto: UpdateOrganizationDto) {
    return this.organizationsService.update(id, req.user.userId, dto);
  }

  // Platform-admin-only, enforced by RolesGuard — see docs/12b-SPRINT-8.md for why
  // this can't be self-service even for a verified-looking organization.
  @UseGuards(RolesGuard)
  @Roles('admin', 'super_admin')
  @Post(':id/verify')
  verify(@Param('id') id: string, @Req() req: any) {
    return this.organizationsService.verify(id, req.user.userId);
  }

  @Post(':id/follow')
  follow(@Param('id') id: string, @Req() req: any) {
    return this.organizationsService.follow(id, req.user.userId);
  }

  @Delete(':id/follow')
  unfollow(@Param('id') id: string, @Req() req: any) {
    return this.organizationsService.unfollow(id, req.user.userId);
  }

  @Post(':id/leaders')
  addLeader(@Param('id') id: string, @Req() req: any, @Body() dto: AddLeaderDto) {
    return this.organizationsService.addLeader(id, req.user.userId, dto.userId);
  }

  @Get(':id/announcements')
  listAnnouncements(@Param('id') id: string) {
    return this.organizationsService.listAnnouncements(id);
  }

  @Post(':id/announcements')
  postAnnouncement(@Param('id') id: string, @Req() req: any, @Body() dto: CreateAnnouncementDto) {
    return this.organizationsService.postAnnouncement(id, req.user.userId, dto);
  }

  @Get(':id/prayers')
  listPrayers(@Param('id') id: string) {
    return this.organizationsService.listPrayers(id);
  }

  @Post(':id/groups')
  linkGroup(@Param('id') id: string, @Req() req: any, @Body() dto: LinkGroupDto) {
    return this.organizationsService.linkGroup(id, req.user.userId, dto.groupId);
  }
}
