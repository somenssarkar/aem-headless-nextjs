import articlesListMock from '../data/mock/articles-list.json';
import articleBySlugMock from '../data/mock/article-by-slug.json';
import faqsByCategoryMock from '../data/mock/faqs-by-category.json';
import tutorialsListMock from '../data/mock/tutorials-list.json';

const MOCKS: Record<string, unknown> = {
  'articles-list': articlesListMock,
  'articles-by-category': articlesListMock,
  'article-by-slug': articleBySlugMock,
  'faqs-by-category': faqsByCategoryMock,
  'tutorials-list': tutorialsListMock,
  'tutorial-by-slug': tutorialsListMock,
};

const AEM_BASE = process.env.AEM_HOST!;
const AEM_AUTH = process.env.AEM_AUTH!;
const MOCK_MODE = process.env.AEM_MOCK_MODE === 'true';

function mockFileName(queryName: string): string {
  return queryName.split('/').pop()!;
}

function getMock<T>(queryName: string): T {
  const key = mockFileName(queryName);
  const mock = MOCKS[key];
  if (!mock) throw new Error(`No mock available for: ${queryName}`);
  return mock as T;
}

async function fetchFromAEM<T>(
  queryName: string,
  variables: Record<string, unknown> = {}
): Promise<T> {
  const params = Object.entries(variables)
    .filter(([, v]) => v !== undefined && v !== null)
    .map(([k, v]) => `;${k}=${encodeURIComponent(String(v))}`)
    .join('');

  const url = `${AEM_BASE}/graphql/execute.json/${queryName}${params}`;

  const res = await fetch(url, {
    headers: {
      Authorization: AEM_AUTH,
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': 'true',
    },
    next: { revalidate: 3600 },
  });

  if (!res.ok) throw new Error(`AEM query failed: ${res.status} ${url}`);
  const json = await res.json();
  return json.data as T;
}

export async function queryAEM<T>(
  queryName: string,
  variables: Record<string, unknown> = {}
): Promise<T> {
  if (MOCK_MODE) {
    return getMock<T>(queryName);
  }
  try {
    return await fetchFromAEM<T>(queryName, variables);
  } catch {
    return getMock<T>(queryName);
  }
}
