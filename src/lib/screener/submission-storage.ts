import { staffingNeedOptions, workerSituationOptions, type Submission } from "./steps.ts";

// A separate tab protects the earlier, differently shaped v4 responses.
export const SHEET_SUFFIX = "v4 compact";
export const sheetHeaders = [
  "Ingezonden op", "Formulierversie", "Toestemming op", "Perspectief",
  "Vestigingsplaats", "Type organisatie", "Omvang vestiging", "Personeelsbehoefte (2 jaar)",
  "Werksituatie", "Woonplaats", "Werkplaats", "Gericht gezocht (3 maanden)", "Open voor nieuwe baan",
  "Naam", "E-mailadres", "Toestemming voor e-mail", "Telefoonnummer",
];

export function sheetHeaderUpdate(existing: unknown[]): { range: string; values: string[][] } | null {
  if (!existing.length) return { range: "A1:Q1", values: [sheetHeaders] };
  if (JSON.stringify(existing) === JSON.stringify(sheetHeaders)) return null;
  // Append only: existing columns and historical responses retain their positions.
  if (JSON.stringify(existing) === JSON.stringify(sheetHeaders.slice(0, 16))) {
    return { range: "Q1", values: [["Telefoonnummer"]] };
  }
  throw new Error("Onverwachte kolomkoppen; inzending niet opgeslagen.");
}

export function toSheetRow(submission: Submission, receivedAt: string): string[] {
  const { employer, worker, contact } = submission;
  const choiceLabel = (value?: string) => value === "yes" ? "Ja" : value === "no" ? "Nee" : value === "maybe" ? "Misschien, dat hangt ervan af" : "";
  return [
    receivedAt, submission.formVersion, receivedAt,
    submission.participantType === "personal" ? "Eigen ervaringen met werk" : submission.participantType === "employer" ? "Personeel aannemen" : "Beide",
    employer?.location ?? "", employer?.organizationType ?? "", employer?.size ?? "",
    staffingNeedOptions.find((option) => option.value === employer?.staffingNeed)?.label ?? "",
    workerSituationOptions.find((option) => option.value === worker?.situation)?.label ?? "",
    worker?.homeLocation ?? "", worker?.workLocation ?? "", choiceLabel(worker?.activeSearch), choiceLabel(worker?.openToWork),
    contact.name, contact.email, "Ja", contact.phone ?? "",
  ];
}
