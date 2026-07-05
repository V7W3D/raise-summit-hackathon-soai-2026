const CONTACT_KEYWORDS = [
  "contact",
  "contactez",
  "nous-contacter",
  "contact-us",
  "about",
  "equipe",
  "team",
  "nous contacter",
];

export function findLikelyContactPageLinks(
  html: string,
  baseUrl: string,
): string[] {
  const links: string[] = [];
  const anchorRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match: RegExpExecArray | null;

  while ((match = anchorRegex.exec(html)) !== null) {
    const href = match[1];
    const text = match[2].replace(/<[^>]+>/g, " ").toLowerCase();
    const hrefLower = href.toLowerCase();
    const isContactLink = CONTACT_KEYWORDS.some(
      (kw) => text.includes(kw) || hrefLower.includes(kw),
    );
    if (!isContactLink) continue;

    try {
      const resolved = new URL(href, baseUrl).toString();
      links.push(resolved);
    } catch {
      // skip invalid URLs
    }
  }

  return [...new Set(links)];
}
