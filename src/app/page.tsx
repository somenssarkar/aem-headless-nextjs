import Link from 'next/link';
import { queryAEM } from '@/lib/aem-client';
import { QUERIES, CATEGORIES } from '@/lib/queries';
import { ArticleListResponse } from '@/types/aem';
import ArticleCard from '@/components/ArticleCard';

export const revalidate = 3600;

export default async function HomePage() {
  const data = await queryAEM<ArticleListResponse>(QUERIES.ARTICLES_LIST, { limit: 6 });
  const articles = data?.articleList?.items ?? [];

  return (
    <div>
      <section className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">AEM Developer Knowledge Hub</h1>
        <p className="text-gray-500 text-lg">
          Technical articles, FAQs and tutorials on AEM, AEP and AJO — authored in Content Fragments, delivered headlessly.
        </p>
      </section>

      <section className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Latest Articles</h2>
          <Link href="/articles" className="text-sm text-blue-600 hover:underline">View all →</Link>
        </div>
        {articles.length === 0 ? (
          <p className="text-gray-400">No articles found.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article) => (
              <ArticleCard key={article._path} article={article} />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-4">Browse by Category</h2>
        <div className="flex flex-wrap gap-3">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat}
              href={`/articles?category=${cat}`}
              className="px-4 py-2 rounded-full bg-blue-50 text-blue-700 text-sm font-medium hover:bg-blue-100 transition-colors"
            >
              {cat}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
