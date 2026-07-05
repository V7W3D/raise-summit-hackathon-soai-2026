export function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url.trim());
    parsed.hash = "";
    let normalized = parsed.toString();
    if (normalized.endsWith("/") && parsed.pathname !== "/") {
      normalized = normalized.slice(0, -1);
    }
    return normalized.toLowerCase();
  } catch {
    return url.trim().toLowerCase();
  }
}

export function getDomain(url: string): string | undefined {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    return hostname.startsWith("www.") ? hostname.slice(4) : hostname;
  } catch {
    return undefined;
  }
}

export function isLikelyHtmlUrl(url: string): boolean {
  const lower = url.toLowerCase();
  const nonHtmlExtensions = [
    ".pdf",
    ".jpg",
    ".jpeg",
    ".png",
    ".gif",
    ".svg",
    ".zip",
    ".mp4",
    ".mp3",
    ".css",
    ".js",
    ".woff",
    ".woff2",
  ];
  return !nonHtmlExtensions.some((ext) => lower.includes(ext));
}
