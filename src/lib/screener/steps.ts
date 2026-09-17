export const FORM_VERSION = "v4-minimal-2" as const;
export const participantOptions = [
  { value: "employer", label: "Over personeel aannemen" },
  { value: "personal", label: "Over mijn eigen ervaringen en keuzes rondom werk" },
  { value: "both", label: "Over beide" },
] as const;
export const employerSizeOptions = ["0–1", "2–9", "10–19", "20 of meer", "Weet ik niet"] as const;
export const staffingNeedOptions = [
  { value: "multiple", label: "Ja, meerdere keren" },
  { value: "once", label: "Ja, één keer" },
  { value: "no", label: "Nee" },
  { value: "unknown", label: "Weet ik niet" },
] as const;
export const workerSituationOptions = [
  { value: "employed", label: "Ik werk in loondienst" },
  { value: "self-employed", label: "Ik werk als zelfstandige" },
  { value: "both", label: "Ik werk in loondienst én als zelfstandige" },
  { value: "not-working", label: "Ik werk op dit moment niet" },
] as const;
export const yesNoOptions = [
  { value: "yes", label: "Ja" }, { value: "no", label: "Nee" },
] as const;
export const opennessOptions = [
  { value: "yes", label: "Ja" },
  { value: "maybe", label: "Misschien, dat hangt ervan af" },
  { value: "no", label: "Nee" },
] as const;
export type ParticipantType = (typeof participantOptions)[number]["value"];
export type StepId = "intro" | "employer" | "worker" | "contact" | "complete";
export type Answers = {
  participantType: string;
  employerLocation: string;
  employerType: string;
  employerSize: string;
  staffingNeed: string;
  workerSituation: string;
  workerHomeLocation: string;
  workerWorkLocation: string;
  workerActiveSearch: string;
  workerOpenToWork: string;
  name: string;
  email: string;
};
export type FieldErrors = Partial<Record<keyof Answers, string>>;
export const initialAnswers: Answers = {
  participantType: "", employerLocation: "", employerType: "", employerSize: "",
  staffingNeed: "", workerSituation: "", workerHomeLocation: "", workerWorkLocation: "",
  workerActiveSearch: "", workerOpenToWork: "", name: "", email: "",
};
export function isParticipantType(value: string): value is ParticipantType {
  return participantOptions.some((option) => option.value === value);
}
export function getSteps(answers: Pick<Answers, "participantType">): StepId[] {
  const route: StepId[] = ["intro"];
  if (answers.participantType === "employer" || answers.participantType === "both") route.push("employer");
  if (answers.participantType === "personal" || answers.participantType === "both") route.push("worker");
  return [...route, "contact", "complete"];
}
export function hasWorkplace(answers: Pick<Answers, "workerSituation">): boolean {
  return workerSituationOptions.some((option) => option.value === answers.workerSituation && option.value !== "not-working");
}
export function validateStep(step: StepId, answers: Answers): FieldErrors {
  const errors: FieldErrors = {};
  const text = (field: keyof Answers, max: number, message: string, optional = false) => {
    const value = String(answers[field]).trim();
    if (!value && !optional) errors[field] = message;
    else if (value.length > max) errors[field] = `Gebruik maximaal ${max} tekens.`;
  };
  const choice = (field: keyof Answers, options: readonly { value: string }[]) => {
    if (!options.some((option) => option.value === answers[field])) errors[field] = "Kies een antwoord om verder te gaan.";
  };
  if (step === "intro") choice("participantType", participantOptions);
  if (step === "employer") {
    text("employerLocation", 120, "Vul de vestigingsplaats in.");
    text("employerType", 200, "Vul het type bedrijf of organisatie in.");
    choice("employerSize", employerSizeOptions.map((value) => ({ value })));
    choice("staffingNeed", staffingNeedOptions);
  }
  if (step === "worker") {
    choice("workerSituation", workerSituationOptions);
    text("workerHomeLocation", 120, "Vul je woonplaats in.");
    if (hasWorkplace(answers)) text("workerWorkLocation", 120, "", true);
    choice("workerActiveSearch", yesNoOptions);
    choice("workerOpenToWork", opennessOptions);
  }
  if (step === "contact") {
    text("name", 120, "Vul je naam in.");
    if (!/^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/.test(answers.email.trim()) || answers.email.trim().length > 254) errors.email = "Vul een geldig e-mailadres in.";
  }
  return errors;
}
export function firstInvalidStep(answers: Answers): StepId | undefined {
  return getSteps(answers).find((step) => Object.keys(validateStep(step, answers)).length > 0);
}
export type Submission = {
  formVersion: typeof FORM_VERSION;
  participantType: ParticipantType;
  employer?: { location: string; organizationType: string; size: string; staffingNeed: string };
  worker?: { situation: string; homeLocation: string; workLocation?: string; activeSearch: string; openToWork: string };
  consent: true;
  contact: { name: string; email: string };
};
export type ReviewAnswers = Pick<Submission, "participantType" | "employer" | "worker">;
export function createReviewAnswers(answers: Answers): ReviewAnswers {
  const invalid = getSteps(answers).find((step) => step !== "contact" && Object.keys(validateStep(step, answers)).length > 0);
  if (invalid || !isParticipantType(answers.participantType)) throw new Error(`Ongeldig scherm: ${invalid ?? "intro"}`);
  const { participantType } = answers;
  return {
    participantType,
    ...(participantType === "employer" || participantType === "both" ? {
      employer: {
        location: answers.employerLocation.trim(), organizationType: answers.employerType.trim(),
        size: answers.employerSize, staffingNeed: answers.staffingNeed,
      },
    } : {}),
    ...(participantType === "personal" || participantType === "both" ? {
      worker: {
        situation: answers.workerSituation, homeLocation: answers.workerHomeLocation.trim(),
        ...(hasWorkplace(answers) && answers.workerWorkLocation.trim() ? { workLocation: answers.workerWorkLocation.trim() } : {}),
        activeSearch: answers.workerActiveSearch, openToWork: answers.workerOpenToWork,
      },
    } : {}),
  };
}
export function createSubmission(answers: Answers): Submission {
  const invalid = firstInvalidStep(answers);
  if (invalid || !isParticipantType(answers.participantType)) throw new Error(`Ongeldig scherm: ${invalid ?? "intro"}`);
  return {
    formVersion: FORM_VERSION, ...createReviewAnswers(answers),
    consent: true,
    contact: { name: answers.name.trim(), email: answers.email.trim() },
  };
}
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function hasOnlyKeys(value: Record<string, unknown>, keys: string[]) {
  return Object.keys(value).every((key) => keys.includes(key));
}
// Validate at the server boundary too; old or inactive fields never reach storage.
export function parseSubmission(value: unknown): Submission | null {
  if (!isRecord(value) || !hasOnlyKeys(value, ["formVersion", "participantType", "employer", "worker", "consent", "contact"])) return null;
  if (value.formVersion !== FORM_VERSION || typeof value.participantType !== "string" || !isParticipantType(value.participantType) || value.consent !== true) return null;
  const answers = { ...initialAnswers, participantType: value.participantType };
  const hasEmployer = value.participantType === "employer" || value.participantType === "both";
  const hasWorker = value.participantType === "personal" || value.participantType === "both";
  if (hasEmployer) {
    const e = value.employer;
    if (!isRecord(e) || !hasOnlyKeys(e, ["location", "organizationType", "size", "staffingNeed"])) return null;
    if (typeof e.location !== "string" || typeof e.organizationType !== "string" || typeof e.size !== "string" || typeof e.staffingNeed !== "string") return null;
    Object.assign(answers, { employerLocation: e.location, employerType: e.organizationType, employerSize: e.size, staffingNeed: e.staffingNeed });
  } else if (value.employer !== undefined) return null;
  if (hasWorker) {
    const w = value.worker;
    if (!isRecord(w) || !hasOnlyKeys(w, ["situation", "homeLocation", "workLocation", "activeSearch", "openToWork"])) return null;
    if (typeof w.situation !== "string" || typeof w.homeLocation !== "string" || typeof w.activeSearch !== "string" || typeof w.openToWork !== "string") return null;
    if (w.workLocation !== undefined && typeof w.workLocation !== "string") return null;
    if (w.situation === "not-working" && w.workLocation !== undefined) return null;
    Object.assign(answers, { workerSituation: w.situation, workerHomeLocation: w.homeLocation, workerWorkLocation: w.workLocation ?? "", workerActiveSearch: w.activeSearch, workerOpenToWork: w.openToWork });
  } else if (value.worker !== undefined) return null;
  const contact = value.contact;
  if (!isRecord(contact) || !hasOnlyKeys(contact, ["name", "email"]) || typeof contact.name !== "string" || typeof contact.email !== "string") return null;
  answers.name = contact.name;
  answers.email = contact.email;
  return firstInvalidStep(answers) ? null : createSubmission(answers);
}
