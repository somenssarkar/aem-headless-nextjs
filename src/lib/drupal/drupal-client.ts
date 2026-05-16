import type { DrupalCaseStudy, DrupalCaseStudyNode, DrupalJsonApiResponse, DrupalTerm } from '@/types/drupal';

function resolveIndustry(node: DrupalCaseStudyNode, included: DrupalTerm[]): string | null {
  const termId = node.relationships.field_industry?.data?.id;
  if (!termId) return null;
  return included.find(t => t.id === termId)?.attributes.name ?? null;
}

function toFlat(node: DrupalCaseStudyNode, included: DrupalTerm[]): DrupalCaseStudy {
  return {
    id: node.id,
    nid: node.attributes.drupal_internal__nid,
    title: node.attributes.title,
    summary: node.attributes.field_summary ?? '',
    body: node.attributes.body?.processed ?? '',
    industry: resolveIndustry(node, included),
    created: node.attributes.created,
    changed: node.attributes.changed,
  };
}

async function fetchJsonApi(url: string): Promise<DrupalJsonApiResponse> {
  const res = await fetch(url, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`Drupal JSON:API ${res.status}: ${url}`);
  return res.json();
}

async function loadMock(): Promise<DrupalJsonApiResponse> {
  const data = await import('@/data/mock/drupal/case-studies.json');
  return data.default as unknown as DrupalJsonApiResponse;
}

export async function getDrupalCaseStudies(): Promise<DrupalCaseStudy[]> {
  const drupalBase = process.env.DRUPAL_BASE;
  const mockMode = process.env.DRUPAL_MOCK_MODE === 'true' || !drupalBase;

  let response: DrupalJsonApiResponse;
  if (mockMode) {
    response = await loadMock();
  } else {
    try {
      response = await fetchJsonApi(
        `${drupalBase}/jsonapi/node/case_study?include=field_industry&page[limit]=50&sort=-created`,
      );
    } catch {
      response = await loadMock();
    }
  }

  const included = response.included ?? [];
  return response.data.map(node => toFlat(node, included));
}

export async function getDrupalCaseStudy(nid: string): Promise<DrupalCaseStudy | null> {
  const drupalBase = process.env.DRUPAL_BASE;
  const mockMode = process.env.DRUPAL_MOCK_MODE === 'true' || !drupalBase;

  let response: DrupalJsonApiResponse;
  if (mockMode) {
    response = await loadMock();
  } else {
    try {
      response = await fetchJsonApi(
        `${drupalBase}/jsonapi/node/case_study?filter[drupal_internal__nid]=${nid}&include=field_industry`,
      );
    } catch {
      response = await loadMock();
    }
  }

  const included = response.included ?? [];
  const node = response.data.find(n => String(n.attributes.drupal_internal__nid) === nid);
  return node ? toFlat(node, included) : null;
}
