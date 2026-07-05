export interface RawSearchResult {
  title: string;
  url: string;
  snippet?: string;
  source?: string;
  publishedDate?: string;
}

export interface ProviderSearchOptions {
  maxResults: number;
  location?: string;
  language?: string;
}

export interface SearchProvider {
  name: string;
  search(query: string, options: ProviderSearchOptions): Promise<RawSearchResult[]>;
}
