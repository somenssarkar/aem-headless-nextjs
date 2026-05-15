// Run:         npx tsx scripts/ingest.ts
// Incremental: npx tsx scripts/ingest.ts --since=2026-04-20T00:00:00Z
// Single src:  npx tsx scripts/ingest.ts --source=aem-cf

import { readFileSync } from 'fs';
try {
  for (const line of readFileSync('.env.local', 'utf-8').split('\n')) {
    const m = line.match(/^([^#=\s][^=]*)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
} catch { /* .env.local is optional */ }

import type { SourceAdapter, Chunk } from '../src/lib/ingestion/source-adapter';
import { createAemAdapter } from '../src/lib/ingestion/aem-adapter';
import { createEdsAdapter } from '../src/lib/ingestion/eds-adapter';
import { wordpressAdapter } from '../src/lib/ingestion/wordpress-adapter';
import { embedAndUpsert } from '../src/lib/ingestion/embed-upsert';
import { createClient } from '@supabase/supabase-js';

const since = process.argv.find(a => a.startsWith('--since='))?.split('=')[1];
const sourceFilter = process.argv.find(a => a.startsWith('--source='))?.split('=')[1];

const allAdapters: SourceAdapter[] = [
  createAemAdapter(since),
  createEdsAdapter(since),
  wordpressAdapter,
  // drupal adapter will be registered here in Track 3
];

const adapters = sourceFilter
  ? allAdapters.filter(a => a.name === sourceFilter)
  : allAdapters;

async function main() {
  console.log(`Multi-CMS Ingestion — ${since ? `incremental since ${since}` : 'full sync'}`);
  if (adapters.length === 0) {
    console.error(`No adapter found for --source=${sourceFilter}`);
    process.exit(1);
  }

  for (const adapter of adapters) {
    console.log(`\n[${adapter.name}] Starting ingestion...`);
    const batch: Chunk[] = [];
    for await (const chunk of adapter.fetch()) {
      batch.push(chunk);
      if (batch.length >= 50) {
        await embedAndUpsert(batch);
        batch.length = 0;
      }
    }
    if (batch.length) await embedAndUpsert(batch);
    console.log(`[${adapter.name}] Done.`);
  }

  const supabase = createClient(
    (process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL)!,
    (process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_KEY)!,
  );
  const { count } = await supabase
    .from('cf_embeddings')
    .select('*', { count: 'exact', head: true });
  console.log(`\nDone. Total chunks in pgvector: ${count}`);
}

main().catch(err => { console.error(err); process.exit(1); });
