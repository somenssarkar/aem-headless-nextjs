export interface DrupalTerm {
  type: string;
  id: string;
  attributes: { name: string };
}

export interface DrupalCaseStudyNode {
  type: string;
  id: string;  // UUID
  attributes: {
    drupal_internal__nid: number;
    title: string;
    field_summary: string | null;
    body: { value: string; processed: string; summary: string | null } | null;
    created: string;
    changed: string;
    path: { alias: string | null; pid: number | null; langcode: string };
  };
  relationships: {
    field_industry?: { data: { type: string; id: string } | null };
  };
}

export interface DrupalJsonApiResponse {
  data: DrupalCaseStudyNode[];
  included?: DrupalTerm[];
  links?: { next?: { href: string } };
}

// Flat shape used by Next.js components — industry already resolved
export interface DrupalCaseStudy {
  id: string;        // UUID
  nid: number;       // used as the URL slug: /drupal/1
  title: string;
  summary: string;
  body: string;      // processed HTML — safe to dangerouslySetInnerHTML
  industry: string | null;
  created: string;
  changed: string;
}
