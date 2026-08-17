import { Body, Controller, Post, Req, UseGuards, Param } from '@nestjs/common';
import { IsIn, IsInt, IsOptional, IsString } from 'class-validator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MediaService } from './media.service';

class RequestUploadDto {
  @IsIn(['audio', 'image', 'video']) mediaType: 'audio' | 'image' | 'video';
  @IsString() contentType: string;
}
class ConfirmUploadDto {
  @IsOptional() @IsInt() durationSeconds?: number;
}

@UseGuards(JwtAuthGuard)
@Controller('media')
export class MediaController {
  constructor(private readonly mediaService: MediaService) {}

  @Post('upload-url')
  requestUpload(@Req() req: any, @Body() dto: RequestUploadDto) {
    return this.mediaService.requestUpload(req.user.userId, dto.mediaType, dto.contentType);
  }

  @Post(':id/confirm')
  confirm(@Param('id') id: string, @Req() req: any, @Body() dto: ConfirmUploadDto) {
    return this.mediaService.confirmUpload(id, req.user.userId, dto.durationSeconds);
  }
}
