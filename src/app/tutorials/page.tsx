import Link from 'next/link';
import { queryAEM } from '@/lib/aem-client';
import { QUERIES } from '@/lib/queries';
import { TutorialListResponse } from '@/types/aem';

export const revalidate = 3600;

const DIFFICULTY_COLORS: Record<string, string> = {
  Beginner: 'bg-green-100 text-green-700',
  Intermediate: 'bg-yellow-100 text-yellow-700',
  Advanced: 'bg-red-100 text-red-700',
};

export default async function TutorialsPage() {
  const data = await queryAEM<TutorialListResponse>(QUERIES.TUTORIALS_LIST, { limit: 12 });
  const tutorials = data?.tutorialList?.items ?? [];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Tutorials</h1>
      <p className="text-gray-500 mb-8">Step-by-step guides for AEM, AEP and AJO.</p>

      {tutorials.length === 0 ? (
        <p className="text-gray-400">No tutorials found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tutorials.map((tutorial) => (
            <Link
              key={tutorial._path}
              href={`/tutorials/${tutorial.khSlug}`}
              className="block bg-white border border-gray-200 rounded-xl p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between mb-3">
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${DIFFICULTY_COLORS[tutorial.khDifficulty] ?? 'bg-gray-100 text-gray-600'}`}>
                  {tutorial.khDifficulty}
                </span>
                {tutorial.khSteps && (
                  <span className="text-xs text-gray-400">{tutorial.khSteps.length} steps</span>
                )}
              </div>
              <h2 className="font-semibold text-gray-900 text-lg leading-snug">{tutorial.khTitle}</h2>
              {tutorial.khPrerequisites && (
                <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                  Prerequisites: {tutorial.khPrerequisites}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
