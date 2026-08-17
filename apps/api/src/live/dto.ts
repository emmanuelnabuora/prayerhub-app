import { IsBoolean, IsDateString, IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateRoomDto {
  @IsString() @MaxLength(120) title: string;
  @IsOptional() @IsString() topic?: string;
  @IsOptional() @IsUUID() groupId?: string;
  @IsOptional() @IsDateString() scheduledFor?: string;   // omit to start immediately
  @IsOptional() @IsString() recurringRule?: string;
}

export class RoomRoleChangeDto {
  @IsUUID() targetUserId: string;
  @IsIn(['co_host', 'speaker', 'listener']) role: 'co_host' | 'speaker' | 'listener';
}

export class RemoveParticipantDto {
  @IsUUID() targetUserId: string;
  @IsOptional() @IsString() reason?: string;
}

export class ReactionDto {
  @IsIn(['amen', 'pray_hands', 'heart', 'fire']) emoji: string;
}
