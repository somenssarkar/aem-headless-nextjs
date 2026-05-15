import postsListMock from '@/data/mock/wp/posts-list.json';
import postBySlugMock from '@/data/mock/wp/post-by-slug.json';

const MOCKS: Record<string, unknown> = {
  'posts-list': postsListMock,
  'post-by-slug': postBySlugMock,
};

const MOCK_MODE = process.env.WP_MOCK_MODE === 'true';

async function fetchFromWp<T>(
  query: string,
  variables: Record<string, unknown>
): Promise<T> {
  const endpoint = process.env.WP_GRAPHQL_ENDPOINT;
  if (!endpoint) throw new Error('WP_GRAPHQL_ENDPOINT is not set');

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query, variables }),
    next: { revalidate: 3600 },
  });

  if (!res.ok) throw new Error(`WPGraphQL error: ${res.status}`);
  const json = await res.json();
  if (json.errors) throw new Error(JSON.stringify(json.errors));
  return json.data as T;
}

/**
 * Execute a WPGraphQL query.
 * q.mockKey identifies the fallback JSON file in src/data/mock/wp/.
 * Falls back to mock on any fetch error (same pattern as queryAEM).
 */
export async function queryWp<T>(
  q: { query: string; mockKey: string },
  variables: Record<string, unknown> = {}
): Promise<T> {
  if (MOCK_MODE) {
    const mock = MOCKS[q.mockKey];
    if (!mock) throw new Error(`No WP mock for key: ${q.mockKey}`);
    return mock as T;
  }
  try {
    return await fetchFromWp<T>(q.query, variables);
  } catch {
    const mock = MOCKS[q.mockKey];
    if (!mock) throw new Error(`WPGraphQL fetch failed and no mock for key: ${q.mockKey}`);
    return mock as T;
  }
}
