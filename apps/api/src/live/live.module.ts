import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { LiveController } from './live.controller';
import { LiveRoomsService } from './live.service';
import { SfuProvider } from './sfu.provider';
import { LiveGateway } from './live.gateway';

@Module({
  imports: [JwtModule.register({})],
  controllers: [LiveController],
  providers: [LiveRoomsService, SfuProvider, LiveGateway],
})
export class LiveModule {}
