import test from "node:test";
import assert from "node:assert/strict";
import {
  initialAnswers,
  getSteps,
  validateStep,
  firstInvalidStep,
  createSubmission,
} from "../src/lib/screener/steps.ts";

const filled = {
  ...initialAnswers,
  participantType: "both",
  jobSeekerExperience: "yes",
  workType: " IT ",
  employerExperience: "no",
  employerRole: " Recruiter ",
  organizationType: " Zorginstelling ",
  interview: "yes",
  name: " Testdeelnemer ",
  email: " test@example.com ",
};

test("each participant type follows the correct sequence", () => {
  for (const [type, branch] of [
    ["job-seeker", ["jobSeekerExperience", "workType"]],
    ["employer", ["employerExperience", "employerRole", "organizationType"]],
    [
      "both",
      [
        "jobSeekerExperience",
        "workType",
        "employerExperience",
        "employerRole",
        "organizationType",
      ],
    ],
  ]) {
    for (const interview of ["yes", "no"]) {
      assert.deepEqual(
        getSteps({ ...initialAnswers, participantType: type, interview }),
        [
          "intro",
          "participant",
          ...branch,
          "interview",
          ...(interview === "yes" ? ["name", "email"] : []),
          "complete",
        ],
      );
    }
  }
});

test("both experience answers remain separate, including opposite answers", () => {
  const submission = createSubmission(filled);
  assert.equal(submission.jobSeeker.experienceLast12Months, "yes");
  assert.equal(submission.employer.experienceLast12Months, "no");
  assert.equal(submission.jobSeeker.workType, "IT");
  assert.equal(submission.employer.role, "Recruiter");
  assert.equal(submission.consent, true);
  assert.deepEqual(submission.contact, {
    name: "Testdeelnemer",
    email: "test@example.com",
  });
});

test("no interview permits completion without name/email", () => {
  const answers = { ...filled, interview: "no", name: "", email: "" };
  assert.equal(firstInvalidStep(answers), undefined);
  assert.deepEqual(createSubmission(answers).openToInterview, false);
  assert.equal(createSubmission(answers).consent, false);
  assert.equal("contact" in createSubmission(answers), false);
});

test("previously entered contact and inactive route values are excluded, without erasing drafts", () => {
  const answers = { ...filled, participantType: "job-seeker", interview: "no" };
  const before = structuredClone(answers);
  const submission = createSubmission(answers);
  assert.equal("contact" in submission, false);
  assert.equal("employer" in submission, false);
  assert.deepEqual(answers, before);
  assert.equal(
    createSubmission({ ...answers, participantType: "both" }).employer
      .experienceLast12Months,
    "no",
  );
});

test("single employer route does not validate or submit job seeker answers", () => {
  const answers = {
    ...filled,
    participantType: "employer",
    jobSeekerExperience: "",
    workType: "",
  };
  assert.equal(firstInvalidStep(answers), undefined);
  assert.equal("jobSeeker" in createSubmission(answers), false);
});

test("every displayed question is required and cannot bypass final validation", () => {
  for (const step of getSteps(filled).filter(
    (id) => !["intro", "complete"].includes(id),
  )) {
    const field = step === "participant" ? "participantType" : step;
    const answers = { ...filled, [field]: "" };
    assert.ok(validateStep(step, answers), step);
    assert.equal(firstInvalidStep(answers), step);
    assert.throws(() => createSubmission(answers));
  }
});

test("blank text, overlong input, invalid choices and malformed emails are rejected", () => {
  for (const step of [
    "workType",
    "employerRole",
    "organizationType",
    "name",
    "email",
  ]) {
    assert.ok(validateStep(step, { ...filled, [step]: "   " }));
    assert.ok(validateStep(step, { ...filled, [step]: "a".repeat(501) }));
  }
  assert.ok(
    validateStep("participant", { ...filled, participantType: "invalid" }),
  );
  assert.ok(
    validateStep("jobSeekerExperience", {
      ...filled,
      jobSeekerExperience: "maybe",
    }),
  );
  for (const email of [
    "invalid",
    "a@",
    "@example.com",
    "a b@example.com",
    "a@@example.com",
    "a@example..com",
  ]) {
    assert.ok(validateStep("email", { ...filled, email }), email);
  }
  assert.equal(
    validateStep("email", { ...filled, email: "person+test@sub.example.com" }),
    null,
  );
});

test("changing route rebuilds back navigation without blank or irrelevant screens", () => {
  const seeker = getSteps({ ...filled, participantType: "job-seeker" });
  assert.equal(seeker[seeker.indexOf("interview") - 1], "workType");
  const employer = getSteps({ ...filled, participantType: "employer" });
  assert.equal(
    employer[employer.indexOf("employerExperience") - 1],
    "participant",
  );
  const no = getSteps({ ...filled, interview: "no" });
  assert.equal(no[no.indexOf("complete") - 1], "interview");
});
