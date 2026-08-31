import { IsArray, IsIn, IsOptional, IsString, IsUUID, MaxLength, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

const VISIBILITIES = ['public', 'private', 'invite_only'] as const;
const GROUP_TYPES = ['prayer', 'cell', 'bible_study'] as const;
const ROLES = ['member', 'moderator', 'leader'] as const;

export class CreateGroupDto {
  @IsString() @MaxLength(80) name: string;
  @IsOptional() @IsString() @MaxLength(1000) description?: string;
  @IsOptional() @IsString() coverImageUrl?: string;
  @IsIn(VISIBILITIES) visibility: (typeof VISIBILITIES)[number];
  @IsOptional() @IsIn(GROUP_TYPES) groupType?: (typeof GROUP_TYPES)[number];
}

export class UpdateGroupDto {
  @IsOptional() @IsString() @MaxLength(80) name?: string;
  @IsOptional() @IsString() @MaxLength(1000) description?: string;
  @IsOptional() @IsString() coverImageUrl?: string;
  @IsOptional() @IsIn(VISIBILITIES) visibility?: (typeof VISIBILITIES)[number];
}

export class InviteMemberDto {
  @IsUUID() userId: string;
}

export class ChangeMemberRoleDto {
  @IsIn(ROLES) role: (typeof ROLES)[number];
}

class ScheduleDto {
  @IsArray() @IsIn(['MO','TU','WE','TH','FR','SA','SU'], { each: true }) days: string[];
  @IsString() time: string;          // "06:00"
  @IsString() timezone: string;
  @IsOptional() durationMinutes?: number;
}

export class SetScheduleDto {
  @ValidateNested() @Type(() => ScheduleDto) schedule: ScheduleDto;
}
export class PostDiscussionDto {
  @IsString() @MaxLength(2000) body: string;
  @IsOptional() @IsString() @MaxLength(120) scriptureReference?: string;
}
