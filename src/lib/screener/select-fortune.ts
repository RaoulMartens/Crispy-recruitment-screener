import {
  fortunes,
  getFortunesByAudience,
  type Fortune,
  type FortuneAudience,
} from "./fortunes.ts";
import type { ParticipantType } from "@/lib/screener/steps";

const STORAGE_KEY_PREFIX = "crispy-screener:fortune-id";

type FortuneStorage = Pick<Storage, "getItem" | "setItem">;

type FortuneSelectionOptions = {
  submissionId?: string;
  storage?: FortuneStorage | null;
  randomIndex?: (poolSize: number) => number;
};

export function getFortuneAudience(
  participantType: ParticipantType,
): FortuneAudience {
  return participantType === "job-seeker" ? "jobSeeker" : participantType;
}

function hashSeed(seed: string) {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function getSessionStorage(): FortuneStorage | null {
  if (typeof window === "undefined") return null;

  try {
    return window.sessionStorage;
  } catch (error) {
    console.warn("Fortune kon niet in de sessie worden bewaard.", error);
    return null;
  }
}

function getRandomIndex(poolSize: number) {
  if (globalThis.crypto?.getRandomValues) {
    const values = new Uint32Array(1);
    const limit = Math.floor(0x1_0000_0000 / poolSize) * poolSize;

    do {
      globalThis.crypto.getRandomValues(values);
    } while (values[0] >= limit);

    return values[0] % poolSize;
  }

  const timingSeed = `${Date.now()}:${globalThis.performance?.now() ?? 0}`;
  return hashSeed(timingSeed) % poolSize;
}

function findFortuneInAudience(
  fortuneId: string | null,
  audience: FortuneAudience,
) {
  if (!fortuneId) return undefined;
  return fortunes.find(
    (fortune) =>
      fortune.id === fortuneId && fortune.audience === audience,
  );
}

function readStoredFortune(
  storage: FortuneStorage,
  storageKey: string,
  audience: FortuneAudience,
) {
  try {
    return findFortuneInAudience(storage.getItem(storageKey), audience);
  } catch (error) {
    console.warn("Opgeslagen fortune kon niet worden gelezen.", error);
    return undefined;
  }
}

function storeFortune(
  storage: FortuneStorage,
  storageKey: string,
  fortune: Fortune,
) {
  try {
    storage.setItem(storageKey, fortune.id);
  } catch (error) {
    console.warn("Fortune kon niet in de sessie worden bewaard.", error);
  }
}

export function selectFortuneForParticipant(
  participantType: ParticipantType,
  options: FortuneSelectionOptions = {},
): Fortune {
  const audience = getFortuneAudience(participantType);
  const pool = getFortunesByAudience(audience);

  if (pool.length === 0) {
    throw new Error(`Geen fortunes gevonden voor doelgroep: ${audience}`);
  }

  if (options.submissionId) {
    const index = hashSeed(`${audience}:${options.submissionId}`) % pool.length;
    return pool[index];
  }

  const storage =
    options.storage === undefined ? getSessionStorage() : options.storage;
  const storageKey = `${STORAGE_KEY_PREFIX}:${audience}`;
  const storedFortune = storage
    ? readStoredFortune(storage, storageKey, audience)
    : undefined;

  if (storedFortune) return storedFortune;

  const index = (options.randomIndex ?? getRandomIndex)(pool.length);
  if (!Number.isInteger(index) || index < 0 || index >= pool.length) {
    throw new RangeError(`Ongeldige fortune-index: ${index}`);
  }

  const selectedFortune = pool[index];
  if (storage) storeFortune(storage, storageKey, selectedFortune);
  return selectedFortune;
}
