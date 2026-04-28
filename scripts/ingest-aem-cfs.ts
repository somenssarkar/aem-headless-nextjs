// Run: npx tsx scripts/ingest-aem-cfs.ts
// Incremental: npx tsx scripts/ingest-aem-cfs.ts --since=2026-04-20T00:00:00Z

// Load .env.local (tsx does not auto-load it unlike Next.js)
import { readFileSync } from 'fs';
try {
  for (const line of readFileSync('.env.local', 'utf-8').split('\n')) {
    const m = line.match(/^([^#=\s][^=]*)=(.*)$/);
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
  }
} catch { /* .env.local is optional */ }

import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI } from '@google/genai';
import { generateText } from 'ai';
import { google } from '@ai-sdk/google';

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ')
    .trim();
}

const AEM_BASE = process.env.AEM_HOST ?? 'http://localhost:4502';
const AEM_AUTH = process.env.AEM_AUTH ?? 'Basic YWRtaW46YWRtaW4=';

const supabase = createClient(
  (process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL)!,
  (process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SERVICE_KEY)!
);
const genai = new GoogleGenAI({ apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY! });

const since = process.argv.find(a => a.startsWith('--since='))?.split('=')[1];

interface Chunk {
  path: string;
  model: string;
  chunk_type: string;
  content: string;
  metadata: Record<string, unknown>;
}

async function fetchAEM<T>(queryName: string, vars: Record<string, unknown> = {}): Promise<T> {
  const params = Object.entries(vars)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `;${k}=${encodeURIComponent(String(v))}`)
    .join('');
  const url = `${AEM_BASE}/graphql/execute.json/${queryName}${params}`;
  const res = await fetch(url, {
    headers: { Authorization: AEM_AUTH, 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error(`AEM ${res.status}: ${url}`);
  const json = await res.json();
  return json.data as T;
}

async function embedAndUpsert(chunks: Chunk[]) {
  if (chunks.length === 0) return;
  // taskType: RETRIEVAL_DOCUMENT optimises vectors for being retrieved (asymmetric RAG)
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
    metadata: chunk.metadata,
    embedding: embeddings[i].values!,
    synced_at: new Date().toISOString(),
  }));
  const { error } = await supabase
    .from('cf_embeddings')
    .upsert(rows, { onConflict: 'path' });
  if (error) throw error;
  console.log(`  ✓ Upserted ${rows.length} chunks`);
}

interface AuthorEntry {
  khName: string;
  articles: Array<{ khTitle: string; path: string }>;
}

async function generateSeoIfMissing(
  cfPath: string,
  title: string,
  bodyHtml: string
): Promise<string> {
  console.log(`  → Generating SEO description for: ${title}`);
  const { text } = await generateText({
    model: google('gemini-3-flash-preview'),
    prompt: `Write a 2-sentence SEO meta description for this AEM developer article.
Be specific, mention the key technologies, keep it under 155 characters total.

Title: ${title}
Article content:
${stripHtml(bodyHtml).slice(0, 2000)}

SEO Description (2 sentences, under 155 chars):`,
  });
  const seoDescription = text.trim();
  const res = await fetch(`${AEM_BASE}${cfPath}/jcr:content/data/master`, {
    method: 'POST',
    headers: { Authorization: AEM_AUTH, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ khSeoDescription: seoDescription }).toString(),
  });
  if (!res.ok) {
    console.warn(`  ⚠ AEM PATCH failed (${res.status}) — using generated value for this run`);
  } else {
    console.log(`  ✓ Saved to AEM Author: "${seoDescription.slice(0, 60)}..."`);
  }
  return seoDescription;
}

async function ingestArticles(): Promise<Map<string, AuthorEntry>> {
  console.log('\nIngesting Articles...');
  const authorMap = new Map<string, AuthorEntry>();
  const data = await fetchAEM<any>('knowledge-hub/articles-list');
  const chunks: Chunk[] = [];

  for (const a of data.articleList.items) {
    if (since && a.khPublishedDate && new Date(a.khPublishedDate) < new Date(since)) continue;

    // Auto-generate SEO description if missing — idempotent, writes to AEM Author only
    if (!a.khSeoDescription && a.khBody?.html) {
      a.khSeoDescription = await generateSeoIfMissing(a._path, a.khTitle, a.khBody.html);
    }

    const authorName = a.khAuthor?.khName ?? null;

    // Collect author → articles mapping for synthetic profile chunks (no extra AEM call)
    if (authorName) {
      const key = authorName.toLowerCase().replace(/\s+/g, '-');
      const entry: AuthorEntry = authorMap.get(key) ?? { khName: authorName, articles: [] };
      entry.articles.push({ khTitle: a.khTitle, path: a._path });
      authorMap.set(key, entry);
    }

    const meta = {
      title: a.khTitle,
      slug: a.khSlug,
      category: a.khCategory,
      tags: a.khTags,
      publishedDate: a.khPublishedDate,
      authorName,
    };

    // Chunk 1: title + authorName + summary — author name embedded for author queries
    chunks.push({
      path: `${a._path}#summary`,
      model: 'Article',
      chunk_type: 'title_summary',
      content: `${a.khTitle}\nAuthor: ${authorName ?? 'Unknown'}\n${a.khSummary}`,
      metadata: meta,
    });

    // Chunk 2: full body (HTML stripped)
    if (a.khBody?.html) {
      chunks.push({
        path: `${a._path}#body`,
        model: 'Article',
        chunk_type: 'body',
        content: stripHtml(a.khBody.html),
        metadata: meta,
      });
    }
  }
  await embedAndUpsert(chunks);
  return authorMap;
}

async function ingestAuthorProfiles(authorMap: Map<string, AuthorEntry>) {
  console.log('\nIngesting Author Profiles (synthetic)...');
  const chunks: Chunk[] = [];
  for (const [slug, entry] of authorMap) {
    const titleList = entry.articles.map(a => a.khTitle).join('; ');
    chunks.push({
      path: `synthetic-author-${slug}#profile`,
      model: 'Author',
      chunk_type: 'author_profile',
      content: `${entry.khName} has authored ${entry.articles.length} article${entry.articles.length !== 1 ? 's' : ''}: ${titleList}.`,
      metadata: { authorName: entry.khName, articleCount: entry.articles.length },
    });
  }
  await embedAndUpsert(chunks);
}

async function ingestFAQs() {
  console.log('\nIngesting FAQs...');
  for (const category of ['AEM', 'AEP', 'AJO']) {
    const data = await fetchAEM<any>('knowledge-hub/faqs-by-category', { category });
    const chunks: Chunk[] = data.faqList.items.map((faq: any) => ({
      path: faq._path,
      model: 'FAQ',
      chunk_type: 'qa',
      content: `Q: ${faq.khQuestion}\nA: ${stripHtml(faq.khAnswer?.html ?? '')}`,
      metadata: { category: faq.khCategory },
    }));
    await embedAndUpsert(chunks);
  }
}

async function ingestTutorials() {
  console.log('\nIngesting Tutorial Steps...');
  let data: any;
  try {
    data = await fetchAEM<any>('knowledge-hub/tutorials-list');
  } catch (e: any) {
    console.warn(`  ⚠ tutorials-list query not found in AEM (${e.message}) — skipping`);
    return;
  }
  const chunks: Chunk[] = [];
  for (const tutorial of data.tutorialList?.items ?? []) {
    for (const step of tutorial.khSteps ?? []) {
      chunks.push({
        path: step._path,
        model: 'TutorialStep',
        chunk_type: 'step',
        content: [step.khHeading, step.khInstruction, step.khCodeSnippet].filter(Boolean).join('\n'),
        metadata: { tutorialTitle: tutorial.khTitle, stepNumber: step.khStepNumber },
      });
    }
  }
  await embedAndUpsert(chunks);
}

async function main() {
  console.log(`AEM CF Ingestion — ${since ? `incremental since ${since}` : 'full sync'}`);
  const authorMap = await ingestArticles();
  await ingestFAQs();
  await ingestTutorials();
  await ingestAuthorProfiles(authorMap);
  const { count } = await supabase.from('cf_embeddings').select('*', { count: 'exact', head: true });
  console.log(`\nDone. Total chunks in pgvector: ${count}`);
}

main().catch(err => { console.error(err); process.exit(1); });
