import type { SearchProvider } from "./SearchProvider";
import { MockSearchProvider } from "./MockSearchProvider";

function hasEnv(key: string): boolean {
  return Boolean(process.env[key]?.trim());
}

export function createSearchProvider(
  preferred?: string,
): { provider: SearchProvider; warnings: string[] } {
  const warnings: string[] = [];
  const choice =
    preferred ??
    process.env.SEARCH_PROVIDER ??
    (hasEnv("TAVILY_API_KEY")
      ? "tavily"
      : hasEnv("EXA_API_KEY")
        ? "exa"
        : hasEnv("BRAVE_API_KEY")
          ? "brave"
          : hasEnv("SERPER_API_KEY")
            ? "serper"
            : "mock");

  switch (choice) {
    case "mock":
      return { provider: new MockSearchProvider(), warnings };
    case "tavily":
      if (!hasEnv("TAVILY_API_KEY")) {
        warnings.push("TAVILY_API_KEY not set; falling back to mock provider");
        return { provider: new MockSearchProvider(), warnings };
      }
      return {
        provider: createTavilyProvider(process.env.TAVILY_API_KEY!),
        warnings,
      };
    case "exa":
      if (!hasEnv("EXA_API_KEY")) {
        warnings.push("EXA_API_KEY not set; falling back to mock provider");
        return { provider: new MockSearchProvider(), warnings };
      }
      return {
        provider: createExaProvider(process.env.EXA_API_KEY!),
        warnings,
      };
    case "brave":
      if (!hasEnv("BRAVE_API_KEY")) {
        warnings.push("BRAVE_API_KEY not set; falling back to mock provider");
        return { provider: new MockSearchProvider(), warnings };
      }
      return {
        provider: createBraveProvider(process.env.BRAVE_API_KEY!),
        warnings,
      };
    case "serper":
      if (!hasEnv("SERPER_API_KEY")) {
        warnings.push("SERPER_API_KEY not set; falling back to mock provider");
        return { provider: new MockSearchProvider(), warnings };
      }
      return {
        provider: createSerperProvider(process.env.SERPER_API_KEY!),
        warnings,
      };
    default:
      warnings.push(`Unknown provider "${choice}"; using mock`);
      return { provider: new MockSearchProvider(), warnings };
  }
}

function createTavilyProvider(apiKey: string): SearchProvider {
  return {
    name: "tavily",
    async search(query, options) {
      try {
        const res = await fetch("https://api.tavily.com/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            api_key: apiKey,
            query,
            max_results: options.maxResults,
          }),
        });
        if (!res.ok) return [];
        const data = (await res.json()) as {
          results?: Array<{ title: string; url: string; content?: string }>;
        };
        return (data.results ?? []).map((r) => ({
          title: r.title,
          url: r.url,
          snippet: r.content,
          source: "tavily",
        }));
      } catch {
        return [];
      }
    },
  };
}

function createExaProvider(apiKey: string): SearchProvider {
  return {
    name: "exa",
    async search(query, options) {
      try {
        const res = await fetch("https://api.exa.ai/search", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
          },
          body: JSON.stringify({
            query,
            numResults: options.maxResults,
            type: "auto",
          }),
        });
        if (!res.ok) return [];
        const data = (await res.json()) as {
          results?: Array<{ title?: string; url: string; text?: string }>;
        };
        return (data.results ?? []).map((r) => ({
          title: r.title ?? r.url,
          url: r.url,
          snippet: r.text,
          source: "exa",
        }));
      } catch {
        return [];
      }
    },
  };
}

function createBraveProvider(apiKey: string): SearchProvider {
  return {
    name: "brave",
    async search(query, options) {
      try {
        const params = new URLSearchParams({
          q: query,
          count: String(options.maxResults),
        });
        const res = await fetch(
          `https://api.search.brave.com/res/v1/web/search?${params}`,
          {
            headers: { "X-Subscription-Token": apiKey },
          },
        );
        if (!res.ok) return [];
        const data = (await res.json()) as {
          web?: { results?: Array<{ title: string; url: string; description?: string }> };
        };
        return (data.web?.results ?? []).map((r) => ({
          title: r.title,
          url: r.url,
          snippet: r.description,
          source: "brave",
        }));
      } catch {
        return [];
      }
    },
  };
}

function createSerperProvider(apiKey: string): SearchProvider {
  return {
    name: "serper",
    async search(query, options) {
      try {
        const res = await fetch("https://google.serper.dev/search", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-API-KEY": apiKey,
          },
          body: JSON.stringify({ q: query, num: options.maxResults }),
        });
        if (!res.ok) return [];
        const data = (await res.json()) as {
          organic?: Array<{ title: string; link: string; snippet?: string }>;
        };
        return (data.organic ?? []).map((r) => ({
          title: r.title,
          url: r.link,
          snippet: r.snippet,
          source: "serper",
        }));
      } catch {
        return [];
      }
    },
  };
}
