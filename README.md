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
- Employers answer location, organization type, establishment size and staffing need together on one screen.
- Personal participants answer situation, required home town, optional workplace, recent search and current openness together. Workplace is hidden and omitted from submission when not working. Search and openness are independent.
- Both visits the employer screen first, then personal, without a transition screen. No answer automatically excludes a participant.
- The contact screen has an unchecked `Ik wil geen uitnodiging ontvangen` option. When unchecked, name and email are required; the explicit `Versturen` action gives permission for research email contact. No phone or contact-channel question.
- Checking the opt-out box changes the action to `Afronden` and opens the reward without sending or storing any form data. Answers remain in memory only for the read-only review during the current page visit.
- Confirmed privacy details are expandable on contact: Crispy/HAN access, six-month retention, and raoul@crispy.nl for questions/removal.
- The fortune cookie appears on every thank-you screen. Fortunes are selected from the participant's audience pool and stay fixed in the browser session.
- Participants can open a read-only summary during the current page visit and return to the thank-you screen without restarting the cookie animation. The opt-out summary omits contact details and is never submitted.

Navigation and validation live in `src/lib/screener/steps.ts`. Form state and rendering live in `src/components/screener/screener.tsx`. Fortune messages are editable in `src/lib/screener/fortunes.ts`.

## Google Sheets storage

The server-only route `src/app/api/submissions/route.ts` validates the submission and appends it to Google Sheets. Configure `GOOGLE_SHEETS_SPREADSHEET_ID`, `GOOGLE_SERVICE_ACCOUNT_EMAIL`, `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` and, optionally, `GOOGLE_SHEETS_SHEET_NAME`. Give the service account editor access and enable the Google Sheets API. Do not expose credentials through `NEXT_PUBLIC_*`.

The compact questionnaire uses 16 columns and writes to a separate tab named `<GOOGLE_SHEETS_SHEET_NAME> v4 compact` (or `Submissions v4 compact` when absent). The tab and header row are created automatically if missing; an incompatible existing header is rejected. Earlier tabs remain untouched. Each successful submission records form version `v4-minimal-2` and a server-generated consent timestamp. Only the active route's answers are submitted. Text is written as raw values to avoid spreadsheet formula interpretation.

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
