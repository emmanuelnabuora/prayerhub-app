import { Module, Global } from '@nestjs/common';
import { SearchController } from './embeddings.controller';
import { SemanticSearchService } from './semantic-search.service';
import { EmbeddingIndexerService, EMBEDDING_PROVIDER } from './embedding-indexer.service';
import { VoyageEmbeddingProvider } from './voyage-embedding.provider';

// @Global so PrayersModule/SocialModule can inject EmbeddingIndexerService for
// fire-and-forget indexing without a direct module-to-module import cycle.
@Global()
@Module({
  controllers: [SearchController],
  providers: [
    SemanticSearchService,
    EmbeddingIndexerService,
    { provide: EMBEDDING_PROVIDER, useClass: VoyageEmbeddingProvider },
  ],
  exports: [EmbeddingIndexerService],
})
export class EmbeddingsModule {}
