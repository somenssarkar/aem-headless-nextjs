export const QUERIES = {
  ARTICLES_LIST: 'knowledge-hub/articles-list',
  ARTICLES_BY_CATEGORY: 'knowledge-hub/articles-by-category',
  ARTICLE_BY_SLUG: 'knowledge-hub/article-by-slug',
  FAQS_BY_CATEGORY: 'knowledge-hub/faqs-by-category',
  TUTORIALS_LIST: 'knowledge-hub/tutorials-list',
  TUTORIAL_BY_SLUG: 'knowledge-hub/tutorial-by-slug',
} as const;

export const CATEGORIES = ['AEM', 'AEP', 'AJO', 'Architecture', 'DevOps'] as const;
export type Category = (typeof CATEGORIES)[number];
