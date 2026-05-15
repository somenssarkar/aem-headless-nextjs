export const WP_POSTS_LIST = {
  mockKey: 'posts-list',
  query: /* GraphQL */ `
    query WpPostsList($first: Int = 12, $categoryName: String) {
      posts(
        first: $first
        where: { categoryName: $categoryName, orderby: { field: DATE, order: DESC } }
      ) {
        nodes {
          id
          slug
          title
          excerpt
          date
          categories { nodes { name slug } }
          tags { nodes { name slug } }
          author { node { name avatar { url } } }
          featuredImage { node { sourceUrl altText } }
        }
      }
    }
  `,
};

export const WP_POST_BY_SLUG = {
  mockKey: 'post-by-slug',
  query: /* GraphQL */ `
    query WpPostBySlug($slug: ID!) {
      post(id: $slug, idType: SLUG) {
        id
        slug
        title
        content
        excerpt
        date
        modified
        categories { nodes { name slug } }
        tags { nodes { name slug } }
        author { node { name description avatar { url } } }
        featuredImage { node { sourceUrl altText } }
      }
    }
  `,
};

// Used only by the ingestion adapter (not by Next.js pages)
export const WP_ALL_POSTS_PAGINATED = /* GraphQL */ `
  query WpAllPostsPaginated($after: String) {
    posts(first: 50, after: $after) {
      pageInfo { hasNextPage endCursor }
      nodes {
        id slug title content excerpt date modified
        categories { nodes { name } }
        tags { nodes { name } }
      }
    }
  }
`;
