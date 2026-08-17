import { IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

export class AskDto {
  @IsString() @MaxLength(1000) question: string;
  @IsOptional() @IsUUID() conversationId?: string; // continue an existing thread
}

export class StudyQuestionsDto {
  @IsString() @MaxLength(120) passage: string; // e.g. "Romans 8:28-39"
  @IsOptional() @IsString() focus?: string;     // e.g. "for a youth group"
}

export class DevotionalPromptDto {
  @IsOptional() @IsString() theme?: string;     // e.g. "gratitude", "grief"
}

export class ReadingPlanDto {
  @IsString() goal: string;                     // e.g. "understand the Gospels in 30 days"
  @IsOptional() durationDays?: number;
}

export class SummarizeDiscussionDto {
  @IsString() @MaxLength(6000) discussionText: string; // pasted notes/comments to summarize
}

export class StructurePrayerDto {
  @IsString() @MaxLength(1000) situation: string; // what the person wants to pray about
}
