import Link from 'next/link';
import { ArticleListItem } from '@/types/aem';

const DIFFICULTY_COLORS: Record<string, string> = {
  Beginner: 'bg-green-100 text-green-700',
  Intermediate: 'bg-yellow-100 text-yellow-700',
  Advanced: 'bg-red-100 text-red-700',
};

const CATEGORY_COLORS: Record<string, string> = {
  AEM: 'bg-blue-100 text-blue-700',
  AEP: 'bg-purple-100 text-purple-700',
  AJO: 'bg-orange-100 text-orange-700',
  Architecture: 'bg-teal-100 text-teal-700',
  DevOps: 'bg-gray-100 text-gray-700',
};

export default function ArticleCard({ article }: { article: ArticleListItem }) {
  const date = new Date(article.khPublishedDate).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });

  return (
    <Link
      href={`/articles/${article.khSlug}`}
      className="block bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow"
    >
      <div className="flex items-center gap-2 mb-3">
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${CATEGORY_COLORS[article.khCategory] ?? 'bg-gray-100 text-gray-600'}`}>
          {article.khCategory}
        </span>
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${DIFFICULTY_COLORS[article.khDifficulty] ?? 'bg-gray-100 text-gray-600'}`}>
          {article.khDifficulty}
        </span>
      </div>

      <h2 className="font-semibold text-gray-900 text-lg leading-snug mb-2 line-clamp-2">
        {article.khTitle}
      </h2>
      <p className="text-gray-500 text-sm line-clamp-3 mb-4">{article.khSummary}</p>

      <div className="flex items-center justify-between text-xs text-gray-400">
        <span>{article.khAuthor?.khName ?? 'Unknown author'}</span>
        <span>{date}</span>
      </div>
    </Link>
  );
}
