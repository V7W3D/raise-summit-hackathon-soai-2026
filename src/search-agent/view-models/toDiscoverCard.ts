import type { CandidateLead } from "../schemas";
import type { DiscoverLeadCardVM } from "../schemas";

const ACTION_LABELS: Record<string, string> = {
  open_details: "View details",
  investigate_more: "Investigate more",
  draft_outreach: "Draft outreach",
  find_contact: "Find contact",
  reject: "Reject",
  save_for_later: "Save for later",
};

export function toDiscoverCard(candidate: CandidateLead): DiscoverLeadCardVM {
  const contactBadges: string[] = [];
  if (candidate.contact.emails.length) contactBadges.push("Email found");
  if (candidate.contact.phones.length) contactBadges.push("Phone found");
  if (candidate.contact.contactPageUrl) contactBadges.push("Contact page");
  if (candidate.contact.socialLinks?.length) contactBadges.push("Social links");

  return {
    id: candidate.id,
    title: candidate.name,
    subtitle: candidate.shortDescription,
    location: candidate.location,
    domain: candidate.domain,
    contactBadges,
    fitScore: candidate.scores.overallScore,
    category: candidate.classification.category,
    reasons: candidate.classification.reasons,
    missingInfo: candidate.classification.missingInfo,
    recommendedNextAction: candidate.classification.recommendedNextAction,
    primaryActionLabel:
      ACTION_LABELS[candidate.classification.recommendedNextAction] ??
      candidate.classification.recommendedNextAction,
  };
}
