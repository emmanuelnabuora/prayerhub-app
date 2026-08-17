import { Body, Controller, Delete, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { AdminService } from './admin.service';
import { GrantRoleDto } from './dto';

// Every route here is admin/super_admin only. Moderator-level actions (the
// moderation queue) live under their own /admin/moderation controller from
// Sprint 9 with a wider role set — kept separate rather than merged, since a
// moderator should never incidentally gain access to user role management or
// platform stats just because both paths start with /admin.
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin', 'super_admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('stats')
  stats() {
    return this.adminService.stats();
  }

  @Get('audit-logs')
  auditLogs(@Query('limit') limit?: string) {
    return this.adminService.listAuditLogs(Number(limit) || 50);
  }

  @Get('users')
  searchUsers(@Query('q') q: string) {
    return this.adminService.searchUsers(q ?? '');
  }

  @Post('users/roles')
  grantRole(@Req() req: any, @Body() dto: GrantRoleDto) {
    return this.adminService.grantRole(req.user.userId, dto.userId, dto.role);
  }

  @Delete('users/:userId/roles/:role')
  revokeRole(@Param('userId') userId: string, @Param('role') role: string, @Req() req: any) {
    return this.adminService.revokeRole(req.user.userId, userId, role);
  }
}
