import { IsInt, IsOptional, IsString, Min } from 'class-validator';

export class GetChapterQueryDto {
  @IsString() bookId: string;
  @IsInt() @Min(1) chapter: number;
}

export class GetVersesQueryDto {
  @IsString() bookId: string;
  @IsInt() @Min(1) chapter: number;
  @IsInt() @Min(1) verseStart: number;
  @IsOptional() @IsInt() @Min(1) verseEnd?: number;
}

export class CreateBookmarkDto {
  @IsString() bookId: string;
  @IsInt() chapter: number;
  @IsInt() verseStart: number;
  @IsOptional() @IsInt() verseEnd?: number;
  @IsString() referenceLabel: string;
  @IsOptional() @IsString() note?: string;
  @IsOptional() @IsString() highlightedColor?: string;
}
