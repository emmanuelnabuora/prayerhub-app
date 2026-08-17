import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import { EmbeddingProvider } from './embedding-provider.interface';

// Anthropic doesn't serve embeddings directly; Voyage AI is Anthropic's
// recommended embeddings partner. Matches the 1024-dim vector columns in
// migrations/0008_intelligence.sql (voyage-3). If VOYAGE_API_KEY isn't set,
// embed() resolves to null and callers treat that as "skip indexing this item"
// rather than throwing — semantic search is additive, never a hard dependency
// for posting a prayer request or feed post.
@Injectable()
export class VoyageEmbeddingProvider implements EmbeddingProvider {
  readonly dimensions = 1024;
  private readonly logger = new Logger(VoyageEmbeddingProvider.name);
  private readonly apiKey = process.env.VOYAGE_API_KEY;

  async embed(text: string): Promise<number[] | null> {
    if (!this.apiKey) return null;
    try {
      const { data } = await axios.post(
        'https://api.voyageai.com/v1/embeddings',
        { input: text, model: 'voyage-3' },
        { headers: { Authorization: `Bearer ${this.apiKey}` } },
      );
      return data.data[0].embedding;
    } catch (err) {
      this.logger.warn(`Embedding request failed, continuing without it: ${err}`);
      return null;
    }
  }
}
