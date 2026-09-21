import { FORM_VERSION, LEGACY_FORM_VERSION, legacyStaffingNeedOptions, legacyWorkerSituationOptions, recruitmentPatternOptions, workerSituationOptions, type StoredSubmission } from "./steps.ts";

// A separate tab protects the earlier, differently shaped v4 responses.
export const SHEET_SUFFIX = "v4 compact";
export const sheetHeaders = [
  "Ingezonden op", "Formulierversie", "Toestemming op", "Perspectief",
  "Vestigingsplaats", "Type organisatie", "Omvang vestiging", "Personeelsbehoefte (2 jaar)",
  "Werksituatie", "Woonplaats", "Werkplaats", "Gericht gezocht (3 maanden)", "Open voor nieuwe baan",
  "Naam", "E-mailadres", "Toestemming voor e-mail", "Telefoonnummer",
  "Patroon personeelsbehoefte/werving", "Zelf betrokken bij werving/selectie",
];

export function sheetHeaderUpdate(existing: unknown[]): { range: string; values: string[][] } | null {
  if (!existing.length) return { range: "A1:S1", values: [sheetHeaders] };
  if (JSON.stringify(existing) === JSON.stringify(sheetHeaders)) return null;
  // Append only: existing columns and historical responses retain their positions.
  if ([16, 17].includes(existing.length) && JSON.stringify(existing) === JSON.stringify(sheetHeaders.slice(0, existing.length))) {
    return { range: `${existing.length === 16 ? "Q" : "R"}1:S1`, values: [sheetHeaders.slice(existing.length)] };
  }
  throw new Error("Onverwachte kolomkoppen; inzending niet opgeslagen.");
}

export function toSheetRow(submission: StoredSubmission, receivedAt: string): string[] {
  const { employer, worker, contact } = submission;
  const legacyEmployer = submission.formVersion === LEGACY_FORM_VERSION ? submission.employer : undefined;
  const currentEmployer = submission.formVersion === FORM_VERSION ? submission.employer : undefined;
  const situationOptions = submission.formVersion === LEGACY_FORM_VERSION ? legacyWorkerSituationOptions : workerSituationOptions;
  const choiceLabel = (value?: string) => value === "yes" ? "Ja" : value === "no" ? "Nee" : value === "maybe" ? "Misschien, dat hangt ervan af" : "";
  return [
    receivedAt, submission.formVersion, receivedAt,
    submission.participantType === "personal" ? "Eigen ervaringen met werk" : submission.participantType === "employer" ? "Personeel aannemen" : "Beide",
    employer?.location ?? "", employer?.organizationType ?? "", employer?.size ?? "",
    legacyStaffingNeedOptions.find((option) => option.value === legacyEmployer?.staffingNeed)?.label ?? "",
    situationOptions.find((option) => option.value === worker?.situation)?.label ?? "",
    worker?.homeLocation ?? "", worker?.workLocation ?? "", choiceLabel(worker?.activeSearch), choiceLabel(worker?.openToWork),
    contact.name, contact.email, "Ja", contact.phone ?? "",
    recruitmentPatternOptions.find((option) => option.value === currentEmployer?.recruitmentPattern)?.label ?? "",
    choiceLabel(currentEmployer?.recruitmentInvolvement),
  ];
}
