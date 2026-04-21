export interface ImageRef {
  _path: string;
}

export interface MultiFormatString {
  html?: string;
  plaintext?: string;
  markdown?: string;
}

export interface AuthorModel {
  khName: string;
  khBio: MultiFormatString;
  khAvatar?: ImageRef;
  khLinkedinUrl?: string;
  khSpecialties?: string[];
}

export interface FaqModel {
  _path: string;
  khQuestion: string;
  khAnswer: MultiFormatString;
  khCategory: string;
}

export interface ArticleListItem {
  _path: string;
  khSlug: string;
  khTitle: string;
  khSummary: string;
  khCategory: string;
  khDifficulty: string;
  khPublishedDate: string;
  khTags?: string[];
  khAuthor?: {
    khName: string;
    khAvatar?: ImageRef;
  };
}

export interface ArticleDetail {
  _path: string;
  khSlug: string;
  khTitle: string;
  khCategory: string;
  khDifficulty: string;
  khBody: MultiFormatString;
  khSummary: string;
  khPublishedDate: string;
  khTags?: string[];
  khSeoDescription?: string;
  khAuthor?: AuthorModel;
  khRelatedFAQs?: FaqModel[];
}

export interface TutorialstepModel {
  _path: string;
  khStepNumber: number;
  khHeading: string;
  khInstruction: MultiFormatString;
  khCodeSnippet?: string;
}

export interface TutorialModel {
  _path: string;
  khSlug: string;
  khTitle: string;
  khDifficulty: string;
  khPrerequisites?: string;
  khSteps?: TutorialstepModel[];
  khRelatedFAQs?: FaqModel[];
}

// GraphQL response envelopes
export interface ArticleListResponse {
  articleList: {
    items: ArticleListItem[];
  };
}

export interface ArticleBySlugResponse {
  articleList: {
    items: ArticleDetail[];
  };
}

export interface FaqByCategoryResponse {
  faqList: {
    items: FaqModel[];
  };
}

export interface TutorialListResponse {
  tutorialList: {
    items: TutorialModel[];
  };
}

export interface TutorialBySlugResponse {
  tutorialList: {
    items: TutorialModel[];
  };
}
