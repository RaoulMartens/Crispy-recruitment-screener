import test from "node:test";
import assert from "node:assert/strict";
import {
  fortunes,
  fortuneAudiences,
  fortuneTones,
  getFortunesByAudience,
} from "../src/lib/screener/fortunes.ts";
import {
  getFortuneAudience,
  selectFortuneForParticipant,
} from "../src/lib/screener/select-fortune.ts";

function createStorage() {
  const values = new Map();

  return {
    getItem(key) {
      return values.get(key) ?? null;
    },
    setItem(key, value) {
      values.set(key, value);
    },
  };
}

test("the fortune data contains 90 unique entries", () => {
  assert.equal(fortunes.length, 90);
  assert.equal(new Set(fortunes.map((fortune) => fortune.id)).size, 90);
});

test("each audience has all five tones with six fortunes each", () => {
  for (const audience of fortuneAudiences) {
    const audiencePool = getFortunesByAudience(audience);
    assert.equal(audiencePool.length, 30);

    for (const tone of fortuneTones) {
      assert.equal(
        audiencePool.filter((fortune) => fortune.tone === tone).length,
        6,
      );
    }
  }
});

test("participant types map to the correct audience", () => {
  assert.equal(getFortuneAudience("job-seeker"), "jobSeeker");
  assert.equal(getFortuneAudience("employer"), "employer");
  assert.equal(getFortuneAudience("both"), "both");
});

test("a session keeps one selected fortune without selecting again", () => {
  const storage = createStorage();
  let selectionCount = 0;
  const first = selectFortuneForParticipant("job-seeker", {
    storage,
    randomIndex(poolSize) {
      selectionCount += 1;
      assert.equal(poolSize, 30);
      return 17;
    },
  });
  const second = selectFortuneForParticipant("job-seeker", {
    storage,
    randomIndex() {
      throw new Error("A stored fortune must not be selected again.");
    },
  });

  assert.equal(selectionCount, 1);
  assert.equal(second.id, first.id);
  assert.equal(first.audience, "jobSeeker");
});

test("audience pools remain isolated in the same session", () => {
  const storage = createStorage();
  const jobSeekerFortune = selectFortuneForParticipant("job-seeker", {
    storage,
    randomIndex: () => 0,
  });
  const employerFortune = selectFortuneForParticipant("employer", {
    storage,
    randomIndex: () => 29,
  });
  const bothFortune = selectFortuneForParticipant("both", {
    storage,
    randomIndex: () => 14,
  });

  assert.equal(jobSeekerFortune.audience, "jobSeeker");
  assert.equal(employerFortune.audience, "employer");
  assert.equal(bothFortune.audience, "both");
});

test("a stable submission id deterministically selects the same fortune", () => {
  const first = selectFortuneForParticipant("employer", {
    submissionId: "submission-42",
    storage: null,
    randomIndex() {
      throw new Error("A stable submission id must take precedence.");
    },
  });
  const second = selectFortuneForParticipant("employer", {
    submissionId: "submission-42",
    storage: null,
    randomIndex() {
      throw new Error("A stable submission id must take precedence.");
    },
  });

  assert.equal(first.id, second.id);
  assert.equal(first.audience, "employer");
});
