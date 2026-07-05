export type SocialPlatform = "linkedin" | "facebook" | "instagram" | "x" | "other";

const SOCIAL_PATTERNS: Array<{ platform: SocialPlatform; regex: RegExp }> = [
  { platform: "linkedin", regex: /https?:\/\/(?:[\w.-]+\.)?linkedin\.com\/[^\s"'<>]+/gi },
  { platform: "facebook", regex: /https?:\/\/(?:[\w.-]+\.)?facebook\.com\/[^\s"'<>]+/gi },
  { platform: "instagram", regex: /https?:\/\/(?:[\w.-]+\.)?instagram\.com\/[^\s"'<>]+/gi },
  { platform: "x", regex: /https?:\/\/(?:[\w.-]+\.)?(?:twitter|x)\.com\/[^\s"'<>]+/gi },
];

export function extractSocialLinks(
  htmlOrText: string,
): Array<{ platform: SocialPlatform; url: string }> {
  const links: Array<{ platform: SocialPlatform; url: string }> = [];
  const seen = new Set<string>();

  for (const { platform, regex } of SOCIAL_PATTERNS) {
    const matches = htmlOrText.match(regex) ?? [];
    for (const url of matches) {
      const cleaned = url.replace(/[.,;)]+$/, "");
      if (!seen.has(cleaned)) {
        seen.add(cleaned);
        links.push({ platform, url: cleaned });
      }
    }
  }

  return links;
}
