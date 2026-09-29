import { createHash } from "node:crypto";
import { parseSubmission } from "./steps.ts";
import { parseResearchSubmission } from "./research.ts";
import { isResearchSubmission, type AnySubmission } from "./research-storage.ts";

export class SubmissionConflict extends Error {
  constructor() { super("Inzend-ID is al gebruikt voor andere antwoorden."); this.name = "SubmissionConflict"; }
}
export type SubmissionWriter = (payload: AnySubmission, fingerprint: string) => Promise<void>;
export function createSubmissionHandler(getWriter: () => SubmissionWriter | null) {
  const completed = new Map<string, { hash: string; time: number }>();
  const pending = new Map<string, { hash: string; promise: Promise<void> }>();
  return async (request: Request): Promise<Response> => {
    let raw: unknown;
    try { raw = await request.json(); }
    catch { return Response.json({ error: "Ongeldige aanvraag." }, { status: 400 }); }
    const payload = parseResearchSubmission(raw) ?? parseSubmission(raw);
    if (!payload) return Response.json({ error: "De antwoorden zijn niet geldig." }, { status: 400 });
    const writer = getWriter();
    if (!writer) return Response.json({ error: "Opslag is nog niet geconfigureerd." }, { status: 503 });
    const hash = createHash("sha256").update(JSON.stringify(payload)).digest("hex");
    const key = isResearchSubmission(payload) ? `research:${payload.submissionId}` : `legacy:${hash}`;
    const now = Date.now();
    for (const [id, item] of completed) if (now - item.time >= 60_000) completed.delete(id);
    const previous = completed.get(key) ?? pending.get(key);
    if (previous && previous.hash !== hash) return Response.json({ error: "Deze inzending is al ontvangen met andere antwoorden." }, { status: 409 });
    if (completed.has(key)) return Response.json({ ok: true, deduplicated: true });
    let write = pending.get(key);
    try {
      if (!write) {
        write = { hash, promise: writer(payload, hash) };
        pending.set(key, write);
      }
      await write.promise;
      completed.set(key, { hash, time: Date.now() });
      return Response.json({ ok: true });
    } catch (error) {
      if (error instanceof SubmissionConflict) return Response.json({ error: "Deze inzending is al ontvangen met andere antwoorden." }, { status: 409 });
      // Never log submitted answers, credentials or Google response bodies.
      console.error("Submission storage failed", error instanceof Error ? error.name : "UnknownError");
      return Response.json({ error: "De opslag is niet bevestigd. Probeer het opnieuw." }, { status: 502 });
    } finally {
      if (pending.get(key) === write) pending.delete(key);
    }
  };
}
