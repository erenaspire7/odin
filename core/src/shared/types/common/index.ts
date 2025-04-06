export interface WebSearchResult {
  query: string;
  answer: string;
  images: SearchImage[];
  results: SearchResult[];
}

interface BaseResult {
  url: string;
}

interface SearchImage extends BaseResult {
  description: string;
}

interface SearchResult extends BaseResult {
  title: string;
  content: string;
  score: number;
  raw_content: string | null;
}

interface FailedResult extends BaseResult {
  error: string;
}

export interface WebExtractResult {
  failed_results: FailedResult[];
  results: Omit<SearchResult, "score" | "title">[];
}
