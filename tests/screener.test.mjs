import test from "node:test";
import assert from "node:assert/strict";
import { FORM_VERSION, initialAnswers, getSteps, validateStep, firstInvalidStep, createSubmission, createReviewAnswers, parseSubmission, hasWorkplace } from "../src/lib/screener/steps.ts";
import { sheetHeaders, toSheetRow, SHEET_SUFFIX } from "../src/lib/screener/submission-storage.ts";

function valid(participantType = "both") {
  return { ...initialAnswers, participantType, employerLocation: " Venlo ", employerType: " Bakkerij ", employerSize: "2–9", staffingNeed: "multiple",
    workerSituation: "employed", workerHomeLocation: " Venray ", workerWorkLocation: " Venlo ", workerActiveSearch: "yes", workerOpenToWork: "no",
    name: " Test ", email: " test@example.com " };
}
test("four screens per perspective, five for both; no separate intro or contact questions", () => {
  assert.deepEqual(getSteps(valid("personal")), ["intro", "worker", "contact", "complete"]);
  assert.deepEqual(getSteps(valid("employer")), ["intro", "employer", "contact", "complete"]);
  assert.deepEqual(getSteps(valid()), ["intro", "employer", "worker", "contact", "complete"]);
});
test("all employer fields are grouped and validated with no automatic exclusion", () => {
  assert.deepEqual(Object.keys(validateStep("employer", initialAnswers)), ["employerLocation", "employerType", "employerSize", "staffingNeed"]);
  for (const size of ["0–1", "2–9", "10–19", "20 of meer", "Weet ik niet"]) {
    for (const need of ["multiple", "once", "no", "unknown"]) assert.equal(firstInvalidStep({ ...valid("employer"), employerSize: size, staffingNeed: need }), undefined);
  }
});
test("home is required, workplace optional and excluded when not working", () => {
  const answers = { ...valid("personal"), workerSituation: "not-working", workerWorkLocation: "Stale work town" };
  assert.equal(hasWorkplace(answers), false);
  assert.equal(firstInvalidStep(answers), undefined);
  assert.equal("workLocation" in createSubmission(answers).worker, false);
  assert.ok(validateStep("worker", { ...answers, workerHomeLocation: " " }).workerHomeLocation);
  assert.equal(firstInvalidStep({ ...valid("personal"), workerWorkLocation: "" }), undefined);
});
test("recent searching and current openness remain independent and always required", () => {
  for (const searched of ["yes", "no"]) {
    for (const openness of ["yes", "maybe", "no"]) {
      const answers = { ...valid("personal"), workerActiveSearch: searched, workerOpenToWork: openness };
      const submission = createSubmission(answers);
      assert.equal(submission.worker.activeSearch, searched);
      assert.equal(submission.worker.openToWork, openness);
    }
    assert.ok(validateStep("worker", { ...valid("personal"), workerActiveSearch: searched, workerOpenToWork: "" }).workerOpenToWork);
  }
});
test("route changes omit inactive answers, trim values, and keep home/work independent", () => {
  const employer = createSubmission(valid("employer"));
  assert.equal("worker" in employer, false);
  const personal = createSubmission(valid("personal"));
  assert.equal("employer" in personal, false);
  assert.equal(personal.worker.homeLocation, "Venray");
  assert.equal(personal.worker.workLocation, "Venlo");
  assert.deepEqual(personal.contact, { name: "Test", email: "test@example.com" });
  const both = createSubmission({ ...valid(), employerLocation: "Maastricht", workerWorkLocation: "" });
  assert.equal("workLocation" in both.worker, false);
});
test("registration requires valid contact data and carries consent from the submit action", () => {
  const errors = validateStep("contact", initialAnswers);
  assert.equal(errors.name, "Vul je naam in.");
  assert.equal(errors.email, "Vul een geldig e-mailadres in.");
  assert.equal(createSubmission(valid()).consent, true);
  for (const overrides of [{ name: " " }, { email: "wrong" }]) assert.throws(() => createSubmission({ ...valid(), ...overrides }));
});
test("opt-out review shows answers without requiring or retaining contact details", () => {
  const answers = { ...valid("personal"), name: "", email: "" };
  const review = createReviewAnswers(answers);
  assert.equal(review.worker.homeLocation, "Venray");
  assert.equal(review.worker.workLocation, "Venlo");
  assert.equal("contact" in review, false);
  assert.equal("consent" in review, false);
  assert.throws(() => createReviewAnswers({ ...answers, workerHomeLocation: "" }));
});
test("server accepts exactly the compact schema and rejects missing consent and legacy fields", () => {
  const payload = createSubmission(valid());
  assert.deepEqual(parseSubmission(payload), payload);
  for (const invalid of [null, [], {}, { ...payload, consent: false }, { ...payload, formVersion: "v4" }, { ...payload, contact: { ...payload.contact, phone: "0612345678" } }, { ...payload, employer: { ...payload.employer, hiringRole: "direct" } }, { ...payload, worker: { ...payload.worker, openToWork: "" } }]) assert.equal(parseSubmission(invalid), null);
  assert.equal(parseSubmission({ ...createSubmission(valid("personal")), employer: payload.employer }), null);
  assert.equal(parseSubmission({ ...payload, worker: { ...payload.worker, situation: "not-working" } }), null);
});
test("storage preserves older tabs and records version and consent time in the row", () => {
  assert.equal(SHEET_SUFFIX, "v4 compact");
  const row = toSheetRow(createSubmission(valid("personal")), "2026-09-17T12:00:00.000Z");
  assert.equal(row.length, sheetHeaders.length);
  assert.equal(row[1], FORM_VERSION);
  assert.equal(row[2], row[0]);
  assert.deepEqual(row.slice(4, 8), ["", "", "", ""]);
  assert.equal(row[11], "Ja");
  assert.equal(row[12], "Nee");
  assert.equal(row[15], "Ja");
});
