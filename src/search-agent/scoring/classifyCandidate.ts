import type { CandidateLead } from "../schemas";

export function classifyCandidate(
  candidate: Pick<CandidateLead, "contact" | "scores" | "evidence">,
  planBadFitSignalsFound: string[],
): CandidateLead["classification"] {
  const { scores, contact } = candidate;
  const reasons: string[] = [];
  const missingInfo: string[] = [];

  const hasContact =
    contact.emails.length > 0 ||
    contact.phones.length > 0 ||
    Boolean(contact.contactPageUrl);

  if (scores.fitScore >= 70) reasons.push("Strong mission fit signals detected");
  if (contact.phones.length) reasons.push("Phone-first workflow detected");
  if (contact.emails.length) reasons.push("Email found");
  if (candidate.evidence.some((e) => e.evidenceType === "location_match")) {
    reasons.push("Location matches mission target");
  }
  if (candidate.evidence.some((e) => e.evidenceType === "service_match")) {
    reasons.push("Relevant services mentioned");
  }
  if (planBadFitSignalsFound.length) {
    reasons.push(`Bad-fit signals: ${planBadFitSignalsFound.join(", ")}`);
  }

  if (!contact.emails.length && !contact.phones.length) {
    missingInfo.push("No direct email or phone found");
  }
  if (!contact.contactPageUrl) {
    missingInfo.push("No contact page identified");
  }
  missingInfo.push("No named decision-maker found");

  let category: CandidateLead["classification"]["category"];
  let confidence: CandidateLead["classification"]["confidence"];
  let recommendedNextAction: CandidateLead["classification"]["recommendedNextAction"];

  const strongBadFit =
    planBadFitSignalsFound.length >= 1 ||
    candidate.evidence.filter((e) => e.evidenceType === "bad_fit_signal").length >= 2 ||
    scores.fitScore < 35;

  if (strongBadFit || scores.overallScore < 45) {
    category = "rejected_or_low_fit";
    confidence =
      planBadFitSignalsFound.length >= 2 || scores.overallScore < 30 ? "high" : "medium";
    recommendedNextAction = "reject";
  } else if (scores.overallScore >= 75 && scores.fitScore >= 70 && hasContact) {
    category = "high_fit";
    confidence = "high";
    recommendedNextAction = "draft_outreach";
  } else if (scores.overallScore >= 75 && scores.fitScore >= 70 && !hasContact) {
    category = "promising_but_incomplete";
    confidence = "medium";
    recommendedNextAction = "find_contact";
  } else if (
    scores.overallScore >= 60 &&
    (!hasContact || scores.evidenceQualityScore < 50)
  ) {
    category = "promising_but_incomplete";
    confidence = "medium";
    recommendedNextAction = hasContact ? "investigate_more" : "find_contact";
  } else if (scores.overallScore >= 45) {
    category = "needs_verification";
    confidence = "low";
    recommendedNextAction = "open_details";
  } else {
    category = "rejected_or_low_fit";
    confidence = "medium";
    recommendedNextAction = "reject";
  }

  if (
    category !== "rejected_or_low_fit" &&
    scores.fitScore >= 55 &&
    scores.overallScore < 60
  ) {
    recommendedNextAction = "save_for_later";
  }

  return {
    category,
    confidence,
    reasons,
    missingInfo: [...new Set(missingInfo)],
    recommendedNextAction,
  };
}

export function findBadFitSignalsInText(
  text: string,
  badFitSignals: string[],
): string[] {
  const lower = text.toLowerCase();
  return badFitSignals.filter((signal) => lower.includes(signal.toLowerCase()));
}
