const EMAIL_REGEX =
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g;

const GENERIC_PREFIXES = [
  "info",
  "contact",
  "hello",
  "sales",
  "support",
  "admin",
  "bonjour",
  "accueil",
];

export function extractEmails(textOrHtml: string): string[] {
  const matches = textOrHtml.match(EMAIL_REGEX) ?? [];
  const unique = new Set<string>();
  for (const email of matches) {
    const cleaned = email.toLowerCase().replace(/[.,;]+$/, "");
    if (!cleaned.includes("example.com") && !cleaned.includes("sentry")) {
      unique.add(cleaned);
    }
  }
  return [...unique];
}

export function classifyEmail(
  email: string,
): "generic" | "personal" | "unknown" {
  const localPart = email.split("@")[0]?.toLowerCase() ?? "";
  if (GENERIC_PREFIXES.some((prefix) => localPart === prefix || localPart.startsWith(`${prefix}.`))) {
    return "generic";
  }
  if (/^[a-z]+\.[a-z]+/.test(localPart) || /^[a-z]+[._-][a-z]+/.test(localPart)) {
    return "personal";
  }
  if (localPart.length > 2 && !GENERIC_PREFIXES.includes(localPart)) {
    return "personal";
  }
  return "unknown";
}

export function extractAndClassifyEmails(
  textOrHtml: string,
  sourceUrl?: string,
): Array<{
  value: string;
  type: "generic" | "personal" | "unknown";
  confidence: number;
  sourceUrl?: string;
}> {
  return extractEmails(textOrHtml).map((value) => ({
    value,
    type: classifyEmail(value),
    confidence: classifyEmail(value) === "personal" ? 0.9 : 0.75,
    sourceUrl,
  }));
}
