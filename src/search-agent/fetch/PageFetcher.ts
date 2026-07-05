export interface FetchedPage {
  url: string;
  finalUrl?: string;
  status?: number;
  ok: boolean;
  title?: string;
  text?: string;
  html?: string;
  error?: string;
}

export interface PageFetcher {
  fetchPage(url: string): Promise<FetchedPage>;
}
