export interface EmbeddingProvider {
  readonly dimensions: number;
  embed(text: string): Promise<number[] | null>; // null = provider unavailable/unconfigured
}
