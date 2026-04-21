import { notFound } from 'next/navigation';
import { queryAEM } from '@/lib/aem-client';
import { QUERIES } from '@/lib/queries';
import { ArticleBySlugResponse } from '@/types/aem';
import ArticleDetailComponent from '@/components/ArticleDetail';

export const revalidate = 3600;
export const dynamicParams = true;

export default async function ArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const data = await queryAEM<ArticleBySlugResponse>(QUERIES.ARTICLE_BY_SLUG, { slug });
  const article = data?.articleList?.items?.[0];

  if (!article) notFound();

  return <ArticleDetailComponent article={article} />;
}
