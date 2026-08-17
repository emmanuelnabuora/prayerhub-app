import { Body, Controller, Delete, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto';

@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  me(@Req() req: any) {
    return this.usersService.findById(req.user.userId);
  }

  @Patch('me')
  updateMe(@Req() req: any, @Body() dto: UpdateProfileDto) {
    return this.usersService.updateProfile(req.user.userId, dto);
  }

  @Get('search')
  search(@Query('q') q: string) {
    return this.usersService.search(q ?? '');
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: any) {
    // findById enforces that private profile fields only return for the owner.
    return this.usersService.findById(id, req.user.userId);
  }

  @Post(':id/follow')
  follow(@Param('id') id: string, @Req() req: any) {
    return this.usersService.follow(req.user.userId, id);
  }

  @Delete(':id/follow')
  unfollow(@Param('id') id: string, @Req() req: any) {
    return this.usersService.unfollow(req.user.userId, id);
  }

  @Post(':id/block')
  block(@Param('id') id: string, @Req() req: any) {
    return this.usersService.block(req.user.userId, id);
  }

  @Get(':id/followers')
  followers(@Param('id') id: string) {
    return this.usersService.listFollowers(id);
  }

  @Get(':id/following')
  following(@Param('id') id: string) {
    return this.usersService.listFollowing(id);
  }
}
