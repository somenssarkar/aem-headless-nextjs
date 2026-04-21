import { notFound } from 'next/navigation';
import { queryAEM } from '@/lib/aem-client';
import { QUERIES } from '@/lib/queries';
import { TutorialBySlugResponse } from '@/types/aem';
import TutorialSteps from '@/components/TutorialSteps';
import FAQAccordion from '@/components/FAQAccordion';

export const revalidate = 3600;
export const dynamicParams = true;

export default async function TutorialPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const data = await queryAEM<TutorialBySlugResponse>(QUERIES.TUTORIAL_BY_SLUG, { slug });
  const tutorial = data?.tutorialList?.items?.[0];

  if (!tutorial) notFound();

  return (
    <div className="max-w-3xl">
      <div className="mb-8">
        <span className="text-sm text-blue-600 font-medium">{tutorial.khDifficulty}</span>
        <h1 className="text-3xl font-bold mt-1 mb-3">{tutorial.khTitle}</h1>
        {tutorial.khPrerequisites && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
            <span className="font-semibold">Prerequisites: </span>{tutorial.khPrerequisites}
          </div>
        )}
      </div>

      {tutorial.khSteps && tutorial.khSteps.length > 0 && (
        <TutorialSteps steps={tutorial.khSteps} />
      )}

      {tutorial.khRelatedFAQs && tutorial.khRelatedFAQs.length > 0 && (
        <section className="mt-10">
          <h2 className="text-xl font-semibold mb-4">Related FAQs</h2>
          <FAQAccordion items={tutorial.khRelatedFAQs} />
        </section>
      )}
    </div>
  );
}
