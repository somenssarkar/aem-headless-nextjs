import { queryAEM } from '@/lib/aem-client';
import { QUERIES, CATEGORIES } from '@/lib/queries';
import { FaqByCategoryResponse, FaqModel } from '@/types/aem';
import FAQAccordion from '@/components/FAQAccordion';

export const revalidate = 3600;

export default async function FAQsPage() {
  const results = await Promise.all(
    CATEGORIES.map((cat) =>
      queryAEM<FaqByCategoryResponse>(QUERIES.FAQS_BY_CATEGORY, { category: cat })
        .then((data) => ({ category: cat, items: data?.faqList?.items ?? [] }))
        .catch(() => ({ category: cat, items: [] as FaqModel[] }))
    )
  );

  const populated = results.filter((r) => r.items.length > 0);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Frequently Asked Questions</h1>
      <p className="text-gray-500 mb-8">Common questions grouped by product area.</p>

      {populated.length === 0 ? (
        <p className="text-gray-400">No FAQs found.</p>
      ) : (
        <div className="space-y-10">
          {populated.map(({ category, items }) => (
            <section key={category}>
              <h2 className="text-lg font-semibold text-blue-700 mb-4">{category}</h2>
              <FAQAccordion items={items} />
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
