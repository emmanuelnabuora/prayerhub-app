import { IsIn, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class CreatePostDto {
  @IsIn(['text', 'scripture', 'audio', 'testimony_share']) type: string;
  @IsOptional() @IsString() @MaxLength(2000) body?: string;
  @IsOptional() @IsString() scriptureReference?: string;
  @IsOptional() @IsUUID() mediaAssetId?: string;
  @IsOptional() @IsUUID() sharedTestimonyId?: string;
  @IsOptional() @IsUUID() groupId?: string;
  @IsOptional() @IsIn(['public', 'followers', 'group']) visibility?: string;
}

export class ReactionDto {
  @IsIn(['amen', 'pray', 'encourage']) type: string;
}

export class CreateCommentDto {
  @IsString() @MaxLength(1000) body: string;
}

export class CreateTestimonyDto {
  @IsString() category: string;
  @IsOptional() @IsString() @MaxLength(2000) body?: string;
  @IsOptional() @IsUUID() mediaAssetId?: string;
  @IsIn(['text', 'audio', 'image', 'video']) mediaType: string;
}
