import { questions, searchContext, type QuestionId } from "./research-questions.ts";
import { questions as previousQuestions } from "./research-questions-v1.ts";
import { isResearchVersion, activeQuestions, answerLabel, stateFromResearchSubmission, type ResearchSubmission } from "./research.ts";
import { SHEET_SUFFIX as legacySuffix, sheetHeaders as legacyHeaders, sheetHeaderUpdate as legacyHeaderUpdate, toSheetRow as legacyRow } from "./submission-storage.ts";
import type { StoredSubmission } from "./steps.ts";

export type AnySubmission = ResearchSubmission | StoredSubmission;
export const RESEARCH_SHEET_SUFFIX = "v5 onderzoek";
// Keep existing columns fixed; new own answers are stored in the main answer cell.
const otherQuestions = previousQuestions.filter((q) => q.id !== "employerEffectiveChannels" && q.options?.some((o) => o.value === "other"));
const otherIds = new Set(otherQuestions.map((q) => q.id));
// Storage labels are versioned independently of UI copy edits.
const columnLabels: Record<QuestionId, string> = {
  employerLocation: "Werkplaats", employerSector: "Sector organisatie", employerSize: "Grootte hele organisatie",
  employerInvolvement: "Eigen betrokkenheid werving", employerFrequency: "Frequentie personeelsbehoefte",
  employerRecruiters: "Wie werft", employerRecentHiring: "Wervingspoging afgelopen twee jaar",
  employerChannels: "Gebruikte wervingskanalen", employerEffectiveChannels: "Meest geschikte kandidaten via",
  employerBarriers: "Ervaren wervingsproblemen", employerPriorities: "Prioriteiten nieuwe medewerker",
  employerEarlyDeparture: "Vertrek binnen een jaar meegemaakt", employerDepartureReason: "Belangrijkste gemelde vertrekreden",
  personalSituation: "Huidige situatie", personalHome: "Woonplaats", personalSector: "Sector huidig werk",
  personalSize: "Grootte hele organisatie huidig werk", personalWorkplace: "Werkplaats huidig werk", personalTenure: "Duur huidig werk",
  personalOpenness: "Openstaan voor ander werk", personalRecentSearch: "Zoekervaring afgelopen twee jaar",
  personalChannels: "Zoekkanalen ervaring of verwachting", personalPriorities: "Prioriteiten nieuwe baan",
  personalBarriers: "Afhaakredenen ervaring of verwachting", personalMissingInfo: "Gemiste vacatureinformatie",
  personalChecks: "Werkgeverscheck ervaring of verwachting", personalMismatch: "Afwijkende baanverwachting meegemaakt",
  personalMismatchReason: "Belangrijkste verschil met verwachting",
};
export const researchHeaders = [
  "Inzend-ID", "Inhoudsvingerafdruk", "Ingezonden op", "Formulierversie", "Gekozen perspectief", "Ingevulde routes", "Eerste route",
  "Toestemming interviewcontact", "Toestemming op", "Naam", "E-mailadres", "Telefoonnummer", "Aanvulling", "Zoekcontext (ervaring of verwachting)",
  ...questions.flatMap((q) => [`${q.id}: ${columnLabels[q.id]}`, ...(otherIds.has(q.id) ? [`${q.id}: Anders`] : [])]),
];
export const isResearchSubmission = (payload: AnySubmission): payload is ResearchSubmission => isResearchVersion(payload.formVersion);
export function sheetColumn(index: number): string {
  if (!Number.isInteger(index) || index < 1) throw new RangeError("Ongeldige kolomindex");
  let result = "";
  for (let n = index; n > 0; n = Math.floor((n - 1) / 26)) result = String.fromCharCode(65 + (n - 1) % 26) + result;
  return result;
}
export function storageSchema(payload: AnySubmission) {
  const headers = isResearchSubmission(payload) ? researchHeaders : legacyHeaders;
  return { headers, suffix: isResearchSubmission(payload) ? RESEARCH_SHEET_SUFFIX : legacySuffix, lastColumn: sheetColumn(headers.length) };
}
export function storageHeaderUpdate(payload: AnySubmission, existing: unknown[]) {
  if (!isResearchSubmission(payload)) return legacyHeaderUpdate(existing);
  if (!existing.length) return { range: `A1:${sheetColumn(researchHeaders.length)}1`, values: [researchHeaders] };
  if (JSON.stringify(existing) === JSON.stringify(researchHeaders)) return null;
  throw new Error("Onverwachte onderzoekskolommen; bestaande gegevens blijven ongewijzigd.");
}
export function storageRow(payload: AnySubmission, receivedAt: string, fingerprint: string): string[] {
  if (!isResearchSubmission(payload)) return legacyRow(payload, receivedAt);
  const state = stateFromResearchSubmission(payload);
  const active = new Map(activeQuestions(state, payload.formVersion).map((q) => [q.id, q]));
  return [
    payload.submissionId, fingerprint, receivedAt, payload.formVersion, payload.requestedPerspective, payload.completedRoutes.join("; "), payload.firstRoute,
    payload.interviewConsent ? "Ja" : "Nee", payload.interviewConsent ? receivedAt : "", payload.contact?.name ?? "", payload.contact?.email ?? "", payload.contact?.phone ?? "", payload.comment ?? "",
    payload.completedRoutes.includes("personal") ? searchContext(payload.answers) === "experience" ? "Ervaring: afgelopen twee jaar" : searchContext(payload.answers) === "other" ? "Niet ingedeeld: eigen antwoord" : "Verwachting: hypothetisch" : "",
    ...questions.flatMap((q) => {
      const resolved = active.get(q.id);
      const value = resolved && payload.answers[q.id] !== undefined ? answerLabel(resolved, payload.answers) : "";
      const other = payload.answers[`${q.id}Other`];
      return [value, ...(otherIds.has(q.id) ? [resolved && typeof other === "string" ? other : ""] : [])];
    }),
  ];
}
