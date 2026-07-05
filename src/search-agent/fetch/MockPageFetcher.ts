import { MOCK_PAGE_CONTENT } from "../providers/MockSearchProvider";
import type { FetchedPage, PageFetcher } from "./PageFetcher";
import { extractTitle, cleanText } from "../extraction/html";

export class MockPageFetcher implements PageFetcher {
  async fetchPage(url: string): Promise<FetchedPage> {
    const normalized = url.replace(/\/$/, "");
    const html =
      MOCK_PAGE_CONTENT[url] ??
      MOCK_PAGE_CONTENT[normalized] ??
      MOCK_PAGE_CONTENT[`${normalized}/`];

    if (!html) {
      return {
        url,
        ok: false,
        error: "Mock page not found",
      };
    }

    return {
      url,
      finalUrl: url,
      status: 200,
      ok: true,
      html,
      title: extractTitle(html),
      text: cleanText(html),
    };
  }
}
