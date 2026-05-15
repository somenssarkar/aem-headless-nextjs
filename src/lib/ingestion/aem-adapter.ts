import type { SourceAdapter, Chunk } from './source-adapter';
import { stripHtml } from '../html-utils';
import { generateText } from 'ai';
import { google } from '@ai-sdk/google';

async function fetchAEM<T>(queryName: string, vars: Record<string, unknown> = {}): Promise<T> {
  const AEM_BASE = process.env.AEM_HOST ?? 'http://localhost:4502';
  const AEM_AUTH = process.env.AEM_AUTH ?? 'Basic YWRtaW46YWRtaW4=';
  const params = Object.entries(vars)
    .filter(([, v]) => v !== undefined)
    .map(([k, v]) => `;${k}=${encodeURIComponent(String(v))}`)
    .join('');
  const url = `${AEM_BASE}/graphql/execute.json/${queryName}${params}`;
  const res = await fetch(url, {
    headers: { Authorization: AEM_AUTH, 'Content-Type': 'application/json' },
  });
  if (!res.ok) throw new Error(`AEM ${res.status}: ${url}`);
  const json = await res.json();
  return json.data as T;
}

async function generateSeoIfMissing(cfPath: string, title: string, bodyHtml: string): Promise<string> {
  const AEM_BASE = process.env.AEM_HOST ?? 'http://localhost:4502';
  const AEM_AUTH = process.env.AEM_AUTH ?? 'Basic YWRtaW46YWRtaW4=';
  console.log(`  → Generating SEO description for: ${title}`);
  const { text } = await generateText({
    model: google('gemini-3-flash-preview'),
    prompt: `Write a 2-sentence SEO meta description for this AEM developer article.
Be specific, mention the key technologies, keep it under 155 characters total.

Title: ${title}
Article content:
${stripHtml(bodyHtml).slice(0, 2000)}

SEO Description (2 sentences, under 155 chars):`,
  });
  const seoDescription = text.trim();
  const res = await fetch(`${AEM_BASE}${cfPath}/jcr:content/data/master`, {
    method: 'POST',
    headers: { Authorization: AEM_AUTH, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ khSeoDescription: seoDescription }).toString(),
  });
  if (!res.ok) {
    console.warn(`  ⚠ AEM PATCH failed (${res.status}) — using generated value for this run`);
  } else {
    console.log(`  ✓ Saved to AEM Author: "${seoDescription.slice(0, 60)}..."`);
  }
  return seoDescription;
}

interface AuthorEntry {
  khName: string;
  articles: Array<{ khTitle: string; path: string }>;
}

export function createAemAdapter(since?: string): SourceAdapter {
  return {
    name: 'aem-cf',
    async *fetch(): AsyncIterable<Chunk> {
      const authorMap = new Map<string, AuthorEntry>();

      // Articles
      console.log('  Fetching AEM Articles...');
      const articleData = await fetchAEM<any>('knowledge-hub/articles-list');
      for (const a of articleData.articleList.items) {
        if (since && a.khPublishedDate && new Date(a.khPublishedDate) < new Date(since)) continue;

        if (!a.khSeoDescription && a.khBody?.html) {
          a.khSeoDescription = await generateSeoIfMissing(a._path, a.khTitle, a.khBody.html);
        }

        const authorName: string | null = a.khAuthor?.khName ?? null;
        if (authorName) {
          const key = authorName.toLowerCase().replace(/\s+/g, '-');
          const entry: AuthorEntry = authorMap.get(key) ?? { khName: authorName, articles: [] };
          entry.articles.push({ khTitle: a.khTitle, path: a._path });
          authorMap.set(key, entry);
        }

        const meta = {
          title: a.khTitle,
          slug: a.khSlug,
          category: a.khCategory,
          tags: a.khTags,
          publishedDate: a.khPublishedDate,
          authorName,
        };

        yield {
          path: `${a._path}#summary`,
          source: 'aem-cf',
          model: 'Article',
          chunk_type: 'title_summary',
          content: `${a.khTitle}\nAuthor: ${authorName ?? 'Unknown'}\n${a.khSummary}`,
          metadata: meta,
        };

        if (a.khBody?.html) {
          yield {
            path: `${a._path}#body`,
            source: 'aem-cf',
            model: 'Article',
            chunk_type: 'body',
            content: stripHtml(a.khBody.html),
            metadata: meta,
          };
        }
      }

      // FAQs
      console.log('  Fetching AEM FAQs...');
      for (const category of ['AEM', 'AEP', 'AJO']) {
        const faqData = await fetchAEM<any>('knowledge-hub/faqs-by-category', { category });
        for (const faq of faqData.faqList.items) {
          yield {
            path: faq._path,
            source: 'aem-cf',
            model: 'FAQ',
            chunk_type: 'qa',
            content: `Q: ${faq.khQuestion}\nA: ${stripHtml(faq.khAnswer?.html ?? '')}`,
            metadata: { category: faq.khCategory },
          };
        }
      }

      // Tutorials
      console.log('  Fetching AEM Tutorials...');
      try {
        const tutData = await fetchAEM<any>('knowledge-hub/tutorials-list');
        for (const tutorial of tutData.tutorialList?.items ?? []) {
          for (const step of tutorial.khSteps ?? []) {
            yield {
              path: step._path,
              source: 'aem-cf',
              model: 'TutorialStep',
              chunk_type: 'step',
              content: [step.khHeading, step.khInstruction, step.khCodeSnippet]
                .filter(Boolean)
                .join('\n'),
              metadata: { tutorialTitle: tutorial.khTitle, stepNumber: step.khStepNumber },
            };
          }
        }
      } catch (e: any) {
        console.warn(`  ⚠ tutorials-list not found in AEM (${e.message}) — skipping`);
      }

      // Synthetic author profiles — built from article pass above
      console.log('  Yielding synthetic Author Profiles...');
      for (const [slug, entry] of authorMap) {
        const titleList = entry.articles.map(a => a.khTitle).join('; ');
        yield {
          path: `synthetic-author-${slug}#profile`,
          source: 'aem-cf',
          model: 'Author',
          chunk_type: 'author_profile',
          content: `${entry.khName} has authored ${entry.articles.length} article${
            entry.articles.length !== 1 ? 's' : ''
          }: ${titleList}.`,
          metadata: { authorName: entry.khName, articleCount: entry.articles.length },
        };
      }
    },
  };
}
