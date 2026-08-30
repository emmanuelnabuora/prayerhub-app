import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PrayersModule } from './prayers/prayers.module';
import { LiveModule } from './live/live.module';
import { GroupsModule } from './groups/groups.module';
import { BibleModule } from './bible/bible.module';
import { MediaModule } from './media/media.module';
import { SocialModule } from './social/social.module';
import { MessagesModule } from './messages/messages.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { EmbeddingsModule } from './embeddings/embeddings.module';
import { AiModule } from './ai/ai.module';
import { RecommendationsModule } from './recommendations/recommendations.module';
import { ModerationModule } from './moderation/moderation.module';
import { AdminModule } from './admin/admin.module';

import { HealthModule } from './health/health.module';
import { NotificationsModule } from './notifications/notifications.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    DatabaseModule,
    HealthModule,
    AuthModule,
    UsersModule,
    PrayersModule,
    LiveModule,
    GroupsModule,
    BibleModule,
    MediaModule,
    SocialModule,
    MessagesModule,
    OrganizationsModule,
    EmbeddingsModule,
    AiModule,
    RecommendationsModule,
    ModerationModule,
    AdminModule,
    NotificationsModule,
  ],
})
export class AppModule {}
