import test from "node:test";
import assert from "node:assert/strict";
import {
  initialAnswers,
  getSteps,
  getQuestionIds,
  validateStep,
  firstInvalidStep,
  createSubmission,
} from "../src/lib/screener/steps.ts";

const filled = {
  ...initialAnswers,
  participantType: "both",
  employerLocation: " Venlo ",
  employerSize: "6–10",
  employerHiringRole: "partial",
  employerRecurringNeed: "yes",
  employerCase: "maybe",
  employerFunctions: " Techniek ",
  employerInterview: "maybe",
  workerHomeLocation: " Venray ",
  workerWorkLocation: " Venlo ",
  workerSituation: "employed",
  workerActiveSearch: "no",
  workerOpenToWork: "maybe",
  workerOpenReason: " Meer ruimte ",
  workerDecisions: ["considered-stayed", "applied-stayed"],
  workerCase: "yes",
  workerInterview: "yes",
  name: " Raoul ",
  email: " raoul@example.com ",
  phone: " +31 6 12345678 ",
  contactPreference: "whatsapp",
  consent: "yes",
};

test("employer, worker and both routes have the requested order", () => {
  const employer = getSteps({ ...filled, participantType: "employer" });
  const worker = getSteps({ ...filled, participantType: "job-seeker" });
  const both = getSteps(filled);

  assert.deepEqual(employer, [
    "intro", "participant", "employerLocation", "employerSize", "employerHiringRole",
    "employerRecurringNeed", "employerCase", "employerFunctions", "employerInterview",
    "name", "email", "phone", "contactPreference", "consent", "complete",
  ]);
  assert.deepEqual(worker, [
    "intro", "participant", "workerLocations", "workerSituation", "workerActiveSearch",
    "workerOpenToWork", "workerOpenReason", "workerDecisions", "workerCase",
    "workerInterview", "name", "email", "phone", "contactPreference", "consent", "complete",
  ]);
  assert.equal(both[both.indexOf("workerLocations") - 1], "bridge");
  assert.equal(both[both.indexOf("workerLocations") + 1], "workerSituation");
  assert.ok(!worker.includes("workerRegion"));
  assert.equal(both.filter((step) => step === "name").length, 1);
  assert.equal(both.filter((step) => step === "consent").length, 1);
  assert.ok(both.indexOf("employerInterview") < both.indexOf("bridge"));
});

test("no hiring role stops employer route but not the worker half of both", () => {
  const employer = { ...filled, participantType: "employer", employerHiringRole: "no" };
  assert.deepEqual(getSteps(employer), [
    "intro", "participant", "employerLocation", "employerSize", "employerHiringRole", "complete",
  ]);
  const both = getSteps({ ...filled, employerHiringRole: "no" });
  assert.equal(both[both.indexOf("employerHiringRole") + 1], "bridge");
  assert.ok(both.includes("workerInterview"));
});

test("worker conditional questions follow actual searching and openness", () => {
  const active = getQuestionIds({ ...filled, workerActiveSearch: "yes" });
  assert.ok(!active.includes("workerOpenToWork"));
  assert.ok(!active.includes("workerOpenReason"));
  const notOpen = getQuestionIds({ ...filled, workerOpenToWork: "no" });
  assert.ok(notOpen.includes("workerOpenToWork"));
  assert.ok(!notOpen.includes("workerOpenReason"));
  const other = getQuestionIds({ ...filled, workerSituation: "other" });
  assert.equal(other[other.indexOf("workerSituation") + 1], "workerSituationOther");
});

test("interview no skips contact; maybe permits contact", () => {
  const no = { ...filled, employerInterview: "no", workerInterview: "no" };
  assert.ok(!getQuestionIds(no).includes("name"));
  const submission = createSubmission(no);
  assert.equal(submission.interviewInterest, false);
  assert.equal(submission.consent, false);
  assert.equal("contact" in submission, false);

  const maybe = { ...no, workerInterview: "maybe" };
  assert.ok(getQuestionIds(maybe).includes("consent"));
  assert.equal(createSubmission(maybe).interviewInterest, true);
});

test("no consent never sends entered contact details", () => {
  const answers = { ...filled, consent: "no" };
  const submission = createSubmission(answers);
  assert.equal(submission.interviewInterest, true);
  assert.equal(submission.consent, false);
  assert.equal("contact" in submission, false);
  assert.equal(answers.email, " raoul@example.com ");
});

test("only active route fields are submitted and values are trimmed", () => {
  const submission = createSubmission(filled);
  assert.equal(submission.employer.location, "Venlo");
  assert.equal(submission.employer.functions, "Techniek");
  assert.equal(submission.worker.homeLocation, "Venray");
  assert.equal(submission.worker.workLocation, "Venlo");
  assert.equal("region" in submission.worker, false);
  assert.deepEqual(submission.worker.decisions, ["considered-stayed", "applied-stayed"]);
  assert.deepEqual(submission.contact, {
    name: "Raoul", email: "raoul@example.com", phone: "+31 6 12345678", preference: "whatsapp",
  });

  const workerOnly = createSubmission({ ...filled, participantType: "job-seeker", workerActiveSearch: "yes" });
  assert.equal("employer" in workerOnly, false);
  assert.equal("openToWork" in workerOnly.worker, false);
  assert.equal("openReason" in workerOnly.worker, false);
});

test("optional text is optional, required choices and exclusive none are enforced", () => {
  assert.equal(validateStep("workerOpenReason", { ...filled, workerOpenReason: "" }), null);
  assert.equal(validateStep("phone", { ...filled, phone: "", contactPreference: "email" }), null);
  assert.ok(validateStep("phone", { ...filled, phone: "", contactPreference: "whatsapp" }));
  assert.equal(firstInvalidStep({ ...filled, phone: "", contactPreference: "whatsapp" }), "phone");
  assert.ok(validateStep("workerDecisions", { ...filled, workerDecisions: ["none", "changed-job"] }));
  assert.ok(validateStep("workerDecisions", { ...filled, workerDecisions: [] }));
  assert.equal(validateStep("workerDecisions", { ...filled, workerDecisions: ["none"] }), null);
  assert.ok(validateStep("employerSize", { ...filled, employerSize: "invalid" }));
  assert.equal(validateStep("workerLocations", { ...filled, workerHomeLocation: "", workerWorkLocation: "" }), null);
  assert.ok(validateStep("workerLocations", { ...filled, workerHomeLocation: "a".repeat(121) }));
  assert.ok(validateStep("workerLocations", { ...filled, workerWorkLocation: "a".repeat(121) }));
  const noLocations = createSubmission({ ...filled, workerHomeLocation: "", workerWorkLocation: "" });
  assert.equal("homeLocation" in noLocations.worker, false);
  assert.equal("workLocation" in noLocations.worker, false);
  assert.ok(validateStep("email", { ...filled, email: "a@@example.com" }));
  assert.throws(() => createSubmission({ ...filled, workerDecisions: [] }));
});

test("changing routes preserves drafts without submitting inactive values", () => {
  const answers = { ...filled, participantType: "employer", workerInterview: "maybe" };
  const original = structuredClone(answers);
  const submission = createSubmission(answers);
  assert.equal("worker" in submission, false);
  assert.deepEqual(answers, original);
  assert.equal(createSubmission({ ...answers, participantType: "both" }).worker.interview, "maybe");
});
