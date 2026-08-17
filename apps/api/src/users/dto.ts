import { IsArray, IsOptional, IsString } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional() @IsString() displayName?: string;
  @IsOptional() @IsString() country?: string;
  @IsOptional() @IsString() timezone?: string;
  @IsOptional() @IsArray() languages?: string[];
  @IsOptional() @IsString() churchAffiliation?: string;
  @IsOptional() @IsString() bio?: string;
  @IsOptional() @IsArray() interests?: string[];
}
