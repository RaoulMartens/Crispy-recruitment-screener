import { createHash } from "node:crypto";
import { google } from "googleapis";
import { NextResponse } from "next/server";
import { parseSubmission, type Submission } from "@/lib/screener/steps";
import { SHEET_SUFFIX, sheetHeaders, toSheetRow } from "@/lib/screener/submission-storage";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const completed = new Map<string, number>();
const pending = new Map<string, Promise<void>>();
const duplicateWindowMs = 60_000;

function getConfiguration() {
  const spreadsheetId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID;
  const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!spreadsheetId || !clientEmail || !privateKey) return null;
  return { spreadsheetId, clientEmail, privateKey, sheetName: `${process.env.GOOGLE_SHEETS_SHEET_NAME || "Submissions"} ${SHEET_SUFFIX}` };
}

async function saveSubmission(payload: Submission, configuration: NonNullable<ReturnType<typeof getConfiguration>>) {
  const auth = new google.auth.GoogleAuth({
    credentials: { client_email: configuration.clientEmail, private_key: configuration.privateKey },
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  const sheets = google.sheets({ version: "v4", auth });
  const sheetRange = `'${configuration.sheetName.replace(/'/g, "''")}'`;
  const metadata = await sheets.spreadsheets.get({ spreadsheetId: configuration.spreadsheetId, fields: "sheets.properties.title" });
  if (!metadata.data.sheets?.some((sheet) => sheet.properties?.title === configuration.sheetName)) {
    try {
      await sheets.spreadsheets.batchUpdate({ spreadsheetId: configuration.spreadsheetId,
        requestBody: { requests: [{ addSheet: { properties: { title: configuration.sheetName } } }] },
      });
    } catch (error) {
      const latest = await sheets.spreadsheets.get({ spreadsheetId: configuration.spreadsheetId, fields: "sheets.properties.title" });
      if (!latest.data.sheets?.some((sheet) => sheet.properties?.title === configuration.sheetName)) throw error;
    }
  }
  const headerResponse = await sheets.spreadsheets.values.get({ spreadsheetId: configuration.spreadsheetId, range: `${sheetRange}!A1:P1` });
  const existingHeader = headerResponse.data.values?.[0] ?? [];
  if (existingHeader.length && JSON.stringify(existingHeader) !== JSON.stringify(sheetHeaders)) throw new Error("Onverwachte kolomkoppen; inzending niet opgeslagen.");
  if (!existingHeader.length) await sheets.spreadsheets.values.update({ spreadsheetId: configuration.spreadsheetId,
    range: `${sheetRange}!A1:P1`, valueInputOption: "RAW", requestBody: { values: [sheetHeaders] },
  });
  const receivedAt = new Date().toISOString();
  await sheets.spreadsheets.values.append({ spreadsheetId: configuration.spreadsheetId,
    range: `${sheetRange}!A:P`, valueInputOption: "RAW", insertDataOption: "INSERT_ROWS",
    requestBody: { values: [toSheetRow(payload, receivedAt)] },
  });
}

export async function POST(request: Request) {
  let raw: unknown;
  try { raw = await request.json(); }
  catch { return NextResponse.json({ error: "Ongeldige aanvraag." }, { status: 400 }); }
  const payload = parseSubmission(raw);
  if (!payload) return NextResponse.json({ error: "De antwoorden zijn niet geldig." }, { status: 400 });
  const configuration = getConfiguration();
  if (!configuration) return NextResponse.json({ error: "Opslag is nog niet geconfigureerd." }, { status: 503 });
  const key = createHash("sha256").update(JSON.stringify(payload)).digest("hex");
  const now = Date.now();
  for (const [cachedKey, cachedAt] of completed) if (now - cachedAt >= duplicateWindowMs) completed.delete(cachedKey);
  if (completed.has(key)) return NextResponse.json({ ok: true, deduplicated: true });
  try {
    // A concurrent retry must wait for the real write, never claim early success.
    let write = pending.get(key);
    if (!write) {
      write = saveSubmission(payload, configuration);
      pending.set(key, write);
    }
    await write;
    completed.set(key, Date.now());
    return NextResponse.json({ ok: true });
  } catch (error) {
    // Do not log the request or Google client error, which may contain contact data.
    console.error("Google Sheets submission failed", error instanceof Error ? error.name : "UnknownError");
    return NextResponse.json({ error: "Je aanmelding is nog niet verstuurd. Probeer het opnieuw." }, { status: 502 });
  } finally {
    pending.delete(key);
  }
}
