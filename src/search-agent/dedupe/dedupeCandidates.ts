import type { CandidateLead } from "../schemas";
import { getDomain, normalizeUrl } from "../extraction/url";

function normalizeCompanyName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function namesAreSimilar(a: string, b: string): boolean {
  const na = normalizeCompanyName(a);
  const nb = normalizeCompanyName(b);
  if (!na || !nb) return false;
  if (na === nb) return true;
  if (na.includes(nb) || nb.includes(na)) return true;
  const wordsA = new Set(na.split(" "));
  const wordsB = new Set(nb.split(" "));
  const overlap = [...wordsA].filter((w) => wordsB.has(w) && w.length > 3);
  return overlap.length >= 2;
}

function mergeCandidates(
  existing: CandidateLead,
  incoming: CandidateLead,
): CandidateLead {
  const better =
    incoming.scores.overallScore > existing.scores.overallScore
      ? incoming
      : existing;
  const other = better === incoming ? existing : incoming;

  return {
    ...better,
    sourceUrls: [...new Set([...better.sourceUrls, ...other.sourceUrls])],
    evidence: [...better.evidence, ...other.evidence],
    contact: {
      emails: mergeEmails(better.contact.emails, other.contact.emails),
      phones: mergePhones(better.contact.phones, other.contact.phones),
      contactPageUrl: better.contact.contactPageUrl ?? other.contact.contactPageUrl,
      socialLinks: [
        ...(better.contact.socialLinks ?? []),
        ...(other.contact.socialLinks ?? []),
      ].filter(
        (link, idx, arr) => arr.findIndex((l) => l.url === link.url) === idx,
      ),
    },
    updatedAt: new Date().toISOString(),
  };
}

function mergeEmails<T extends { value: string }>(a: T[], b: T[]): T[] {
  const map = new Map<string, T>();
  for (const email of [...a, ...b]) {
    map.set(email.value.toLowerCase(), email);
  }
  return [...map.values()];
}

function mergePhones<T extends { value: string }>(a: T[], b: T[]): T[] {
  const map = new Map<string, T>();
  for (const phone of [...a, ...b]) {
    map.set(phone.value.replace(/\D/g, ""), phone);
  }
  return [...map.values()];
}

export function dedupeCandidates(candidates: CandidateLead[]): {
  candidates: CandidateLead[];
  duplicatesRemoved: number;
} {
  const result: CandidateLead[] = [];
  let duplicatesRemoved = 0;

  for (const candidate of candidates) {
    const domain = candidate.domain ?? (candidate.websiteUrl ? getDomain(candidate.websiteUrl) : undefined);
    const normalizedDomain = domain?.toLowerCase();

    let merged = false;
    for (let i = 0; i < result.length; i++) {
      const existing = result[i];
      const existingDomain =
        existing.domain ??
        (existing.websiteUrl ? getDomain(existing.websiteUrl) : undefined);

      const sameDomain =
        normalizedDomain &&
        existingDomain &&
        normalizedDomain === existingDomain.toLowerCase();

      const similarName = namesAreSimilar(existing.name, candidate.name);
      const sameUrl =
        candidate.websiteUrl &&
        existing.websiteUrl &&
        normalizeUrl(candidate.websiteUrl) === normalizeUrl(existing.websiteUrl);

      if (sameDomain || similarName || sameUrl) {
        result[i] = mergeCandidates(existing, candidate);
        duplicatesRemoved += 1;
        merged = true;
        break;
      }
    }

    if (!merged) {
      result.push(candidate);
    }
  }

  return { candidates: result, duplicatesRemoved };
}
