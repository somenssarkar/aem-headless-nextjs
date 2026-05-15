import Link from 'next/link';
import { queryWp } from '@/lib/wordpress/wp-client';
import { WP_POSTS_LIST } from '@/lib/wordpress/queries';
import type { WpPostsListResponse } from '@/types/wordpress';
import WpPostCard from '@/components/WpPostCard';

export const revalidate = 3600;

const WP_CATEGORIES = ['AEM', 'AEP', 'AJO', 'Architecture', 'DevOps'];

export default async function WpPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;

  const data = await queryWp<WpPostsListResponse>(
    WP_POSTS_LIST,
    { first: 24, ...(category ? { categoryName: category } : {}) },
  );
  const posts = data?.posts?.nodes ?? [];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">WordPress Community</h1>
        <p className="text-sm text-gray-500 mt-1">Community posts from the WordPress CMS source</p>
      </div>

      <div className="flex flex-wrap gap-2 mb-8">
        <Link
          href="/wp"
          className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
            !category ? 'bg-amber-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          All
        </Link>
        {WP_CATEGORIES.map(cat => (
          <Link
            key={cat}
            href={`/wp?category=${cat}`}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
              category === cat ? 'bg-amber-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {cat}
          </Link>
        ))}
      </div>

      {posts.length === 0 ? (
        <p className="text-gray-400">No posts found{category ? ` for category "${category}"` : ''}.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map(post => (
            <WpPostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
