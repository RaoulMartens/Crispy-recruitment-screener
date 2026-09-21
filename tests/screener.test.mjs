import test from "node:test";
import assert from "node:assert/strict";
import { FORM_VERSION, LEGACY_FORM_VERSION, initialAnswers, getSteps, validateStep, firstInvalidStep, createSubmission, createReviewAnswers, parseSubmission, hasWorkplace } from "../src/lib/screener/steps.ts";
import { sheetHeaders, sheetHeaderUpdate, toSheetRow, SHEET_SUFFIX } from "../src/lib/screener/submission-storage.ts";

function valid(participantType = "both") {
  return { ...initialAnswers, participantType, employerLocation: " Venlo ", employerType: " Bakkerij ", employerSize: "2–9", recruitmentPattern: "yes", recruitmentInvolvement: "yes",
    workerSituation: "employed", workerHomeLocation: " Venray ", workerWorkLocation: " Venlo ", workerActiveSearch: "yes", workerOpenToWork: "no",
    name: " Test ", email: " test@example.com " };
}
test("four screens per perspective, five for both; no separate intro or contact questions", () => {
  assert.deepEqual(getSteps(valid("personal")), ["intro", "worker", "contact", "complete"]);
  assert.deepEqual(getSteps(valid("employer")), ["intro", "employer", "contact", "complete"]);
  assert.deepEqual(getSteps(valid()), ["intro", "employer", "worker", "contact", "complete"]);
});
test("all employer fields are grouped and validated with no automatic exclusion", () => {
  assert.deepEqual(Object.keys(validateStep("employer", initialAnswers)), ["employerLocation", "employerType", "employerSize", "recruitmentPattern", "recruitmentInvolvement"]);
  for (const size of ["0–1", "2–9", "10–19", "20–49", "50–249", "250 of meer", "Weet ik niet"]) {
    for (const pattern of ["yes", "no", "unknown"]) {
      for (const involvement of ["yes", "no"]) {
        const answers = { ...valid("employer"), employerSize: size, recruitmentPattern: pattern, recruitmentInvolvement: involvement };
        assert.equal(firstInvalidStep(answers), undefined);
        const payload = createSubmission(answers);
        assert.deepEqual(parseSubmission(payload), payload);
      }
    }
  }
});
test("home is required, workplace optional and excluded when not working", () => {
  const answers = { ...valid("personal"), workerSituation: "not-working", workerWorkLocation: "Stale work town" };
  assert.equal(hasWorkplace(answers), false);
  assert.equal(firstInvalidStep(answers), undefined);
  assert.equal("workLocation" in createSubmission(answers).worker, false);
  assert.ok(validateStep("worker", { ...answers, workerHomeLocation: " " }).workerHomeLocation);
  assert.equal(firstInvalidStep({ ...valid("personal"), workerWorkLocation: "" }), undefined);
  assert.ok(validateStep("worker", { ...valid("personal"), workerSituation: "both" }).workerSituation);
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
test("answer mapping keeps questionnaire and contact details separate", () => {
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
  for (const invalid of [null, [], {}, { ...payload, consent: false }, { ...payload, formVersion: "v4" }, { ...payload, contact: { ...payload.contact, channel: "phone" } }, { ...payload, employer: { ...payload.employer, hiringRole: "direct" } }, { ...payload, worker: { ...payload.worker, openToWork: "" } }]) assert.equal(parseSubmission(invalid), null);
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
  assert.equal(row[16], "");
});

test("phone is optional and retains formatting and leading zeros through parsing and storage", () => {
  for (const phone of ["", "   ", " 0612345678 ", "+31 (0)6 1234 5678", "077-1234567"]) {
    const payload = createSubmission({ ...valid(), phone });
    assert.deepEqual(parseSubmission(payload), payload);
    assert.equal(payload.contact.phone, phone.trim() || undefined);
    assert.equal(toSheetRow(payload, "2026-09-21T12:00:00.000Z")[16], phone.trim());
  }
});

test("invalid phone input is rejected by both client validation and the server boundary", () => {
  const payload = createSubmission(valid());
  for (const phone of ["123", "bel mij", "06abc12345678", "0612345678901234", "++31612345678", "0".repeat(41)]) {
    assert.ok(validateStep("contact", { ...valid(), phone }).phone);
    assert.throws(() => createSubmission({ ...valid(), phone }));
    assert.equal(parseSubmission({ ...payload, contact: { ...payload.contact, phone } }), null);
  }
  for (const phone of [612345678, null, {}, []]) {
    assert.equal(parseSubmission({ ...payload, contact: { ...payload.contact, phone } }), null);
  }
});

test("sheet header migration appends new fields without changing historical columns and is safe to retry", () => {
  const legacyHeader = sheetHeaders.slice(0, 16);
  assert.deepEqual(sheetHeaderUpdate(legacyHeader), { range: "Q1:S1", values: [["Telefoonnummer", "Patroon personeelsbehoefte/werving", "Zelf betrokken bij werving/selectie"]] });
  assert.deepEqual(sheetHeaderUpdate([...legacyHeader, "Telefoonnummer"]), { range: "R1:S1", values: [["Patroon personeelsbehoefte/werving", "Zelf betrokken bij werving/selectie"]] });
  assert.equal(sheetHeaderUpdate(sheetHeaders), null);
  assert.deepEqual(sheetHeaderUpdate([]), { range: "A1:S1", values: [sheetHeaders] });
  for (const unknown of [["timestamp"], legacyHeader.slice(0, 15), [...legacyHeader, "Not a phone column"]]) {
    assert.throws(() => sheetHeaderUpdate(unknown), /Onverwachte kolomkoppen/);
  }
  const withoutPhone = createSubmission(valid());
  const withPhone = createSubmission({ ...valid(), phone: "0612345678" });
  assert.deepEqual(toSheetRow(withPhone, "timestamp").slice(0, 16), toSheetRow(withoutPhone, "timestamp").slice(0, 16));
});

test("new employer questions are required only on employer routes and reject old question answers", () => {
  for (const participantType of ["employer", "both"]) {
    for (const field of ["recruitmentPattern", "recruitmentInvolvement"]) {
      assert.ok(validateStep("employer", { ...valid(participantType), [field]: "" })[field]);
      const payload = createSubmission(valid(participantType));
      delete payload.employer[field];
      assert.equal(parseSubmission(payload), null);
    }
  }
  const personal = createSubmission({ ...valid("personal"), recruitmentPattern: "", recruitmentInvolvement: "" });
  assert.equal(personal.employer, undefined);
  assert.deepEqual(toSheetRow(personal, "timestamp").slice(17), ["", ""]);
  const payload = createSubmission(valid());
  assert.equal(parseSubmission({ ...payload, employer: { ...payload.employer, recruitmentPattern: "multiple" } }), null);
  assert.equal(parseSubmission({ ...payload, employer: { ...payload.employer, recruitmentInvolvement: "unknown" } }), null);
  assert.equal(parseSubmission({ ...payload, employer: { ...payload.employer, staffingNeed: "multiple" } }), null);
});

test("new employer answers get separate columns instead of being recorded as the old two-year question", () => {
  const row = toSheetRow(createSubmission({ ...valid(), employerSize: "250 of meer", recruitmentPattern: "yes" }), "timestamp");
  assert.equal(row[1], FORM_VERSION);
  assert.equal(row[6], "250 of meer");
  assert.equal(row[7], "");
  assert.equal(row[17], "Ja");
  assert.equal(row[18], "Ja");
});

test("already-open legacy forms stay valid and retain their original question meaning", () => {
  for (const participantType of ["employer", "personal", "both"]) {
    const current = createSubmission(valid(participantType));
    const legacy = { ...current, formVersion: LEGACY_FORM_VERSION };
    if (current.employer) legacy.employer = { location: "Venlo", organizationType: "Bakkerij", size: "20 of meer", staffingNeed: "multiple" };
    if (current.worker) legacy.worker = { ...current.worker, situation: "both" };
    assert.deepEqual(parseSubmission(legacy), legacy);
    const row = toSheetRow(parseSubmission(legacy), "timestamp");
    assert.equal(row[1], LEGACY_FORM_VERSION);
    assert.equal(row[7], participantType === "personal" ? "" : "Ja, meerdere keren");
    assert.equal(row[8], participantType === "employer" ? "" : "Ik werk in loondienst én als zelfstandige");
    assert.deepEqual(row.slice(17), ["", ""]);
    if (legacy.employer) {
      for (const overrides of [{ size: "250 of meer" }, { staffingNeed: "recurring" }, { location: "" }, { organizationType: "" }, { recruitmentInvolvement: "yes" }]) {
        assert.equal(parseSubmission({ ...legacy, employer: { ...legacy.employer, ...overrides } }), null);
      }
      assert.equal(parseSubmission({ ...legacy, formVersion: FORM_VERSION }), null);
    }
    assert.equal(parseSubmission({ ...legacy, contact: { name: "", email: "" } }), null);
  }
});
