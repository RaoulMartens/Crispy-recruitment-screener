# Recruitment screener

Standalone Next.js App Router project with TypeScript, Tailwind CSS and local shadcn/ui components. It has no dependency on Tally.

## Run locally

Node.js 22 or newer is recommended.

```sh
npm ci
npm run dev
```

Open http://localhost:3000. Production: `npm run build`, then `npm start`.

## Project structure

```text
src/
  app/
    layout.tsx                Dutch document, metadata and bundled font
    page.tsx                  Server-rendered route entry
    globals.css               Minimal light theme and spacing tokens
  components/
    screener/
      screener.tsx            Client state, validation, navigation and submission request
      step-frame.tsx          Shared question layout and heading focus
    ui/                       Generated shadcn/ui primitives
  app/api/submissions/route.ts  Server-side Google Sheets submission route
  lib/
    screener/steps.ts          Conditional routes, answer types and validation
    utils.ts                  Shared class-name utility
components.json               shadcn/ui CLI configuration
next.config.ts                Standard Next.js configuration
```

## Scope of this version

Intro -> participant choice -> job seeker route and/or employer route -> interview choice -> name and email only when yes -> thank-you state.

Only one question is displayed at a time. Back/next preserve answers in React state, including when revisiting the intro or end screen. Restart clears answers. Refresh resets the flow. The participant choice requires one answer and has inline validation. Radio choices support keyboard navigation; focus moves to each new heading. The mobile layout uses 48px action buttons and wrapping choice labels. Reduced-motion preferences are respected.

Job seekers answer two questions; employers answer three. Both completes both routes in that order, with separate experience fields. A no answer to an experience question does not disqualify participants. All displayed questions are required. Text must contain more than whitespace; email has format validation. Name and email each have their own screen.

Draft answers remain intact even when changing participant type or switching the interview choice. The final typed submission snapshot contains only the active routes; contact details are excluded when the interview answer is no, even if they were previously entered. Full-route validation runs before completion.

On the final step, the active submission is sent to `/api/submissions`, which appends one row to Google Sheets. Only the eleven documented columns are sent: timestamp, participant type, job search activity, work type, recruitment involvement, recruitment role, organisation type, willing to interview, name, email and consent. Non-applicable route fields stay empty. Contact details are omitted when the participant does not want an interview. The client disables the final action while the request is in flight, and the server suppresses identical retries for one minute per running instance.

The Google Sheets route uses a service account on the server only. Set `GOOGLE_SHEETS_SHEET_NAME` to the exact tab name in your spreadsheet (this project uses `Blad1`), add the service account as an editor of the spreadsheet, and enable the Google Sheets API. The first row can contain these headers in order:

```text
timestamp | participant type | job search activity | work type | recruitment involvement | recruitment role | organisation type | willing to interview | name | email | consent
```

## Checks

```sh
npm run lint
npm run typecheck
npm test
npm run build
```

The Node test suite covers all six route/contact combinations, separate experience answers, required fields, email validation, route changes, and omission of inactive answers from the final payload. Browser checks additionally cover navigation, focus, and preservation of entered values.

## Deploy to Vercel

Import this project directory into Vercel using the Next.js preset. If imported from a parent repository, set Root Directory to this project folder. Use `npm run build`; leave the output-directory default. Add the variables from `.env.example` to the Vercel project environment, including the private key with escaped `\\n` line breaks. Keep them server-only and do not expose them through `NEXT_PUBLIC_*`. Deployment has not been performed.

## References

- https://nextjs.org/docs/app/getting-started/installation
- https://ui.shadcn.com/docs/installation/next
