import Link from 'next/link';
import { stripHtml } from '@/lib/html-utils';
import type { WpPostListItem } from '@/types/wordpress';

const CATEGORY_COLORS: Record<string, string> = {
  AEM: 'bg-blue-100 text-blue-700',
  AEP: 'bg-purple-100 text-purple-700',
  AJO: 'bg-orange-100 text-orange-700',
  Architecture: 'bg-teal-100 text-teal-700',
  DevOps: 'bg-gray-100 text-gray-700',
};

export default function WpPostCard({ post }: { post: WpPostListItem }) {
  const date = new Date(post.date).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });
  const primaryCategory = post.categories.nodes[0]?.name ?? 'WordPress';
  const excerpt = stripHtml(post.excerpt ?? '');

  return (
    <Link
      href={`/wp/${post.slug}`}
      className="block bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow"
    >
      <div className="flex items-center gap-2 mb-3">
        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${CATEGORY_COLORS[primaryCategory] ?? 'bg-gray-100 text-gray-600'}`}>
          {primaryCategory}
        </span>
        <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
          WordPress
        </span>
      </div>

      <h2 className="font-semibold text-gray-900 text-lg leading-snug mb-2 line-clamp-2">
        {post.title}
      </h2>
      <p className="text-gray-500 text-sm line-clamp-3 mb-4">{excerpt}</p>

      <div className="flex items-center justify-between text-xs text-gray-400">
        <span>{post.author?.node?.name ?? 'Community'}</span>
        <span>{date}</span>
      </div>
    </Link>
  );
}
