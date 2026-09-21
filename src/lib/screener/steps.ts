export const FORM_VERSION = "v4-employers-3" as const;
export const LEGACY_FORM_VERSION = "v4-minimal-2" as const;
export const participantOptions = [
  { value: "employer", label: "Over personeel aannemen" },
  { value: "personal", label: "Over mijn eigen ervaringen en keuzes rondom werk" },
  { value: "both", label: "Over beide" },
] as const;
export const employerSizeOptions = ["0–1", "2–9", "10–19", "20–49", "50–249", "250 of meer", "Weet ik niet"] as const;
const legacyEmployerSizeOptions = ["0–1", "2–9", "10–19", "20 of meer", "Weet ik niet"] as const;
export const legacyStaffingNeedOptions = [
  { value: "multiple", label: "Ja, meerdere keren" },
  { value: "once", label: "Ja, één keer" },
  { value: "no", label: "Nee" },
  { value: "unknown", label: "Weet ik niet" },
] as const;
export const recruitmentPatternOptions = [
  { value: "yes", label: "Ja" },
  { value: "no", label: "Nee" },
  { value: "unknown", label: "Weet ik niet" },
] as const;
export const legacyWorkerSituationOptions = [
  { value: "employed", label: "Ik werk in loondienst" },
  { value: "self-employed", label: "Ik werk als zelfstandige" },
  { value: "both", label: "Ik werk in loondienst én als zelfstandige" },
  { value: "not-working", label: "Ik werk op dit moment niet" },
] as const;
export const workerSituationOptions = [
  { value: "employed", label: "Ik werk in loondienst" },
  { value: "self-employed", label: "Ik werk als zelfstandige" },
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
  recruitmentPattern: string;
  recruitmentInvolvement: string;
  workerSituation: string;
  workerHomeLocation: string;
  workerWorkLocation: string;
  workerActiveSearch: string;
  workerOpenToWork: string;
  name: string;
  email: string;
  phone: string;
};
export type FieldErrors = Partial<Record<keyof Answers, string>>;
export const initialAnswers: Answers = {
  participantType: "", employerLocation: "", employerType: "", employerSize: "",
  recruitmentPattern: "", recruitmentInvolvement: "", workerSituation: "", workerHomeLocation: "", workerWorkLocation: "",
  workerActiveSearch: "", workerOpenToWork: "", name: "", email: "", phone: "",
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
    choice("recruitmentPattern", recruitmentPatternOptions);
    choice("recruitmentInvolvement", yesNoOptions);
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
    const phone = answers.phone.trim();
    const digits = phone.replace(/\D/g, "");
    if (phone && (phone.length > 40 || !/^\+?[\d\s().-]+$/.test(phone) || digits.length < 7 || digits.length > 15)) errors.phone = "Vul een geldig telefoonnummer in of laat dit veld leeg.";
  }
  return errors;
}
export function firstInvalidStep(answers: Answers): StepId | undefined {
  return getSteps(answers).find((step) => Object.keys(validateStep(step, answers)).length > 0);
}
export type Submission = {
  formVersion: typeof FORM_VERSION;
  participantType: ParticipantType;
  employer?: { location: string; organizationType: string; size: string; recruitmentPattern: string; recruitmentInvolvement: string };
  worker?: { situation: string; homeLocation: string; workLocation?: string; activeSearch: string; openToWork: string };
  consent: true;
  contact: { name: string; email: string; phone?: string };
};
export type LegacySubmission = Omit<Submission, "formVersion" | "employer"> & {
  formVersion: typeof LEGACY_FORM_VERSION;
  employer?: { location: string; organizationType: string; size: string; staffingNeed: string };
};
export type StoredSubmission = Submission | LegacySubmission;
export type ReviewAnswers = Pick<Submission, "participantType" | "employer" | "worker">;
function workerFromAnswers(answers: Answers): NonNullable<Submission["worker"]> {
  return {
    situation: answers.workerSituation, homeLocation: answers.workerHomeLocation.trim(),
    ...(hasWorkplace(answers) && answers.workerWorkLocation.trim() ? { workLocation: answers.workerWorkLocation.trim() } : {}),
    activeSearch: answers.workerActiveSearch, openToWork: answers.workerOpenToWork,
  };
}
function legacyWorkerFromAnswers(answers: Answers): NonNullable<LegacySubmission["worker"]> {
  return {
    situation: answers.workerSituation, homeLocation: answers.workerHomeLocation.trim(),
    ...(answers.workerSituation !== "not-working" && answers.workerWorkLocation.trim() ? { workLocation: answers.workerWorkLocation.trim() } : {}),
    activeSearch: answers.workerActiveSearch, openToWork: answers.workerOpenToWork,
  };
}
function contactFromAnswers(answers: Answers): Submission["contact"] {
  return { name: answers.name.trim(), email: answers.email.trim(), ...(answers.phone.trim() ? { phone: answers.phone.trim() } : {}) };
}
export function createReviewAnswers(answers: Answers): ReviewAnswers {
  const invalid = getSteps(answers).find((step) => step !== "contact" && Object.keys(validateStep(step, answers)).length > 0);
  if (invalid || !isParticipantType(answers.participantType)) throw new Error(`Ongeldig scherm: ${invalid ?? "intro"}`);
  const { participantType } = answers;
  return {
    participantType,
    ...(participantType === "employer" || participantType === "both" ? {
      employer: {
        location: answers.employerLocation.trim(), organizationType: answers.employerType.trim(),
        size: answers.employerSize, recruitmentPattern: answers.recruitmentPattern, recruitmentInvolvement: answers.recruitmentInvolvement,
      },
    } : {}),
    ...(participantType === "personal" || participantType === "both" ? {
      worker: workerFromAnswers(answers),
    } : {}),
  };
}
export function createSubmission(answers: Answers): Submission {
  const invalid = firstInvalidStep(answers);
  if (invalid || !isParticipantType(answers.participantType)) throw new Error(`Ongeldig scherm: ${invalid ?? "intro"}`);
  return {
    formVersion: FORM_VERSION, ...createReviewAnswers(answers),
    consent: true,
    contact: contactFromAnswers(answers),
  };
}
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
function hasOnlyKeys(value: Record<string, unknown>, keys: string[]) {
  return Object.keys(value).every((key) => keys.includes(key));
}
// Validate at the server boundary too; old or inactive fields never reach storage.
export function parseSubmission(value: unknown): StoredSubmission | null {
  if (!isRecord(value) || !hasOnlyKeys(value, ["formVersion", "participantType", "employer", "worker", "consent", "contact"])) return null;
  if ((value.formVersion !== FORM_VERSION && value.formVersion !== LEGACY_FORM_VERSION) || typeof value.participantType !== "string" || !isParticipantType(value.participantType) || value.consent !== true) return null;
  const answers = { ...initialAnswers, participantType: value.participantType };
  const hasEmployer = value.participantType === "employer" || value.participantType === "both";
  const hasWorker = value.participantType === "personal" || value.participantType === "both";
  let legacyEmployer: LegacySubmission["employer"];
  if (hasEmployer) {
    const e = value.employer;
    if (!isRecord(e) || typeof e.location !== "string" || typeof e.organizationType !== "string" || typeof e.size !== "string") return null;
    if (value.formVersion === LEGACY_FORM_VERSION) {
      if (!hasOnlyKeys(e, ["location", "organizationType", "size", "staffingNeed"]) || typeof e.staffingNeed !== "string") return null;
      if (!e.location.trim() || e.location.trim().length > 120 || !e.organizationType.trim() || e.organizationType.trim().length > 200) return null;
      if (!legacyEmployerSizeOptions.some((option) => option === e.size) || !legacyStaffingNeedOptions.some((option) => option.value === e.staffingNeed)) return null;
      legacyEmployer = { location: e.location.trim(), organizationType: e.organizationType.trim(), size: e.size, staffingNeed: e.staffingNeed };
    } else {
      if (!hasOnlyKeys(e, ["location", "organizationType", "size", "recruitmentPattern", "recruitmentInvolvement"]) || typeof e.recruitmentPattern !== "string" || typeof e.recruitmentInvolvement !== "string") return null;
      Object.assign(answers, { employerLocation: e.location, employerType: e.organizationType, employerSize: e.size, recruitmentPattern: e.recruitmentPattern, recruitmentInvolvement: e.recruitmentInvolvement });
    }
  } else if (value.employer !== undefined) return null;
  if (hasWorker) {
    const w = value.worker;
    if (!isRecord(w) || !hasOnlyKeys(w, ["situation", "homeLocation", "workLocation", "activeSearch", "openToWork"])) return null;
    if (typeof w.situation !== "string" || typeof w.homeLocation !== "string" || typeof w.activeSearch !== "string" || typeof w.openToWork !== "string") return null;
    if (w.workLocation !== undefined && typeof w.workLocation !== "string") return null;
    if (w.situation === "not-working" && w.workLocation !== undefined) return null;
    const situationOptions = value.formVersion === LEGACY_FORM_VERSION ? legacyWorkerSituationOptions : workerSituationOptions;
    if (!situationOptions.some((option) => option.value === w.situation)) return null;
    if (!w.homeLocation.trim() || w.homeLocation.trim().length > 120 || !yesNoOptions.some((option) => option.value === w.activeSearch) || !opennessOptions.some((option) => option.value === w.openToWork)) return null;
    Object.assign(answers, { workerSituation: w.situation, workerHomeLocation: w.homeLocation, workerWorkLocation: w.workLocation ?? "", workerActiveSearch: w.activeSearch, workerOpenToWork: w.openToWork });
  } else if (value.worker !== undefined) return null;
  const contact = value.contact;
  if (!isRecord(contact) || !hasOnlyKeys(contact, ["name", "email", "phone"]) || typeof contact.name !== "string" || typeof contact.email !== "string") return null;
  if (contact.phone !== undefined && typeof contact.phone !== "string") return null;
  answers.name = contact.name;
  answers.email = contact.email;
  answers.phone = contact.phone ?? "";
  // An already-open older form can still submit; never infer new answers from old ones.
  if (value.formVersion === LEGACY_FORM_VERSION) {
    if (Object.keys(validateStep("contact", answers)).length) return null;
    return {
      formVersion: LEGACY_FORM_VERSION, participantType: value.participantType, consent: true,
      ...(legacyEmployer ? { employer: legacyEmployer } : {}),
      ...(hasWorker ? { worker: legacyWorkerFromAnswers(answers) } : {}), contact: contactFromAnswers(answers),
    };
  }
  return firstInvalidStep(answers) ? null : createSubmission(answers);
}
