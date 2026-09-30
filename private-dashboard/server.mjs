import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve, dirname } from "node:path";
import { parseEnv } from "node:util";
import { randomBytes, timingSafeEqual } from "node:crypto";
import { google } from "googleapis";
import { versions, parseRows, RESEARCH_SHEET_SUFFIX } from "./model.mjs";

const folder = dirname(fileURLToPath(import.meta.url));
const root = resolve(folder, "..");
let local = {};
try { local = parseEnv(await readFile(resolve(root, ".env.local"), "utf8")); }
catch (error) { if (error.code !== "ENOENT") throw error; }
const env = { ...local, ...process.env };
const spreadsheetId = env.GOOGLE_SHEETS_SPREADSHEET_ID;
const email = env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
const key = env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.replace(/\\n/g, "\n");
if (!spreadsheetId || !email || !key) throw new Error("De Google Sheets-koppeling ontbreekt in .env.local.");
const port = Number(env.DASHBOARD_PORT || 3100);
if (!Number.isInteger(port) || port < 1024 || port > 65535) throw new Error("Ongeldige DASHBOARD_PORT.");
const token = randomBytes(32).toString("hex");
const sheetName = `${env.GOOGLE_SHEETS_SHEET_NAME || "Submissions"} ${RESEARCH_SHEET_SUFFIX}`;
const auth = new google.auth.GoogleAuth({ credentials: { client_email: email, private_key: key }, scopes: ["https://www.googleapis.com/auth/spreadsheets.readonly"] });
const sheets = google.sheets({ version: "v4", auth });
let cached;
let pending;
async function results() {
  if (cached && Date.now() - cached.at < 30_000) return cached.value;
  if (!pending) pending = (async () => {
    const result = await sheets.spreadsheets.values.get({ spreadsheetId, range: `'${sheetName.replace(/'/g, "''")}'!A1:BD`, valueRenderOption: "UNFORMATTED_VALUE" });
    const value = { rows: parseRows(result.data.values ?? []), versions, updatedAt: new Date().toISOString(), source: sheetName };
    cached = { at: Date.now(), value }; return value;
  })().finally(() => { pending = undefined; });
  return pending;
}
const assets = new Map([
  ["/", [resolve(folder, "index.html"), "text/html; charset=utf-8"]],
  ["/app.mjs", [resolve(folder, "app.mjs"), "text/javascript; charset=utf-8"]],
  ["/style.css", [resolve(folder, "style.css"), "text/css; charset=utf-8"]],
  ["/logo.png", [resolve(root, "public/crispy-logo.png"), "image/png"]],
  ["/font.woff2", [resolve(root, "node_modules/@fontsource/poppins/files/poppins-latin-400-normal.woff2"), "font/woff2"]],
]);
const server = createServer(async (req, res) => {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "no-referrer");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("Content-Security-Policy", "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self'; font-src 'self'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'");
  const hosts = [`127.0.0.1:${port}`, `localhost:${port}`];
  if (!hosts.includes(req.headers.host) || (req.headers.origin && !hosts.some(h => req.headers.origin === `http://${h}`))) { res.writeHead(403); res.end("Geen toegang."); return; }
  if (req.method !== "GET") { res.writeHead(405, { Allow: "GET" }); res.end("Alleen lezen toegestaan."); return; }
  const pathname = new URL(req.url, `http://127.0.0.1:${port}`).pathname;
  if (pathname === "/api/results") {
    const provided = Buffer.from(req.headers.authorization?.replace(/^Bearer /, "") ?? "");
    const expected = Buffer.from(token);
    if (provided.length !== expected.length || !timingSafeEqual(provided, expected)) { res.writeHead(401, { "Content-Type": "application/json" }); res.end(JSON.stringify({ error: "Open het dashboard via de persoonlijke startlink." })); return; }
    try { res.writeHead(200, { "Content-Type": "application/json" }); res.end(JSON.stringify(await results())); }
    catch (error) { console.error("Sheets lezen mislukt:", error.code ?? error.name); res.writeHead(502, { "Content-Type": "application/json" }); res.end(JSON.stringify({ error: "De antwoorden konden niet worden geladen. Controleer de Sheets-koppeling en probeer opnieuw." })); }
    return;
  }
  if (pathname === "/model.mjs") {
    // Reuse the exact tested aggregation logic, without shipping server imports.
    const source = await readFile(resolve(folder, "model.mjs"), "utf8");
    res.writeHead(200, { "Content-Type": "text/javascript; charset=utf-8" }); res.end(source.slice(source.indexOf("export function filterRows"))); return;
  }
  const asset = assets.get(pathname);
  if (!asset) { res.writeHead(404); res.end("Niet gevonden."); return; }
  try { const content = await readFile(asset[0]); res.writeHead(200, { "Content-Type": asset[1] }); res.end(content); }
  catch (error) { console.error("Dashboardbestand ontbreekt:", error.code); res.writeHead(500); res.end("Dashboardbestand ontbreekt."); }
});
server.listen(port, "127.0.0.1", () => console.log(`Privé-dashboard: http://127.0.0.1:${port}/#${token}`));
