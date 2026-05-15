export interface Chunk {
  path: string;
  source: 'aem-cf' | 'eds' | 'wordpress' | 'drupal';
  model: string;
  chunk_type: string;
  content: string;
  metadata: Record<string, unknown>;
}

export interface SourceAdapter {
  name: string;
  fetch(): AsyncIterable<Chunk>;
}
