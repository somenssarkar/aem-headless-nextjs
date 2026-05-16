import { notFound } from 'next/navigation';
import { getDrupalCaseStudy } from '@/lib/drupal/drupal-client';
import DrupalCaseStudyDetail from '@/components/DrupalCaseStudyDetail';

export const revalidate = 3600;
export const dynamicParams = true;

export async function generateMetadata({ params }: { params: Promise<{ nid: string }> }) {
  const { nid } = await params;
  const cs = await getDrupalCaseStudy(nid);
  if (!cs) return {};
  return { title: cs.title, description: cs.summary };
}

export default async function DrupalCaseStudyPage({
  params,
}: {
  params: Promise<{ nid: string }>;
}) {
  const { nid } = await params;
  const cs = await getDrupalCaseStudy(nid);
  if (!cs) notFound();

  return <DrupalCaseStudyDetail cs={cs} />;
}
