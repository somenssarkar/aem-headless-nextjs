import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { queryWp } from '@/lib/wordpress/wp-client';
import { WP_POST_BY_SLUG } from '@/lib/wordpress/queries';
import type { WpPostBySlugResponse } from '@/types/wordpress';
import WpPostDetailComponent from '@/components/WpPostDetail';

export const revalidate = 3600;
export const dynamicParams = true;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await queryWp<WpPostBySlugResponse>(WP_POST_BY_SLUG, { slug });
  const post = data?.post;

  if (!post) return { title: 'Post Not Found | AEM Knowledge Hub' };

  return {
    title: `${post.title} | AEM Knowledge Hub`,
    openGraph: {
      title: post.title,
      type: 'article',
      publishedTime: post.date,
      modifiedTime: post.modified,
      tags: post.tags.nodes.map(t => t.name),
    },
  };
}

export default async function WpPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await queryWp<WpPostBySlugResponse>(WP_POST_BY_SLUG, { slug });
  const post = data?.post;

  if (!post) notFound();

  return <WpPostDetailComponent post={post} />;
}
