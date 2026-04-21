import { ArticleDetail } from '@/types/aem';
import AuthorBio from './AuthorBio';
import FAQAccordion from './FAQAccordion';

export default function ArticleDetailComponent({ article }: { article: ArticleDetail }) {
  const date = new Date(article.khPublishedDate).toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <div className="max-w-3xl">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3 text-sm text-gray-500">
          <span className="font-medium text-blue-700">{article.khCategory}</span>
          <span>·</span>
          <span>{article.khDifficulty}</span>
          <span>·</span>
          <span>{date}</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900 mb-3">{article.khTitle}</h1>
        <p className="text-lg text-gray-600">{article.khSummary}</p>
      </div>

      {article.khTags && article.khTags.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-6">
          {article.khTags.map((tag) => (
            <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full">
              {tag}
            </span>
          ))}
        </div>
      )}

      <article
        className="prose prose-gray max-w-none mb-10"
        dangerouslySetInnerHTML={{ __html: article.khBody?.html ?? '' }}
      />

      {article.khAuthor && (
        <div className="border-t border-gray-200 pt-8 mb-10">
          <AuthorBio author={article.khAuthor} />
        </div>
      )}

      {article.khRelatedFAQs && article.khRelatedFAQs.length > 0 && (
        <section>
          <h2 className="text-xl font-semibold mb-4">Related FAQs</h2>
          <FAQAccordion items={article.khRelatedFAQs} />
        </section>
      )}
    </div>
  );
}
