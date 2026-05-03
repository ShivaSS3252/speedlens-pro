// THIS FILE IS AUTO-GENERATED. Run `npm run codegen` to regenerate.

export type Maybe<T> = T | null;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };

export type Scalars = {
  ID: { input: string; output: string };
  String: { input: string; output: string };
  Boolean: { input: boolean; output: boolean };
  Int: { input: number; output: number };
  Float: { input: number; output: number };
};

// ─── Schema base types ────────────────────────────────────────────────────────

export type Fix = {
  __typename?: 'Fix';
  language?: Maybe<Scalars['String']['output']>;
  code?: Maybe<Scalars['String']['output']>;
  explanation?: Maybe<Scalars['String']['output']>;
};

export type Issue = {
  __typename?: 'Issue';
  id: Scalars['ID']['output'];
  title: Scalars['String']['output'];
  description: Scalars['String']['output'];
  displayValue?: Maybe<Scalars['String']['output']>;
  fix?: Maybe<Fix>;
};

export type Suggestion = {
  __typename?: 'Suggestion';
  id: Scalars['ID']['output'];
  title: Scalars['String']['output'];
  description: Scalars['String']['output'];
};

export type HistoryEntry = {
  __typename?: 'HistoryEntry';
  id: Scalars['ID']['output'];
  mobileScore: Scalars['Int']['output'];
  desktopScore: Scalars['Int']['output'];
  createdAt: Scalars['String']['output'];
};

export type Report = {
  __typename?: 'Report';
  id: Scalars['ID']['output'];
  url: Scalars['String']['output'];
  mobileScore: Scalars['Int']['output'];
  desktopScore: Scalars['Int']['output'];
  issues: Array<Issue>;
  suggestions: Array<Suggestion>;
  techStack?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['String']['output'];
};

// ─── Operation types ──────────────────────────────────────────────────────────

export type AnalyzeWebsiteMutationVariables = Exact<{
  url: Scalars['String']['input'];
}>;

export type AnalyzeWebsiteMutation = {
  __typename?: 'Mutation';
  analyzeWebsite: {
    __typename?: 'Report';
    id: string;
    url: string;
    mobileScore: number;
    desktopScore: number;
    techStack?: string | null;
    createdAt: string;
    issues: Array<{ __typename?: 'Issue'; id: string; title: string; description: string; displayValue?: string | null }>;
    suggestions: Array<{ __typename?: 'Suggestion'; id: string; title: string; description: string }>;
  };
};

export type GetReportQueryVariables = Exact<{
  id: Scalars['ID']['input'];
}>;

export type GetReportQuery = {
  __typename?: 'Query';
  getReport?: {
    __typename?: 'Report';
    id: string;
    url: string;
    mobileScore: number;
    desktopScore: number;
    techStack?: string | null;
    createdAt: string;
    issues: Array<{ __typename?: 'Issue'; id: string; title: string; description: string; displayValue?: string | null }>;
    suggestions: Array<{ __typename?: 'Suggestion'; id: string; title: string; description: string }>;
  } | null;
};

export type GetHistoryQueryVariables = Exact<{
  url: Scalars['String']['input'];
}>;

export type GetHistoryQuery = {
  __typename?: 'Query';
  getHistory: Array<{
    __typename?: 'HistoryEntry';
    id: string;
    mobileScore: number;
    desktopScore: number;
    createdAt: string;
  }>;
};

export type GenerateFixMutationVariables = Exact<{
  title: Scalars['String']['input'];
  description: Scalars['String']['input'];
  displayValue?: Maybe<Scalars['String']['input']>;
  techStack: Scalars['String']['input'];
}>;

export type GenerateFixMutation = {
  __typename?: 'Mutation';
  generateFix?: {
    __typename?: 'Fix';
    language?: string | null;
    code?: string | null;
    explanation?: string | null;
  } | null;
};
