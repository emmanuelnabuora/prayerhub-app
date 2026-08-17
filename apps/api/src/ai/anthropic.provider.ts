import { Injectable } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import { ASSISTANT_SYSTEM_PROMPT } from './assistant.prompts';

// Thin wrapper so AssistantService never touches the SDK directly — same
// isolation pattern as BibleProvider/StorageProvider, in case a future need
// arises to route through a different model or provider for cost/latency
// reasons without touching the six assistant modes built on top of this.
@Injectable()
export class AnthropicProvider {
  private client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  private model = process.env.ASSISTANT_MODEL ?? 'claude-sonnet-4-5';

  async complete(userPrompt: string, priorTurns: { role: 'user' | 'assistant'; content: string }[] = []) {
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: 1024,
      system: ASSISTANT_SYSTEM_PROMPT,
      messages: [...priorTurns, { role: 'user', content: userPrompt }],
    });
    const textBlock = response.content.find((block) => block.type === 'text');
    return textBlock?.type === 'text' ? textBlock.text : '';
  }
}
