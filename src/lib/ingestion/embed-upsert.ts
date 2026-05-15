import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';
import type { Chunk } from './source-adapter';

interface Clients {
  supabase: SupabaseClient;
  genai: GoogleGenAI;
}

let _clients: Clients | null = null;

function getClients(): Clients {
  if (!_clients) {
    _clients = {
      supabase: createClient(
        (process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL)!,
        (process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_KEY)!,
      ),
      genai: new GoogleGenAI({ apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY! }),
    };
  }
  return _clients;
}

export async function embedAndUpsert(chunks: Chunk[]) {
  if (chunks.length === 0) return;
  const { supabase, genai } = getClients();
  const result = await genai.models.embedContent({
    model: 'gemini-embedding-001',
    contents: chunks.map(c => c.content),
    config: { taskType: 'RETRIEVAL_DOCUMENT', outputDimensionality: 768 },
  });
  const embeddings = result.embeddings ?? [];
  const rows = chunks.map((chunk, i) => ({
    path: chunk.path,
    model: chunk.model,
    chunk_type: chunk.chunk_type,
    content: chunk.content,
    metadata: { ...chunk.metadata, source: chunk.source },
    embedding: embeddings[i].values!,
    synced_at: new Date().toISOString(),
  }));
  const { error } = await supabase
    .from('cf_embeddings')
    .upsert(rows, { onConflict: 'path' });
  if (error) throw error;
  console.log(`  ✓ Upserted ${rows.length} chunks`);
}
