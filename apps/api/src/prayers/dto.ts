import { IsBoolean, IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

const VISIBILITIES = ['public', 'followers', 'group', 'private'] as const;

export class CreatePrayerRequestDto {
  @IsString() @MaxLength(120) title: string;
  @IsString() @MaxLength(2000) description: string;
  @IsOptional() @IsString() category?: string;
  @IsIn(VISIBILITIES) visibility: (typeof VISIBILITIES)[number];
  @IsOptional() @IsUUID() groupId?: string;
  @IsOptional() @IsBoolean() isAnonymous?: boolean;
  @IsOptional() @IsString() imageUrl?: string;
}

export class UpdatePrayerRequestDto {
  @IsOptional() @IsString() @MaxLength(120) title?: string;
  @IsOptional() @IsString() @MaxLength(2000) description?: string;
  @IsOptional() @IsIn(VISIBILITIES) visibility?: (typeof VISIBILITIES)[number];
}

export class CreateCommentDto {
  @IsString() @MaxLength(1000) body: string;
}

export class CreateJournalEntryDto {
  @IsOptional() @IsString() @MaxLength(120) title?: string;
  @IsString() @MaxLength(2000) body: string;
  @IsOptional() @IsString() scriptureReference?: string;
  @IsOptional() @IsString() category?: string;
}
