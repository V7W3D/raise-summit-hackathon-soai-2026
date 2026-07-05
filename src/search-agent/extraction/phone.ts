const PHONE_PATTERNS = [
  /(?:\+33|0033|0)\s*[1-9](?:[\s.-]*\d{2}){4}/g,
  /\+?\d{1,3}[\s.-]?\(?\d{1,4}\)?[\s.-]?\d{1,4}[\s.-]?\d{1,9}/g,
];

function normalizePhone(raw: string): string {
  return raw.replace(/\s+/g, " ").trim();
}

function isValidPhone(raw: string): boolean {
  const digits = raw.replace(/\D/g, "");
  return digits.length >= 9 && digits.length <= 15;
}

export function extractPhones(text: string): string[] {
  const found = new Set<string>();
  for (const pattern of PHONE_PATTERNS) {
    const matches = text.match(pattern) ?? [];
    for (const match of matches) {
      const normalized = normalizePhone(match);
      if (isValidPhone(normalized)) {
        found.add(normalized);
      }
    }
  }
  return [...found];
}

export function extractPhonesWithConfidence(
  text: string,
  sourceUrl?: string,
): Array<{ value: string; confidence: number; sourceUrl?: string }> {
  return extractPhones(text).map((value) => ({
    value,
    confidence: value.startsWith("+33") || value.startsWith("0") ? 0.85 : 0.7,
    sourceUrl,
  }));
}
