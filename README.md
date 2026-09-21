# Crispy recruitment screener

Standalone Next.js screener for selecting interview participants in the Crispy graduation research. The form is for screening and contact only, not for conducting the interview itself.

## Run locally

Use Node.js 22 or newer:

```sh
npm ci
npm run dev
```

Open http://localhost:3000. Run `npm run build` followed by `npm start` for a production-like local run.

## Routes and consent

- Intro and perspective selection share one screen. A single perspective has four screens including completion; both has five.
- Employers answer location, organization type, establishment size, whether they regularly need staff or recruit continuously, and their own involvement together on one screen. The audience is organizations in Noord-Limburg with recurring staffing needs or ongoing recruitment; respondents must personally participate in recruitment, selection or hiring decisions. Size is descriptive, not an eligibility limit. Place names support manual regional selection; the app does not infer regional eligibility or reject responses automatically.
- Personal participants answer situation, required home town, optional workplace, recent search and current openness together. Workplace is hidden and omitted from submission when not working. Search and openness are independent.
- Both visits the employer screen first, then personal, without a transition screen. No answer automatically excludes a participant.
- The contact screen requires name and email and offers an optional phone number for participants who also want to be called. The explicit `Versturen` action submits the registration. There is no opt-out checkbox or bypass to completion; completion requires a successful save.
- Confirmed privacy details are expandable on contact: Crispy/HAN access, six-month retention, and raoul@crispy.nl for questions/removal.
- The fortune cookie appears on every thank-you screen. Fortunes are selected from the participant's audience pool and stay fixed in the browser session.
- Participants can open a read-only summary, including their phone number if provided, during the current page visit and return to the thank-you screen without restarting the cookie animation.

Navigation and validation live in `src/lib/screener/steps.ts`. Form state and rendering live in `src/components/screener/screener.tsx`. Fortune messages are editable in `src/lib/screener/fortunes.ts`.

## Google Sheets storage

The server-only route `src/app/api/submissions/route.ts` validates the submission and appends it to Google Sheets. Configure `GOOGLE_SHEETS_SPREADSHEET_ID`, `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` and, optionally, `GOOGLE_SHEETS_SHEET_NAME`. Give the service account editor access and enable the Google Sheets API. Do not expose credentials through `NEXT_PUBLIC_*`.

The compact questionnaire uses 19 columns and writes to a separate tab named `<GOOGLE_SHEETS_SHEET_NAME> v4 compact` (or `Submissions v4 compact` when absent). The tab and header row are created automatically if missing. Exact matches with the previous 16- or 17-column headers are upgraded by appending missing columns through S on the next submission. Existing responses and columns are not changed; other incompatible headers are rejected. Earlier tabs remain untouched. New submissions record form version `v4-employers-3` and a server-generated consent timestamp. Already-open `v4-minimal-2` forms remain accepted under the legacy schema, with or without a phone number.

The former two-year staffing question remains in column H for legacy submissions only. The new recurring-or-continuous recruitment answer and personal involvement go into R and S; old answers are never reinterpreted as answers to the new questions. Only the active route's answers are submitted. Text is written as raw values to preserve phone formatting/leading zeros and avoid spreadsheet formula interpretation.

Rolling back the code leaves the extra columns and existing data intact; the previous server reads and writes only columns A:Q. Keep the new API in place while new-version forms may still submit: the previous API cannot validate the new questions.

The server suppresses identical retries for one minute per running instance. A failed Sheets write returns an error and allows a retry.

Location fields use town names without a map or a map provider.

## Checks

```sh
npm run lint
npm run typecheck
npm test
npm run build
```

The tests cover compact route order, grouped validation, independent search/openness, conditional workplace omission, inactive-route omission, contact consent, strict server payload validation, storage schema and fortune stability. Browser checks use a mocked `/api/submissions` response to avoid adding test rows to the real Sheet.

## Deploy

This directory is the Vercel project root. Deploying the code requires the same server-side Sheets environment variables in Vercel. The repository is connected to Vercel; pushes to the production branch normally trigger deployment. Do not assume a local edit is live until it is committed, pushed and the Vercel deployment is ready.
