import type { WpPostDetail } from '@/types/wordpress';

export default function WpPostDetailComponent({ post }: { post: WpPostDetail }) {
  const date = new Date(post.date).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });
  const primaryCategory = post.categories.nodes[0]?.name ?? 'WordPress';

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3 text-sm text-gray-500">
          <span className="font-medium text-amber-600">WordPress Community</span>
          <span>·</span>
          <span className="text-blue-700 font-medium">{primaryCategory}</span>
          <span>·</span>
          <span>{date}</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-3">{post.title}</h1>
      </div>

      {post.tags.nodes.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {post.tags.nodes.map(tag => (
            <span key={tag.slug} className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
              {tag.name}
            </span>
          ))}
        </div>
      )}

      <article
        className="prose prose-gray max-w-none mb-10"
        dangerouslySetInnerHTML={{ __html: post.content }}
      />

      <div className="border-t border-gray-200 pt-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-sm">
            {(post.author?.node?.name ?? 'C').charAt(0)}
          </div>
          <div>
            <p className="font-medium text-gray-900 text-sm">{post.author?.node?.name ?? 'Community'}</p>
            {post.author?.node?.description && (
              <p className="text-xs text-gray-500">{post.author.node.description}</p>
            )}
          </div>
          <span className="ml-auto text-xs font-medium px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
            WordPress
          </span>
        </div>
      </div>
    </div>
  );
}
