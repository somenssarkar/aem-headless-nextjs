import { getDrupalCaseStudies } from '@/lib/drupal/drupal-client';
import DrupalCaseStudyCard from '@/components/DrupalCaseStudyCard';

export const revalidate = 3600;

export default async function DrupalPage() {
  const caseStudies = await getDrupalCaseStudies();

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Drupal Case Studies</h1>
        <p className="text-sm text-gray-500 mt-1">
          Real-world headless CMS implementations delivered via Drupal JSON:API
        </p>
      </div>

      {caseStudies.length === 0 ? (
        <p className="text-gray-400">No case studies found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {caseStudies.map(cs => (
            <DrupalCaseStudyCard key={cs.id} cs={cs} />
          ))}
        </div>
      )}
    </div>
  );
}
