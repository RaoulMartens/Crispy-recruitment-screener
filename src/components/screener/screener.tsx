"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Image from "next/image";
import { ArrowLeft, ArrowRight, Check, Info, Share2 } from "lucide-react";
import welcomeCover from "../../../public/welcome-cover.webp";
import { Button } from "@/components/ui/button";
import { StepFrame } from "@/components/screener/step-frame";
import { TextField, ChoiceField, SelectField } from "@/components/screener/form-fields";
import { CompletionConfetti } from "@/components/screener/completion-confetti";
import { FortuneCookieAnimation } from "@/components/screener/fortune-cookie-animation";
import type { Fortune } from "@/lib/screener/fortunes";
import { selectFortuneForParticipant } from "@/lib/screener/select-fortune";
import {
  initialAnswers, getSteps, validateStep, firstInvalidStep, createSubmission, createReviewAnswers, isParticipantType, hasWorkplace,
  participantOptions, employerSizeOptions, staffingNeedOptions, workerSituationOptions, yesNoOptions, opennessOptions,
  type Answers, type FieldErrors, type StepId, type Submission, type ReviewAnswers,
} from "@/lib/screener/steps";

const titles: Record<StepId, string> = {
  intro: "Denk mee over werk en personeel", employer: "Over jullie organisatie", worker: "Over jouw werk",
  contact: "Mag ik je mailen?", complete: "Bedankt",
};
const descriptions: Partial<Record<StepId, string>> = {
  intro: "Voor mijn afstudeerproject bij Crispy onderzoek ik hoe arbeidsrelaties tussen kleinere werkgevers en mensen in Noord-Limburg ontstaan, en wat ervoor zorgt dat die wel of niet goed werken.",
  employer: "Vul dit in voor de vestiging waarvoor jij betrokken bent bij het aannemen van personeel.",
  contact: "Ik mail je als jouw situatie aansluit op de gesprekken die ik wil voeren. Het gesprek duurt ongeveer 30–45 minuten. Je beslist daarna of je meedoet.",
};
type Completion =
  | { registered: true; fortune: Fortune; screenCount: number; submission: Submission }
  | { registered: false; fortune: Fortune; screenCount: number; review: ReviewAnswers };

function ReviewSection({ title, rows }: { title: string; rows: { label: string; value: string }[] }) {
  return <section className="space-y-4">
    <h2 className="text-xl font-semibold sm:text-2xl">{title}</h2>
    <dl className="space-y-4">
      {rows.map(({ label, value }) => <div key={label}>
        <dt className="text-sm text-muted-foreground">{label}</dt>
        <dd className="mt-1 text-sm">{value}</dd>
      </div>)}
    </dl>
  </section>;
}

function SubmittedAnswers({ review, contact }: { review: ReviewAnswers; contact?: Submission["contact"] }) {
  const labelFor = (options: readonly { value: string; label: string }[], value: string) =>
    options.find((option) => option.value === value)?.label ?? value;
  const { employer, worker } = review;
  return <div className="space-y-9">
    <ReviewSection title="Perspectief" rows={[{ label: "Waarover wil je vertellen?", value: labelFor(participantOptions, review.participantType) }]} />
    {employer && <ReviewSection title="Over jullie organisatie" rows={[
      { label: "Vestigingsplaats", value: employer.location },
      { label: "Type bedrijf of organisatie", value: employer.organizationType },
      { label: "Aantal mensen op deze vestiging", value: employer.size },
      { label: "Personeelsbehoefte in de afgelopen twee jaar", value: labelFor(staffingNeedOptions, employer.staffingNeed) },
    ]} />}
    {worker && <ReviewSection title="Over jouw werk" rows={[
      { label: "Huidige werksituatie", value: labelFor(workerSituationOptions, worker.situation) },
      { label: "Woonplaats", value: worker.homeLocation },
      ...(worker.situation !== "not-working" ? [{ label: "Werkplaats", value: worker.workLocation ?? "Niet ingevuld" }] : []),
      { label: "Afgelopen drie maanden gericht gezocht", value: labelFor(yesNoOptions, worker.activeSearch) },
      { label: "Nu open voor een nieuwe baan", value: labelFor(opennessOptions, worker.openToWork) },
    ]} />}
    {contact && <ReviewSection title="Contactgegevens" rows={[{ label: "Naam", value: contact.name }, { label: "E-mailadres", value: contact.email }]} />}
  </div>;
}

function PrivacyInfo() {
  const [open, setOpen] = useState(false);
  return <span className="group relative inline-flex shrink-0" onBlur={(event) => {
    if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
  }} onKeyDown={(event) => {
    if (event.key === "Escape") { setOpen(false); event.currentTarget.querySelector("button")?.blur(); }
  }}>
    <button type="button" aria-label="Meer over je gegevens" aria-controls="email-privacy-info" aria-expanded={open}
      onClick={() => setOpen((current) => !current)} className="flex size-5 items-center justify-center rounded-full text-muted-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
      <Info size={16} aria-hidden="true" />
    </button>
    <span id="email-privacy-info" role="group" aria-label="Meer over je gegevens" data-open={open}
      className="invisible absolute top-full -left-24 z-20 w-[min(20rem,calc(100vw-3rem))] rounded-md border border-border bg-background p-3 text-xs leading-5 text-foreground opacity-0 shadow-md transition-opacity group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100 data-[open=true]:visible data-[open=true]:opacity-100 sm:left-0">
      Crispy en HAN hebben toegang tot de gegevens. De gegevens worden 6 maanden bewaard. Voor vragen of een verzoek om je gegevens te verwijderen kun je mailen naar <a href="mailto:raoul@crispy.nl" className="underline underline-offset-2">raoul@crispy.nl</a>.
    </span>
  </span>;
}

export function Screener() {
  const [stepId, setStepId] = useState<StepId>("intro");
  const [answers, setAnswers] = useState<Answers>({ ...initialAnswers });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [sendError, setSendError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [noInvitation, setNoInvitation] = useState(false);
  const [completion, setCompletion] = useState<Completion | null>(null);
  const [viewingAnswers, setViewingAnswers] = useState(false);
  const [visitedAnswers, setVisitedAnswers] = useState(false);
  const [shareStatus, setShareStatus] = useState<"idle" | "shared" | "copied" | "error">("idle");
  const sendingRef = useRef(false);
  const focusFieldRef = useRef<string | null>(null);
  const shareTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const steps = getSteps(answers);
  const stepIndex = steps.indexOf(stepId);
  const screenCount = completion?.screenCount ?? steps.length;
  const screenNumber = completion ? screenCount : stepIndex + 1;

  useEffect(() => {
    if (focusFieldRef.current) {
      const field = document.getElementById(focusFieldRef.current);
      const control = field?.querySelector<HTMLElement>("button, input, select") ?? field;
      control?.focus();
      focusFieldRef.current = null;
    }
  }, [errors, stepId]);
  useEffect(() => () => { if (shareTimerRef.current) clearTimeout(shareTimerRef.current); }, []);

  function goTo(id: StepId) {
    setErrors({});
    setSendError(null);
    setStepId(id);
    window.scrollTo({ top: 0, behavior: "instant" });
  }
  function updateAnswer<Key extends keyof Answers>(field: Key, value: Answers[Key]) {
    setAnswers((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setSendError(null);
  }
  function fieldProps(field: keyof Answers) {
    return { id: field, value: answers[field], onChange: (value: string) => updateAnswer(field, value), error: errors[field] };
  }
  function showErrors(id: StepId, nextErrors: FieldErrors) {
    focusFieldRef.current = Object.keys(nextErrors)[0] ?? null;
    setStepId(id);
    setErrors(nextErrors);
  }
  function finish(registered: false): void;
  function finish(registered: true, submission: Submission): void;
  function finish(registered: boolean, submission?: Submission) {
    if (!isParticipantType(answers.participantType)) return;
    // Opting out keeps answers only in this page for the review; nothing is sent or persisted.
    const fortune = selectFortuneForParticipant(answers.participantType, registered ? {} : { storage: null });
    if (registered && submission) setCompletion({ registered: true, fortune, screenCount: steps.length, submission });
    else setCompletion({ registered: false, fortune, screenCount: steps.length, review: createReviewAnswers(answers) });
    setViewingAnswers(false);
    setVisitedAnswers(false);
    setAnswers({ ...initialAnswers });
    setNoInvitation(false);
    goTo("complete");
  }
  async function next(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sendingRef.current) return;
    if (stepId === "contact" && noInvitation) { finish(false); return; }
    const nextErrors = validateStep(stepId, answers);
    if (Object.keys(nextErrors).length) { showErrors(stepId, nextErrors); return; }
    if (stepId !== "contact") { goTo(steps[stepIndex + 1]); return; }
    const invalid = firstInvalidStep(answers);
    if (invalid) { showErrors(invalid, validateStep(invalid, answers)); return; }
    sendingRef.current = true;
    setBusy(true);
    setSendError(null);
    const submission = createSubmission(answers);
    let saved = false;
    try {
      const response = await fetch("/api/submissions", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(submission),
      });
      const result: unknown = await response.json();
      saved = response.ok && typeof result === "object" && result !== null && "ok" in result && result.ok === true;
    } catch {
      saved = false;
    } finally {
      sendingRef.current = false;
      setBusy(false);
    }
    if (saved) finish(true, submission);
    else setSendError("Je aanmelding is nog niet verstuurd. Probeer het opnieuw.");
  }
  function showShareStatus(status: Exclude<typeof shareStatus, "idle">) {
    if (shareTimerRef.current) clearTimeout(shareTimerRef.current);
    setShareStatus(status);
    shareTimerRef.current = setTimeout(() => setShareStatus("idle"), 2500);
  }
  async function shareResearch() {
    const url = new URL("/", window.location.origin);
    url.searchParams.set("via", "share");
    if (navigator.share) {
      try {
        await navigator.share({ text: "Ken je iemand voor wie dit relevant is? Stuur 'm door.", url: url.toString() });
        showShareStatus("shared"); return;
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") return;
      }
    }
    try { await navigator.clipboard.writeText(url.toString()); showShareStatus("copied"); }
    catch { showShareStatus("error"); }
  }

  return <div className="flex min-h-svh flex-col">
    {stepId === "intro" && <div className="relative h-44 w-full shrink-0 sm:h-58">
      <Image src={welcomeCover} alt="Iemand werkt aan een bureau met een laptop en telefoon." fill sizes="100vw" preload placeholder="blur" className="object-cover object-[50%_43%]" />
    </div>}
    <div className="screener mx-auto flex w-full max-w-4xl flex-1 flex-col px-6 sm:px-10">
      <main id="main-content" className="mx-auto w-full max-w-[34rem] flex-1 pb-16 pt-8 sm:pt-12">
        <div className="mb-6 flex min-h-5 items-center justify-between gap-4 text-xs text-muted-foreground tabular-nums">
          <span>{stepId === "intro" ? "Invullen duurt ongeveer 1–2 minuten." : stepId === "contact" ? "Contactgegevens" : stepId === "complete" ? "Afgerond" : titles[stepId]}</span>
          {(isParticipantType(answers.participantType) || completion) && <span aria-label={`Scherm ${screenNumber} van ${screenCount}`}>{screenNumber} / {screenCount}</span>}
        </div>
        {stepId !== "complete" && <StepFrame key={stepId} title={titles[stepId]} description={descriptions[stepId]} roomyDescription={stepId === "intro"} visuallyHiddenTitle={stepId === "worker"}>
          <form onSubmit={next} noValidate aria-labelledby="step-title" aria-busy={busy}>
            <fieldset disabled={busy} className="min-w-0">
              {stepId === "intro" && <>
                <p className="mb-4 text-[0.9375rem] leading-[1.55] text-muted-foreground">Daarover ga ik graag ongeveer 30–45 minuten met je in gesprek. Met een paar korte vragen kijk ik wie ik kan uitnodigen. Aanmelden is vrijblijvend.</p>
                <p className="mb-8 text-sm leading-[1.55] font-medium">Als bedankje krijg je aan het einde een digitaal gelukskoekje.</p>
                <ChoiceField {...fieldProps("participantType")} label="Waarover wil je vertellen?" options={participantOptions} />
                {answers.participantType === "both" && <p className="mt-3 text-sm leading-[1.55] text-muted-foreground">Je krijgt een kort onderdeel over je organisatie en een over jouw eigen werk.</p>}
              </>}
              {stepId === "employer" && <div className="space-y-9">
                <section aria-labelledby="organization-block" className="space-y-5">
                  <h2 id="organization-block" className="text-xl font-semibold sm:text-2xl">De organisatie</h2>
                  <TextField {...fieldProps("employerLocation")} label="In welke plaats is deze vestiging gevestigd?" placeholder="Plaatsnaam" />
                  <TextField {...fieldProps("employerType")} label="Wat voor bedrijf of organisatie is het?" hint="Bijvoorbeeld een bakkerij, installatiebedrijf of zorgpraktijk." maxLength={200} />
                  <SelectField {...fieldProps("employerSize")} label="Hoeveel mensen werken op deze vestiging?" options={employerSizeOptions} />
                </section>
                <section aria-labelledby="staffing-block" className="space-y-5 border-t border-border pt-7">
                  <h2 id="staffing-block" className="text-xl font-semibold sm:text-2xl">Personeelsbehoefte</h2>
                  <ChoiceField {...fieldProps("staffingNeed")} label="Heeft deze vestiging de afgelopen twee jaar extra of vervangend personeel nodig gehad?" hint="Het maakt niet uit of er uiteindelijk iemand is aangenomen." options={staffingNeedOptions} />
                </section>
              </div>}
              {stepId === "worker" && <div className="space-y-9">
                <section aria-labelledby="work-block" className="space-y-5">
                  <h2 id="work-block" className="text-xl font-semibold sm:text-2xl">Je werksituatie en locatie</h2>
                  <ChoiceField {...fieldProps("workerSituation")} label="Wat is je huidige werksituatie?" hint="Ook een bijbaan telt als werk." options={workerSituationOptions} />
                  <TextField {...fieldProps("workerHomeLocation")} label="Waar woon je?" placeholder="Plaatsnaam" />
                  {hasWorkplace(answers) && <TextField {...fieldProps("workerWorkLocation")} label="Waar werk je?" placeholder="Plaatsnaam" optional hint="Geen vaste werkplaats? Dan mag je dit leeg laten." />}
                </section>
                <section aria-labelledby="search-block" className="space-y-6 border-t border-border pt-7">
                  <h2 id="search-block" className="text-xl font-semibold sm:text-2xl">Zoeken en openstaan</h2>
                  <ChoiceField {...fieldProps("workerActiveSearch")} label="Heb je de afgelopen drie maanden gericht naar een baan gezocht?" hint="Bijvoorbeeld vacatures gezocht, contact opgenomen over een baan of gesolliciteerd." options={yesNoOptions} />
                  <ChoiceField {...fieldProps("workerOpenToWork")} label="Sta je op dit moment open voor een nieuwe baan?" options={opennessOptions} />
                </section>
              </div>}
              {stepId === "contact" && <div className="space-y-5">
                <TextField {...fieldProps("name")} label="Naam" hint="Een voornaam is voldoende." autoComplete="given-name" disabled={noInvitation} />
                <TextField {...fieldProps("email")} label="E-mailadres" type="email" autoComplete="email" maxLength={254} placeholder="naam@voorbeeld.nl" accessory={<PrivacyInfo />} disabled={noInvitation} />
                <p className="text-sm leading-[1.55] text-muted-foreground">Je antwoorden worden gebruikt om interviewdeelnemers te selecteren. Je naam en e-mailadres worden gebruikt om contact met je op te nemen.</p>
                <div>
                  <label className="flex min-h-10 cursor-pointer items-center gap-3 py-1 text-sm leading-[1.55]" htmlFor="noInvitation">
                    <input id="noInvitation" name="noInvitation" type="checkbox" checked={noInvitation} onChange={(event) => { setNoInvitation(event.target.checked); setErrors({}); setSendError(null); }}
                      className="size-5 shrink-0 accent-primary" />
                    <span>Ik wil geen uitnodiging ontvangen.</span>
                  </label>
                  {noInvitation && <p className="mt-1 text-sm leading-[1.55] text-muted-foreground">Je gegevens worden niet verstuurd of opgeslagen. Je kunt nog steeds je gelukskoekje openen.</p>}
                </div>
              </div>}
              {Object.values(errors).some(Boolean) && <p role="alert" className="sr-only">Controleer de gemarkeerde velden.</p>}
              {sendError && <p role="alert" className="mt-5 text-sm text-destructive">{sendError}</p>}
              <div className="mt-8 flex items-center justify-between gap-4">
                {stepId !== "intro" ? <Button type="button" variant="ghost" size="lg" onClick={() => goTo(steps[stepIndex - 1])} className="back-button -ml-4 text-muted-foreground"><ArrowLeft aria-hidden="true" className="back-arrow" /> Terug</Button> : <span />}
                <Button type="submit" size="lg" className="next-button" disabled={busy}>{busy ? "Versturen…" : stepId === "contact" ? noInvitation ? "Afronden" : "Versturen" : "Verder"}<ArrowRight aria-hidden="true" className="next-arrow" /></Button>
              </div>
            </fieldset>
          </form>
        </StepFrame>}
        {stepId === "complete" && completion && <>
          {completion.registered && !visitedAnswers && <CompletionConfetti />}
          <StepFrame key="complete" title={viewingAnswers ? "Jouw antwoorden" : completion.registered ? "Heel erg bedankt!" : "Bedankt voor je tijd"}
            description={viewingAnswers ? completion.registered ? "Dit zijn de antwoorden die je hebt ingestuurd." : "Dit zijn de antwoorden die je hebt ingevuld. Ze zijn niet verstuurd of opgeslagen." : completion.registered ? <>Als jouw situatie aansluit op de gesprekken die ik wil voeren, mail ik je om iets af te spreken. <strong className="font-semibold">Tik of klik op het koekje</strong> om je boodschap te ontdekken.</> : <>Je bent niet aangemeld voor een interview en ontvangt geen uitnodiging. <strong className="font-semibold">Tik of klik op het koekje</strong> om je boodschap te ontdekken.</>}>
            <div hidden={viewingAnswers}>
              <FortuneCookieAnimation fortune={completion.fortune} />
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Button type="button" variant="ghost" size="lg" className="back-button -ml-4 text-muted-foreground" onClick={() => { setVisitedAnswers(true); setViewingAnswers(true); window.scrollTo({ top: 0, behavior: "instant" }); }}><ArrowLeft aria-hidden="true" className="back-arrow" /> Antwoorden bekijken</Button>
                <Button type="button" size="lg" onClick={shareResearch}>{shareStatus === "shared" || shareStatus === "copied" ? <Check aria-hidden="true" /> : <Share2 aria-hidden="true" />}{shareStatus === "shared" ? "Gedeeld" : shareStatus === "copied" ? "Link gekopieerd" : shareStatus === "error" ? "Kopiëren mislukt" : "Onderzoek delen"}</Button>
              </div>
              <span className="sr-only" role="status">{shareStatus === "copied" ? "De link is naar het klembord gekopieerd." : shareStatus === "shared" ? "Het onderzoek is gedeeld." : shareStatus === "error" ? "De link kon niet worden gekopieerd. Kopieer de link uit de adresbalk." : ""}</span>
            </div>
            <div hidden={!viewingAnswers}>
              <SubmittedAnswers review={completion.registered ? completion.submission : completion.review} contact={completion.registered ? completion.submission.contact : undefined} />
              <Button type="button" variant="ghost" size="lg" className="back-button -ml-4 mt-8 text-muted-foreground" onClick={() => { setViewingAnswers(false); window.scrollTo({ top: 0, behavior: "instant" }); }}><ArrowLeft aria-hidden="true" className="back-arrow" /> Terug naar bedankje</Button>
            </div>
          </StepFrame>
        </>}
      </main>
      <footer className="mx-auto flex w-full max-w-[34rem] justify-center py-6"><Image src="/crispy-logo.png" alt="Crispy Concepts" width={105} height={34} /></footer>
    </div>
  </div>;
}
