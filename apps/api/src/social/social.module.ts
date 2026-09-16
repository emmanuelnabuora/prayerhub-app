import { Module } from '@nestjs/common';
import { PostsController, TestimoniesController } from './social.controller';
import { PostsService } from './posts.service';
import { TestimoniesService } from './testimonies.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [NotificationsModule],
  controllers: [PostsController, TestimoniesController],
  providers: [PostsService, TestimoniesService],
})
export class SocialModule {}
