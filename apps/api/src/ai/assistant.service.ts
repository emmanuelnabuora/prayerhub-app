import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from '../database/database.module';
import { AnthropicProvider } from './anthropic.provider';
import {
  AskDto, StudyQuestionsDto, DevotionalPromptDto, ReadingPlanDto,
  SummarizeDiscussionDto, StructurePrayerDto,
} from './dto';

@Injectable()
export class AssistantService {
  constructor(
    @Inject(PG_POOL) private readonly db: Pool,
    private readonly anthropic: AnthropicProvider,
  ) {}

  async ask(userId: string, dto: AskDto) {
    const priorTurns = dto.conversationId ? await this.loadTurns(dto.conversationId, userId) : [];
    const answer = await this.anthropic.complete(dto.question, priorTurns);
    const conversationId = await this.persist(userId, 'ask', dto.conversationId, dto.question, answer);
    return { conversationId, answer };
  }

  async studyQuestions(userId: string, dto: StudyQuestionsDto) {
    const prompt = `Write 5-7 small-group Bible study discussion questions for the passage ${dto.passage}` +
      (dto.focus ? `, tailored ${dto.focus}.` : '.') +
      ` Include a one-sentence context note about the passage before the questions, clearly
        labeled as your own summary rather than Scripture itself. Number the questions.`;
    const answer = await this.anthropic.complete(prompt);
    const conversationId = await this.persist(userId, 'study_questions', undefined, prompt, answer);
    return { conversationId, answer };
  }

  async devotionalPrompt(userId: string, dto: DevotionalPromptDto) {
    const prompt = `Write a short devotional prompt (150-250 words) ` +
      (dto.theme ? `on the theme of "${dto.theme}"` : 'for today') +
      `. Include one supporting Bible reference (with the reference cited plainly), a brief
       reflection question, and close with a short suggested prayer starter — phrase it as a
       starting point in the reader's own words, not as words God requires.`;
    const answer = await this.anthropic.complete(prompt);
    const conversationId = await this.persist(userId, 'devotional', undefined, prompt, answer);
    return { conversationId, answer };
  }

  async readingPlan(userId: string, dto: ReadingPlanDto) {
    const days = dto.durationDays ?? 30;
    const prompt = `Suggest a ${days}-day Bible reading plan to help someone "${dto.goal}".
      Give a day-by-day list of book/chapter readings (a short line each), grouped into
      weekly themes. Keep the whole response scannable, not essay-length.`;
    const answer = await this.anthropic.complete(prompt);
    const conversationId = await this.persist(userId, 'reading_plan', undefined, prompt, answer);
    return { conversationId, answer };
  }

  async summarizeDiscussion(userId: string, dto: SummarizeDiscussionDto) {
    const prompt = `Summarize the key themes and takeaways from this Bible study group
      discussion in 4-6 bullet points, staying neutral and not adding new theological claims
      beyond what participants said:\n\n${dto.discussionText}`;
    const answer = await this.anthropic.complete(prompt);
    const conversationId = await this.persist(userId, 'summarize', undefined, prompt, answer);
    return { conversationId, answer };
  }

  async structurePrayer(userId: string, dto: StructurePrayerDto) {
    const prompt = `Someone wants help structuring a personal prayer about: "${dto.situation}".
      Offer a simple structure (e.g. adoration, confession, thanksgiving, supplication) with
      a few example phrases they could adapt in their own words — make clear this is a
      starting scaffold, not a required script, and that they should pray in whatever way
      feels genuine to them.`;
    const answer = await this.anthropic.complete(prompt);
    const conversationId = await this.persist(userId, 'structure_prayer', undefined, prompt, answer);
    return { conversationId, answer };
  }

  async getConversation(id: string, userId: string) {
    const conversation = await this.db.query(
      'select * from ai_conversations where id = $1 and user_id = $2', [id, userId],
    );
    if (!conversation.rowCount) throw new NotFoundException('Conversation not found');
    const messages = await this.db.query(
      'select role, content, created_at from ai_messages where conversation_id = $1 order by created_at asc',
      [id],
    );
    return { ...conversation.rows[0], messages: messages.rows };
  }

  private async loadTurns(conversationId: string, userId: string): Promise<{ role: 'user' | 'assistant'; content: string }[]> {
    const owned = await this.db.query(
      'select 1 from ai_conversations where id = $1 and user_id = $2', [conversationId, userId],
    );
    if (!owned.rowCount) return []; // silently starts fresh rather than leaking another user's thread
    const result = await this.db.query(
      'select role, content from ai_messages where conversation_id = $1 order by created_at asc',
      [conversationId],
    );
    return result.rows;
  }

  private async persist(
    userId: string,
    kind: string,
    existingConversationId: string | undefined,
    userText: string,
    assistantText: string,
  ) {
    let conversationId = existingConversationId;
    if (!conversationId) {
      const created = await this.db.query(
        'insert into ai_conversations (user_id, kind) values ($1, $2) returning id',
        [userId, kind],
      );
      conversationId = created.rows[0].id;
    }
    await this.db.query(
      `insert into ai_messages (conversation_id, role, content) values ($1, 'user', $2), ($1, 'assistant', $3)`,
      [conversationId, userText, assistantText],
    );
    return conversationId;
  }
}
