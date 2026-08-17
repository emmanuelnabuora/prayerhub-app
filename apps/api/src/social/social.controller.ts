import { Body, Controller, Delete, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PostsService } from './posts.service';
import { TestimoniesService } from './testimonies.service';
import { CreatePostDto, ReactionDto, CreateCommentDto, CreateTestimonyDto } from './dto';

@UseGuards(JwtAuthGuard)
@Controller('feed')
export class PostsController {
  constructor(private readonly postsService: PostsService) {}

  @Get()
  feed(@Req() req: any, @Query('page') page?: string, @Query('limit') limit?: string) {
    return this.postsService.feed(req.user.userId, Number(page) || 1, Number(limit) || 20);
  }

  @Post()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  create(@Req() req: any, @Body() dto: CreatePostDto) {
    return this.postsService.create(req.user.userId, dto);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req: any) {
    return this.postsService.findOne(id, req.user.userId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.postsService.remove(id, req.user.userId);
  }

  @Post(':id/react')
  react(@Param('id') id: string, @Req() req: any, @Body() dto: ReactionDto) {
    return this.postsService.react(id, req.user.userId, dto.type);
  }

  @Get(':id/comments')
  listComments(@Param('id') id: string, @Req() req: any) {
    return this.postsService.listComments(id, req.user.userId);
  }

  @Post(':id/comments')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  addComment(@Param('id') id: string, @Req() req: any, @Body() dto: CreateCommentDto) {
    return this.postsService.addComment(id, req.user.userId, dto);
  }
}

@UseGuards(JwtAuthGuard)
@Controller('testimonies')
export class TestimoniesController {
  constructor(private readonly testimoniesService: TestimoniesService) {}

  @Get()
  list(@Query('page') page?: string, @Query('limit') limit?: string) {
    return this.testimoniesService.list(Number(page) || 1, Number(limit) || 20);
  }

  @Post()
  create(@Req() req: any, @Body() dto: CreateTestimonyDto) {
    return this.testimoniesService.create(req.user.userId, dto);
  }

  @Post(':id/react')
  react(@Param('id') id: string, @Req() req: any, @Body('type') type: 'amen' | 'encourage') {
    return this.testimoniesService.react(id, req.user.userId, type);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: any) {
    return this.testimoniesService.remove(id, req.user.userId);
  }
}
