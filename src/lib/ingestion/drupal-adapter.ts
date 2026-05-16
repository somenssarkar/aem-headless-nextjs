import type { SourceAdapter, Chunk } from './source-adapter';
import { stripHtml } from '../html-utils';
import { chunkText } from './chunk-utils';
import type { DrupalJsonApiResponse, DrupalTerm, DrupalCaseStudyNode } from '../../types/drupal';

async function fetchPage(url: string): Promise<DrupalJsonApiResponse> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Drupal JSON:API ${res.status}: ${url}`);
  return res.json();
}

function resolveIndustry(node: DrupalCaseStudyNode, included: DrupalTerm[]): string | null {
  const termId = node.relationships.field_industry?.data?.id;
  if (!termId) return null;
  return included.find(t => t.id === termId)?.attributes.name ?? null;
}

export const drupalAdapter: SourceAdapter = {
  name: 'drupal',
  async *fetch(): AsyncIterable<Chunk> {
    const drupalBase = process.env.DRUPAL_BASE;
    if (!drupalBase) throw new Error('DRUPAL_BASE is not set');

    console.log('  Fetching Drupal case studies (paginated)...');
    let url: string | null =
      `${drupalBase}/jsonapi/node/case_study?include=field_industry&page[limit]=50&sort=-created`;
    let pageCount = 0;

    while (url) {
      const response: DrupalJsonApiResponse = await fetchPage(url);
      const included = response.included ?? [];
      pageCount++;
      console.log(`  Page ${pageCount}: ${response.data.length} nodes`);

      for (const node of response.data) {
        const nid = node.attributes.drupal_internal__nid;
        const industry = resolveIndustry(node, included);
        const meta = {
          title: node.attributes.title,
          url: `/drupal/${nid}`,
          publishedDate: node.attributes.created,
          modifiedDate: node.attributes.changed,
          industry,
          source: 'drupal',
          sourceLabel: 'Drupal',
        };

        // Summary chunk — title + field_summary
        const summary = node.attributes.field_summary?.trim() ?? '';
        if (summary) {
          yield {
            path: `drupal:node:${node.id}:summary`,
            source: 'drupal',
            model: 'DrupalCaseStudy',
            chunk_type: 'title_summary',
            content: `${node.attributes.title}\n${summary}`,
            metadata: meta,
          };
        }

        // Body chunks (800-char windows, 100-char overlap)
        const body = stripHtml(node.attributes.body?.processed ?? '');
        for (const [i, text] of chunkText(body, 800, 100).entries()) {
          yield {
            path: `drupal:node:${node.id}:body:${i}`,
            source: 'drupal',
            model: 'DrupalCaseStudy',
            chunk_type: 'body',
            content: text,
            metadata: meta,
          };
        }
      }

      url = response.links?.next?.href ?? null;
    }
  },
};
