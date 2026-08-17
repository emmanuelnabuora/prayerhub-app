import { Module } from '@nestjs/common';
import { PostsController, TestimoniesController } from './social.controller';
import { PostsService } from './posts.service';
import { TestimoniesService } from './testimonies.service';

@Module({
  controllers: [PostsController, TestimoniesController],
  providers: [PostsService, TestimoniesService],
})
export class SocialModule {}
