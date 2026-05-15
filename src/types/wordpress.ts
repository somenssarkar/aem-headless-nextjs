export interface WpCategory {
  name: string;
  slug: string;
}

export interface WpTag {
  name: string;
  slug: string;
}

export interface WpAuthorNode {
  name: string;
  description?: string;
  avatar?: { url: string };
}

export interface WpFeaturedImageNode {
  sourceUrl: string;
  altText: string;
}

export interface WpPostListItem {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  categories: { nodes: WpCategory[] };
  tags: { nodes: WpTag[] };
  author?: { node: WpAuthorNode } | null;
  featuredImage?: { node: WpFeaturedImageNode } | null;
}

export interface WpPostDetail {
  id: string;
  slug: string;
  title: string;
  content: string;
  excerpt: string;
  date: string;
  modified: string;
  categories: { nodes: WpCategory[] };
  tags: { nodes: WpTag[] };
  author?: { node: WpAuthorNode } | null;
  featuredImage?: { node: WpFeaturedImageNode } | null;
}

export interface WpPostsListResponse {
  posts: { nodes: WpPostListItem[] };
}

export interface WpPostBySlugResponse {
  post: WpPostDetail | null;
}

// Shape returned by the adapter's paginated ALL_POSTS query
export interface WpAllPostsPage {
  posts: {
    pageInfo: { hasNextPage: boolean; endCursor: string | null };
    nodes: Array<{
      id: string;
      slug: string;
      title: string;
      content: string;
      excerpt: string;
      date: string;
      modified: string;
      categories: { nodes: WpCategory[] };
      tags: { nodes: WpTag[] };
    }>;
  };
}
