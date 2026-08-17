import { IsIn, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateReportDto {
  @IsIn(['user', 'prayer_request', 'comment', 'message', 'room', 'post', 'testimony']) targetType: string;
  @IsUUID() targetId: string;
  @IsString() @MaxLength(500) reason: string;
}

export class ResolveModerationCaseDto {
  @IsIn(['resolved', 'dismissed']) status: 'resolved' | 'dismissed';
  @IsString() @MaxLength(1000) resolutionNotes: string;
}
