import { isLikelyHtmlUrl } from "../extraction/url";
import { extractTitle, cleanText } from "../extraction/html";
import type { FetchedPage, PageFetcher } from "./PageFetcher";

const DEFAULT_TIMEOUT_MS = 8000;

export class BasicHttpPageFetcher implements PageFetcher {
  constructor(private timeoutMs = DEFAULT_TIMEOUT_MS) {}

  async fetchPage(url: string): Promise<FetchedPage> {
    if (!isLikelyHtmlUrl(url)) {
      return { url, ok: false, error: "Skipped non-HTML asset" };
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(url, {
        signal: controller.signal,
        headers: {
          "User-Agent": "ProspectPathSearchAgent/0.1 (+https://prospectpath.local)",
          Accept: "text/html,application/xhtml+xml",
        },
        redirect: "follow",
      });

      const contentType = response.headers.get("content-type") ?? "";
      if (!contentType.includes("text/html") && !contentType.includes("application/xhtml")) {
        return {
          url,
          finalUrl: response.url,
          status: response.status,
          ok: false,
          error: "Non-HTML response",
        };
      }

      const html = await response.text();
      return {
        url,
        finalUrl: response.url,
        status: response.status,
        ok: response.ok,
        html,
        title: extractTitle(html),
        text: cleanText(html),
      };
    } catch (error) {
      return {
        url,
        ok: false,
        error: error instanceof Error ? error.message : "Fetch failed",
      };
    } finally {
      clearTimeout(timer);
    }
  }
}
