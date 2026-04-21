import Link from 'next/link';
import { queryAEM } from '@/lib/aem-client';
import { QUERIES, CATEGORIES } from '@/lib/queries';
import { ArticleListResponse } from '@/types/aem';
import ArticleCard from '@/components/ArticleCard';

export const revalidate = 3600;

export default async function ArticlesPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;

  const data = await queryAEM<ArticleListResponse>(
    category ? QUERIES.ARTICLES_BY_CATEGORY : QUERIES.ARTICLES_LIST,
    category ? { category, limit: 24 } : { limit: 24 }
  );
  const articles = data?.articleList?.items ?? [];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Articles</h1>

      <div className="flex flex-wrap gap-2 mb-8">
        <Link
          href="/articles"
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
            !category ? 'bg-blue-700 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          All
        </Link>
        {CATEGORIES.map((cat) => (
          <Link
            key={cat}
            href={`/articles?category=${cat}`}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              category === cat ? 'bg-blue-700 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {cat}
          </Link>
        ))}
      </div>

      {articles.length === 0 ? (
        <p className="text-gray-400">No articles found for this category.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {articles.map((article) => (
            <ArticleCard key={article._path} article={article} />
          ))}
        </div>
      )}
    </div>
  );
}
