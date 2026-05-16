import type { DrupalCaseStudy } from '@/types/drupal';

export default function DrupalCaseStudyDetail({ cs }: { cs: DrupalCaseStudy }) {
  const date = new Date(cs.created).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3 text-sm text-gray-500">
          <span className="font-medium text-indigo-600">Drupal Case Study</span>
          {cs.industry && (
            <>
              <span>·</span>
              <span className="text-indigo-700 font-medium">{cs.industry}</span>
            </>
          )}
          <span>·</span>
          <span>{date}</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-3 leading-tight">{cs.title}</h1>
        {cs.summary && (
          <p className="text-lg text-gray-500 leading-relaxed">{cs.summary}</p>
        )}
      </div>

      <article
        className="prose prose-gray max-w-none mb-10"
        dangerouslySetInnerHTML={{ __html: cs.body }}
      />

      <div className="border-t border-gray-200 pt-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm">
            D
          </div>
          <div>
            <p className="font-medium text-gray-900 text-sm">Drupal Case Study</p>
            <p className="text-xs text-gray-500">Published via Drupal JSON:API</p>
          </div>
          <span className="ml-auto text-xs font-medium px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
            Drupal
          </span>
        </div>
      </div>
    </div>
  );
}
