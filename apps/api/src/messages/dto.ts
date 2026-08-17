import { IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class StartDirectConversationDto {
  @IsUUID() userId: string;
}

export class StartGroupConversationDto {
  @IsString() @MaxLength(80) title: string;
  @IsUUID(undefined, { each: true }) memberIds: string[];
}

export class SendMessageDto {
  @IsIn(['text', 'scripture', 'image', 'audio', 'prayer_request']) type: string;
  @IsOptional() @IsString() @MaxLength(2000) body?: string;
  @IsOptional() @IsString() scriptureReference?: string;
  @IsOptional() @IsUUID() mediaAssetId?: string;
  @IsOptional() @IsUUID() sharedPrayerRequestId?: string;
}
