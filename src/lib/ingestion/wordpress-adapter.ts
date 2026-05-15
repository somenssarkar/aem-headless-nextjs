import type { SourceAdapter, Chunk } from './source-adapter';
import { stripHtml } from '../html-utils';
import { chunkText } from './chunk-utils';
import { WP_ALL_POSTS_PAGINATED } from '../wordpress/queries';
import type { WpAllPostsPage } from '../../types/wordpress';

async function fetchWp<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
  const endpoint = process.env.WP_GRAPHQL_ENDPOINT;
  if (!endpoint) throw new Error('WP_GRAPHQL_ENDPOINT is not set');
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`WPGraphQL ${res.status}`);
  const json = await res.json();
  if (json.errors) throw new Error(JSON.stringify(json.errors));
  return json.data as T;
}

export const wordpressAdapter: SourceAdapter = {
  name: 'wordpress',
  async *fetch(): AsyncIterable<Chunk> {
    console.log('  Fetching WordPress posts (paginated)...');
    let after: string | null = null;
    let pageCount = 0;

    do {
      const data: WpAllPostsPage = await fetchWp<WpAllPostsPage>(
        WP_ALL_POSTS_PAGINATED,
        { after: after ?? undefined },
      );
      const nodes = data.posts.nodes;
      const pageInfo = data.posts.pageInfo;
      pageCount++;
      console.log(`  Page ${pageCount}: ${nodes.length} posts`);

      for (const post of nodes) {
        const categories = post.categories.nodes.map(c => c.name);
        const tags = post.tags.nodes.map(t => t.name);
        const meta = {
          title: post.title,
          url: `/wp/${post.slug}`,
          publishedDate: post.date,
          modifiedDate: post.modified,
          categories,
          tags,
          sourceLabel: 'WordPress',
        };

        // Title + excerpt chunk — mirrors AEM's title_summary chunk
        const excerptText = stripHtml(post.excerpt ?? '');
        if (excerptText) {
          yield {
            path: `wp:post:${post.id}:summary`,
            source: 'wordpress',
            model: 'WPPost',
            chunk_type: 'title_summary',
            content: `${post.title}\n${excerptText}`,
            metadata: meta,
          };
        }

        // Body chunks (800-char windows, 100-char overlap)
        const body = stripHtml(post.content ?? '');
        for (const [i, text] of chunkText(body, 800, 100).entries()) {
          yield {
            path: `wp:post:${post.id}:body:${i}`,
            source: 'wordpress',
            model: 'WPPost',
            chunk_type: 'body',
            content: text,
            metadata: meta,
          };
        }
      }

      after = pageInfo.hasNextPage ? pageInfo.endCursor : null;
    } while (after);
  },
};
