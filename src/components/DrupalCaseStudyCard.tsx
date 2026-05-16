import Link from 'next/link';
import type { DrupalCaseStudy } from '@/types/drupal';

export default function DrupalCaseStudyCard({ cs }: { cs: DrupalCaseStudy }) {
  const date = new Date(cs.created).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric',
  });

  return (
    <Link href={`/drupal/${cs.nid}`} className="block group">
      <div className="bg-white rounded-xl border border-gray-200 p-5 h-full flex flex-col hover:border-indigo-300 hover:shadow-md transition-all">
        <div className="flex items-center gap-2 mb-3 text-xs text-gray-500">
          {cs.industry && (
            <span className="font-medium text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">
              {cs.industry}
            </span>
          )}
          <span>{date}</span>
        </div>

        <h2 className="text-base font-semibold text-gray-900 mb-2 group-hover:text-indigo-700 transition-colors leading-snug line-clamp-3">
          {cs.title}
        </h2>

        {cs.summary && (
          <p className="text-sm text-gray-500 line-clamp-3 flex-1 leading-relaxed">
            {cs.summary}
          </p>
        )}

        <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
            Drupal
          </span>
          <span className="text-xs text-indigo-600 group-hover:underline font-medium">
            Read case study →
          </span>
        </div>
      </div>
    </Link>
  );
}
