import type { SourceAdapter, Chunk } from './source-adapter';
import { stripHtml } from '../html-utils';

const EDS_BASE_URL = 'https://main--aem-eds-blog--somenssarkar.aem.live';

type EdsPost = { path: string; title: string; description: string; lastModified: string };

async function fetchEDSPosts(): Promise<EdsPost[]> {
  const idxRes = await fetch(`${EDS_BASE_URL}/query-index.json`);
  if (idxRes.ok) {
    const { data } = (await idxRes.json()) as { data: EdsPost[] };
    return data.filter(p => /^\/blog\/.+/.test(p.path));
  }

  console.log('  → query-index.json not found, parsing blog index page');
  const indexRes = await fetch(`${EDS_BASE_URL}/blog/index.plain.html`);
  if (!indexRes.ok) {
    console.warn(`  ⚠ Blog index plain HTML unavailable (${indexRes.status}) — skipping EDS`);
    return [];
  }
  const html = await indexRes.text();
  const seen = new Set<string>();
  for (const m of html.matchAll(/href="(?:https?:\/\/[^"\/]+)?(\/blog\/[^/"?#\s]+)"/g)) {
    seen.add(m[1]);
  }
  return [...seen].map(path => ({
    path,
    title: path.split('/').pop()!.replace(/-/g, ' '),
    description: '',
    lastModified: '',
  }));
}

export function createEdsAdapter(since?: string): SourceAdapter {
  return {
    name: 'eds',
    async *fetch(): AsyncIterable<Chunk> {
      console.log('  Fetching EDS Blog Posts...');
      const blogPosts = await fetchEDSPosts();
      console.log(`  Found ${blogPosts.length} EDS blog post(s)`);

      for (const post of blogPosts) {
        if (since && post.lastModified) {
          // EDS lastModified is a Unix timestamp (seconds)
          if (Number(post.lastModified) * 1000 < new Date(since).getTime()) continue;
        }

        const plainRes = await fetch(`${EDS_BASE_URL}${post.path}.plain.html`);
        const bodyText = plainRes.ok ? stripHtml(await plainRes.text()) : '';

        const meta = { title: post.title, path: post.path };

        yield {
          path: `eds:${post.path}#summary`,
          source: 'eds',
          model: 'EDS_BlogPost',
          chunk_type: 'title_summary',
          content: `${post.title}\n${post.description}`,
          metadata: meta,
        };

        if (bodyText) {
          yield {
            path: `eds:${post.path}#body`,
            source: 'eds',
            model: 'EDS_BlogPost',
            chunk_type: 'body',
            content: bodyText,
            metadata: meta,
          };
        }
      }
    },
  };
}
