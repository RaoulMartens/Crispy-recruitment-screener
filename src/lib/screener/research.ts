import { isParticipantType, type ParticipantType, validateStep as validateLegacyStep, initialAnswers as legacyInitial } from "./steps.ts";
import { getQuestions, questions, questionIds, hasOther, textAnswer, multiAnswer, recentSearch, type AnswerId, type AnswerValues, type ContentStep, type Question } from "./research-questions.ts";

export const RESEARCH_VERSION = "v5-research-1" as const;
export type Route = "employer" | "personal";
export type ResearchStep = "intro" | ContentStep | "second-route" | "closing" | "complete";
export type ResearchState = {
  participantType: ParticipantType | ""; firstRoute: Route | ""; secondRoute: "" | "yes" | "no";
  answers: AnswerValues; comment: string; interviewConsent: "" | "yes" | "no";
  name: string; email: string; phone: string;
};
export type ResearchErrors = Partial<Record<AnswerId | "participantType" | "firstRoute" | "secondRoute" | "interviewConsent" | "comment" | "name" | "email" | "phone", string>>;
export const initialResearch: ResearchState = { participantType: "", firstRoute: "", secondRoute: "", answers: {}, comment: "", interviewConsent: "yes", name: "", email: "", phone: "" };
export const perspectiveOptions = [
  { value: "employer", label: "Over het zoeken en aannemen van personeel" },
  { value: "personal", label: "Over mijn eigen situatie en keuzes rond werk" },
  { value: "both", label: "Over beide" },
];
export const firstRouteOptions = [{ value: "employer", label: "Eerst over de organisatie" }, { value: "personal", label: "Eerst over mijn eigen werk of studie" }];
export const stepTitles: Record<ResearchStep, string> = {
  intro: "Jouw ervaringen met werk en personeel", "employer-context": "De organisatie", "employer-search": "Personeel vinden", "employer-experience": "Keuzes en ervaringen",
  "personal-context": "Jouw situatie", "personal-search": "Werk vinden", "personal-experience": "Kiezen en ervaringen", "second-route": "Nog een perspectief?", closing: "Tot slot", complete: "Heel erg bedankt!",
};
export function isRoute(value: unknown): value is Route { return value === "employer" || value === "personal"; }
export function isContentStep(value: ResearchStep): value is ContentStep { return value.startsWith("employer-") || value.startsWith("personal-"); }
export function firstRoute(state: ResearchState): Route | undefined {
  return state.participantType === "both" ? state.firstRoute || undefined : isRoute(state.participantType) ? state.participantType : undefined;
}
export function routeSteps(route: Route): ContentStep[] { return [`${route}-context`, `${route}-search`, `${route}-experience`]; }
export function completedRoutes(state: ResearchState): Route[] {
  const first = firstRoute(state);
  return first ? [first, ...(state.participantType === "both" && state.secondRoute === "yes" ? [first === "employer" ? "personal" as const : "employer" as const] : [])] : [];
}
export function getResearchSteps(state: ResearchState): ResearchStep[] {
  const [first, second] = completedRoutes(state);
  return ["intro", ...(first ? routeSteps(first) : []), ...(state.participantType === "both" && first ? ["second-route" as const] : []), ...(second ? routeSteps(second) : []), "closing", "complete"];
}
export function updateResearchAnswer(state: ResearchState, id: AnswerId, value: string | string[]): ResearchState {
  const answers = { ...state.answers, [id]: value };
  // A changed reference period must not relabel old experience as a hypothetical answer.
  if (id === "personalRecentSearch" && recentSearch(answers) !== recentSearch(state.answers)) {
    for (const key of ["personalChannels", "personalBarriers", "personalMissingInfo", "personalChecks"] as const) {
      delete answers[key]; delete answers[`${key}Other`];
    }
  }
  if (id === "employerChannels") {
    const allowed = new Set(getQuestions("employer-search", answers).find((q) => q.id === "employerEffectiveChannels")?.options?.map((o) => o.value));
    answers.employerEffectiveChannels = multiAnswer(answers, "employerEffectiveChannels").filter((v) => allowed.has(v));
  }
  for (const question of questions) {
    if (question.visible && !question.visible(answers)) { delete answers[question.id]; delete answers[`${question.id}Other`]; }
    else if (!hasOther(question, answers)) delete answers[`${question.id}Other`];
  }
  return { ...state, answers };
}
function validateQuestion(question: Question, answers: AnswerValues, errors: ResearchErrors) {
  const raw = answers[question.id];
  if (question.kind === "text") {
    if (raw !== undefined && typeof raw !== "string") errors[question.id] = "Vul een tekst in.";
    else if (!question.optional && !textAnswer(answers, question.id).trim()) errors[question.id] = "Vul dit veld in.";
    else if (textAnswer(answers, question.id).trim().length > 120) errors[question.id] = "Gebruik maximaal 120 tekens.";
  } else if (question.kind === "multi") {
    const values = multiAnswer(answers, question.id);
    const choices = question.options ?? [];
    if (!Array.isArray(raw) || !values.length) errors[question.id] = "Kies minimaal één antwoord.";
    else if (new Set(values).size !== values.length || values.some((v) => !choices.some((o) => o.value === v))) errors[question.id] = "Controleer je keuzes.";
    else if (values.length > 1 && choices.some((o) => o.exclusive && values.includes(o.value))) errors[question.id] = "Combineer dit antwoord niet met andere keuzes.";
    else if (question.max && values.length > question.max) errors[question.id] = `Kies maximaal ${question.max} antwoorden.`;
    else if (question.id === "personalSituation" && values.includes("not-working") && (values.includes("employed") || values.includes("self-employed"))) errors[question.id] = "Kies werken of niet werken; studeren kan bij allebei.";
  } else if (typeof raw !== "string" || !question.options?.some((o) => o.value === raw)) errors[question.id] = "Kies een antwoord om verder te gaan.";
  if (hasOther(question, answers)) {
    const key: AnswerId = `${question.id}Other`;
    if (typeof answers[key] !== "string" || !textAnswer(answers, key).trim()) errors[key] = "Licht je andere antwoord kort toe.";
    else if (textAnswer(answers, key).trim().length > 200) errors[key] = "Gebruik maximaal 200 tekens.";
  }
}
export function validateResearchStep(step: ResearchStep, state: ResearchState): ResearchErrors {
  const errors: ResearchErrors = {};
  if (step === "intro") {
    if (!isParticipantType(state.participantType)) errors.participantType = "Kies waarover je wilt vertellen.";
    if (state.participantType === "both" && !isRoute(state.firstRoute)) errors.firstRoute = "Kies met welke route je wilt beginnen.";
  }
  if (isContentStep(step)) for (const question of getQuestions(step, state.answers)) validateQuestion(question, state.answers, errors);
  if (step === "personal-search" && textAnswer(state.answers, "personalOpenness") === "active" && textAnswer(state.answers, "personalRecentSearch") === "no") {
    errors.personalRecentSearch = "Je gaf aan dat je nu actief zoekt. Dat telt ook mee bij deze vraag. Pas dit antwoord of je vorige antwoord aan.";
  }
  if (step === "second-route" && state.secondRoute !== "yes" && state.secondRoute !== "no") errors.secondRoute = "Kies of je de andere route wilt invullen.";
  if (step === "closing") {
    if (state.comment.trim().length > 1500) errors.comment = "Gebruik maximaal 1500 tekens.";
    if (state.interviewConsent !== "yes" && state.interviewConsent !== "no") errors.interviewConsent = "Kies of Raoul contact mag opnemen.";
    if (state.interviewConsent === "yes") {
      const contactErrors = validateLegacyStep("contact", { ...legacyInitial, name: state.name, email: state.email, phone: state.phone });
      if (contactErrors.name) errors.name = contactErrors.name;
      if (contactErrors.email) errors.email = contactErrors.email;
      if (contactErrors.phone) errors.phone = contactErrors.phone;
    }
  }
  return errors;
}
export function firstInvalidResearchStep(state: ResearchState) {
  return getResearchSteps(state).find((step) => Object.keys(validateResearchStep(step, state)).length > 0);
}
export function activeQuestions(state: ResearchState) {
  return getResearchSteps(state).filter(isContentStep).flatMap((step) => getQuestions(step, state.answers));
}
export type ResearchSubmission = {
  formVersion: typeof RESEARCH_VERSION; submissionId: string; requestedPerspective: ParticipantType;
  firstRoute: Route; completedRoutes: Route[]; participantType: ParticipantType;
  answers: AnswerValues; comment?: string; interviewConsent: boolean;
  contact?: { name: string; email: string; phone?: string };
};
export const validSubmissionId = (value: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
export function createResearchSubmission(state: ResearchState, submissionId: string): ResearchSubmission {
  const invalid = firstInvalidResearchStep(state);
  const first = firstRoute(state);
  if (invalid || !first || !isParticipantType(state.participantType) || !validSubmissionId(submissionId)) throw new Error(`Ongeldige inzending: ${invalid ?? "identificatie"}`);
  const answers: AnswerValues = {};
  for (const question of activeQuestions(state)) {
    const value = state.answers[question.id];
    if (Array.isArray(value)) answers[question.id] = question.options?.filter((o) => value.includes(o.value)).map((o) => o.value) ?? [];
    else if (typeof value === "string" && value.trim()) answers[question.id] = value.trim();
    if (hasOther(question, state.answers)) answers[`${question.id}Other`] = textAnswer(state.answers, `${question.id}Other`).trim();
  }
  const routes = completedRoutes(state);
  return {
    formVersion: RESEARCH_VERSION, submissionId: submissionId.toLowerCase(), requestedPerspective: state.participantType, firstRoute: first,
    completedRoutes: routes, participantType: routes.length === 2 ? "both" : first, answers,
    ...(state.comment.trim() ? { comment: state.comment.trim() } : {}), interviewConsent: state.interviewConsent === "yes",
    ...(state.interviewConsent === "yes" ? { contact: { name: state.name.trim(), email: state.email.trim(), ...(state.phone.trim() ? { phone: state.phone.trim() } : {}) } } : {}),
  };
}
export function stateFromResearchSubmission(submission: ResearchSubmission): ResearchState {
  return { ...initialResearch, participantType: submission.requestedPerspective, firstRoute: submission.firstRoute,
    secondRoute: submission.completedRoutes.length === 2 ? "yes" : "no", answers: submission.answers, comment: submission.comment ?? "",
    interviewConsent: submission.interviewConsent ? "yes" : "no", name: submission.contact?.name ?? "", email: submission.contact?.email ?? "", phone: submission.contact?.phone ?? "" };
}
function record(value: unknown): value is Record<string, unknown> { return !!value && typeof value === "object" && !Array.isArray(value); }
function onlyKeys(value: Record<string, unknown>, keys: string[]) { return Object.keys(value).every((key) => keys.includes(key)); }
function isAnswerId(key: string): key is AnswerId { return questionIds.some((id) => key === id || key === `${id}Other`); }
export function parseResearchSubmission(raw: unknown): ResearchSubmission | null {
  if (!record(raw) || !onlyKeys(raw, ["formVersion", "submissionId", "requestedPerspective", "firstRoute", "completedRoutes", "participantType", "answers", "comment", "interviewConsent", "contact"])) return null;
  if (raw.formVersion !== RESEARCH_VERSION || typeof raw.submissionId !== "string" || !validSubmissionId(raw.submissionId) || typeof raw.requestedPerspective !== "string" || !isParticipantType(raw.requestedPerspective) || !isRoute(raw.firstRoute) || typeof raw.interviewConsent !== "boolean" || !record(raw.answers)) return null;
  if (!Array.isArray(raw.completedRoutes) || !raw.completedRoutes.every(isRoute) || raw.completedRoutes.length < 1 || raw.completedRoutes.length > 2) return null;
  if (raw.comment !== undefined && typeof raw.comment !== "string") return null;
  const answers: AnswerValues = {};
  for (const [key, value] of Object.entries(raw.answers)) {
    if (!isAnswerId(key) || !(typeof value === "string" || (Array.isArray(value) && value.every((v): v is string => typeof v === "string")))) return null;
    answers[key] = value;
  }
  const state: ResearchState = { ...initialResearch, participantType: raw.requestedPerspective, firstRoute: raw.firstRoute, secondRoute: raw.completedRoutes.length === 2 ? "yes" : "no", interviewConsent: raw.interviewConsent ? "yes" : "no", answers, comment: raw.comment ?? "" };
  if (JSON.stringify(completedRoutes(state)) !== JSON.stringify(raw.completedRoutes) || firstRoute(state) !== raw.firstRoute) return null;
  if (raw.interviewConsent) {
    if (!record(raw.contact) || !onlyKeys(raw.contact, ["name", "email", "phone"]) || typeof raw.contact.name !== "string" || typeof raw.contact.email !== "string" || (raw.contact.phone !== undefined && typeof raw.contact.phone !== "string")) return null;
    state.name = raw.contact.name; state.email = raw.contact.email; state.phone = raw.contact.phone ?? "";
  } else if (raw.contact !== undefined) return null;
  const allowed = activeQuestions(state).flatMap((q) => [q.id, ...(hasOther(q, answers) ? [`${q.id}Other`] : [])]);
  if (Object.keys(answers).some((key) => !allowed.includes(key)) || firstInvalidResearchStep(state)) return null;
  const result = createResearchSubmission(state, raw.submissionId);
  return result.participantType === raw.participantType ? result : null;
}
export function answerLabel(question: Question, answers: AnswerValues): string {
  const value = answers[question.id];
  if (value === undefined || value === "") return "Niet ingevuld";
  if (question.kind === "text") return textAnswer(answers, question.id);
  const labels = (Array.isArray(value) ? value : [value]).map((choice) => {
    if (choice === "other" && question.id !== "employerEffectiveChannels") return `Anders: ${textAnswer(answers, `${question.id}Other`)}`;
    return question.options?.find((o) => o.value === choice)?.label ?? choice;
  });
  return labels.join("; ");
}
