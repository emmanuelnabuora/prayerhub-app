import { IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreateOrganizationDto {
  @IsString() @MaxLength(80) name: string;
  @IsString() @MaxLength(80) slug: string;
  @IsIn(['church', 'ministry']) type: 'church' | 'ministry';
  @IsOptional() @IsString() @MaxLength(1000) description?: string;
  @IsOptional() @IsString() coverImageUrl?: string;
  @IsOptional() @IsString() websiteUrl?: string;
}

export class UpdateOrganizationDto {
  @IsOptional() @IsString() @MaxLength(1000) description?: string;
  @IsOptional() @IsString() coverImageUrl?: string;
  @IsOptional() @IsString() websiteUrl?: string;
  @IsOptional() @IsString() livestreamUrl?: string;
}

export class AddLeaderDto {
  @IsUUID() userId: string;
}

export class CreateAnnouncementDto {
  @IsString() @MaxLength(120) title: string;
  @IsString() @MaxLength(2000) body: string;
}

export class LinkGroupDto {
  @IsUUID() groupId: string;
}
