import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { LiveController } from './live.controller';
import { LiveRoomsService } from './live.service';
import { SfuProvider } from './sfu.provider';
import { LiveGateway } from './live.gateway';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [JwtModule.register({}), NotificationsModule],
  controllers: [LiveController],
  providers: [LiveRoomsService, SfuProvider, LiveGateway],
})
export class LiveModule {}
