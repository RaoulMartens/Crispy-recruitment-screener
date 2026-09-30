"use client";
import { versionQuestions } from "@/lib/screener/research";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Image from "next/image";
import { ArrowLeft, ArrowRight, Check, ChevronDown, LoaderCircle, Share2 } from "lucide-react";
import welcomeCover from "../../../public/welcome-cover.webp";
import { Button } from "@/components/ui/button";
import { StepFrame } from "@/components/screener/step-frame";
import { TextField, ChoiceField, SelectField, MultiChoiceField, TextAreaField } from "@/components/screener/form-fields";
import { CompletionConfetti } from "@/components/screener/completion-confetti";
import { FortuneCookieAnimation } from "@/components/screener/fortune-cookie-animation";
import type { Fortune } from "@/lib/screener/fortunes";
import { selectFortuneForParticipant } from "@/lib/screener/select-fortune";
import { topicOptions, updateTopic, intakeQuestion, intakeRoleQuestion, intakeValues, updateIntake, validateIntakeStep, intakeSteps, intakeQuestions } from "@/lib/screener/intake";
import {
  initialResearch, getResearchSteps, isContentStep, stepTitles,
  updateResearchAnswer, createResearchSubmission,
  stateFromResearchSubmission, answerLabel,
  type ResearchState, type ResearchErrors, type ResearchStep, type ResearchSubmission,
} from "@/lib/screener/research";
import { textAnswer, multiAnswer, hasOther, yesNo, type AnswerId, type Question } from "@/lib/screener/research-questions";

type Completion = { fortune: Fortune; screenCount: number; submission: ResearchSubmission };
type ShareStatus = "idle" | "shared" | "copied" | "error";

function ShareResearchButton({ status, onShare, variant = "default", className }: {
  status: ShareStatus; onShare: () => void; variant?: "default" | "ghost"; className?: string;
}) {
  return <>
    <Button type="button" size="lg" variant={variant} className={className} onClick={onShare}>
      {status === "shared" || status === "copied" ? <Check aria-hidden="true" /> : <Share2 aria-hidden="true" />}
      {status === "shared" ? "Gedeeld" : status === "copied" ? "Link gekopieerd" : status === "error" ? "Kopiëren mislukt" : "Onderzoek delen"}
    </Button>
    <span className="sr-only" role="status">
      {status === "copied" ? "De link is naar het klembord gekopieerd." : status === "shared" ? "Het onderzoek is gedeeld." : status === "error" ? "De link kon niet worden gekopieerd. Kopieer de link uit de adresbalk." : ""}
    </span>
  </>;
}

function ReviewSection({ title, rows }: { title: string; rows: { label: string; value: string }[] }) {
  return <section className="space-y-4">
    <h2 className="text-xl font-semibold sm:text-2xl">{title}</h2>
    <dl className="space-y-4">{rows.map(({ label, value }) => <div key={label}>
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="mt-1 whitespace-pre-wrap break-words text-sm">{value}</dd>
    </div>)}</dl>
  </section>;
}

function SubmittedAnswers({ submission }: { submission: ResearchSubmission }) {
  const state = stateFromResearchSubmission(submission);
  return <div className="space-y-9">
    <ReviewSection title="Ingevulde onderdelen" rows={[{ label: "Waarover heb je verteld?", value: submission.completedRoutes.map((route) => route === "employer" ? "De organisatie" : "Eigen werk of studie").join(" en ") }]} />
    {getResearchSteps(state).filter(isContentStep).map((step) => <ReviewSection key={step} title={stepTitles[step]} rows={
      versionQuestions(step, submission.answers, submission.formVersion).map((q) => ({ label: q.label, value: answerLabel(q, submission.answers) }))
    } />)}
    <ReviewSection title="Tot slot" rows={[
      ...(submission.comment ? [{ label: "Aanvulling", value: submission.comment }] : []),
      { label: "Mag Raoul contact met je opnemen voor een gesprek over je antwoorden?", value: submission.interviewConsent ? "Ja" : "Nee" },
      ...(submission.contact ? [{ label: "Naam", value: submission.contact.name }, { label: "E-mailadres", value: submission.contact.email },
        ...(submission.contact.phone ? [{ label: "Telefoonnummer", value: submission.contact.phone }] : [])] : []),
    ]} />
  </div>;
}

function ResearchQuestion({ question, state, errors, onChange }: {
  question: Question; state: ResearchState; errors: ResearchErrors; onChange: (id: AnswerId, value: string | string[]) => void;
}) {
  const { id, label, hint, options = [] } = question;
  const props = { id, label, hint, value: textAnswer(state.answers, id), onChange: (value: string) => onChange(id, value), error: errors[id] };
  const otherId: AnswerId = `${id}Other`;
  const otherField = hasOther(question, state.answers) ? <TextField id={otherId} label={`Eigen antwoord bij: ${label}`} hideLabel value={textAnswer(state.answers, otherId)}
    onChange={(value) => onChange(otherId, value)} error={errors[otherId]} maxLength={200} placeholder="Vul je eigen antwoord in" /> : null;
  return <div className="space-y-3">
    {question.kind === "text" ? <TextField {...props} optional={question.optional} placeholder="Plaatsnaam" />
      : question.kind === "select" ? <SelectField {...props} options={options} />
      : question.kind === "multi" ? <MultiChoiceField question={question} values={multiAnswer(state.answers, id)} onChange={(values) => onChange(id, values)} error={errors[id]} otherField={otherField} />
      : <ChoiceField {...props} options={options} />}
    {question.kind !== "multi" && otherField}
  </div>;
}

export function Screener() {
  const [stepId, setStepId] = useState<ResearchStep>("intro");
  const [state, setState] = useState<ResearchState>({ ...initialResearch, answers: {} });
  const [errors, setErrors] = useState<ResearchErrors>({});
  const [sendError, setSendError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [completion, setCompletion] = useState<Completion | null>(null);
  const [viewingAnswers, setViewingAnswers] = useState(false);
  const [visitedAnswers, setVisitedAnswers] = useState(false);
  const [shareStatus, setShareStatus] = useState<ShareStatus>("idle");
  const sendingRef = useRef(false);
  const submissionIdRef = useRef<string | null>(null);
  const focusFieldRef = useRef<string | null>(null);
  const shareTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const steps = intakeSteps(state);
  const stepIndex = steps.indexOf(stepId);
  const screenCount = completion?.screenCount ?? steps.length;
  const screenNumber = completion ? screenCount : stepIndex + 1;

  useEffect(() => {
    if (!focusFieldRef.current) return;
    const id = focusFieldRef.current;
    focusFieldRef.current = null;
    const frame = requestAnimationFrame(() => {
      const field = document.getElementById(id);
      const control = field?.querySelector<HTMLElement>("button:not(:disabled), input:not(:disabled), select, textarea") ?? field;
      control?.focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [errors, stepId]);
  useEffect(() => () => { if (shareTimerRef.current) clearTimeout(shareTimerRef.current); }, []);

  function goTo(id: ResearchStep) {
    setErrors({}); setSendError(null); setStepId(id);
    window.scrollTo({ top: 0, behavior: "instant" });
  }
  function updateAnswer(id: AnswerId, value: string | string[]) {
    setState((current) => updateResearchAnswer(current, id, value));
    setErrors({}); setSendError(null);
  }
  function updateState(changes: Partial<ResearchState>) {
    setState((current) => ({ ...current, ...changes })); setErrors({}); setSendError(null);
  }
  function showErrors(id: ResearchStep, nextErrors: ResearchErrors) {
    focusFieldRef.current = Object.keys(nextErrors)[0] ?? null;
    setStepId(id); setErrors(nextErrors);
  }
  async function next(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (sendingRef.current) return;
    const nextErrors = validateIntakeStep(stepId, state);
    if (Object.keys(nextErrors).length) { showErrors(stepId, nextErrors); return; }
    if (stepId !== "closing") { goTo(steps[stepIndex + 1]); return; }
    const invalid = steps.find((step) => Object.keys(validateIntakeStep(step, state)).length > 0);
    if (invalid) { showErrors(invalid, validateIntakeStep(invalid, state)); return; }
    submissionIdRef.current ??= crypto.randomUUID();
    const submission = createResearchSubmission(state, submissionIdRef.current);
    sendingRef.current = true; setBusy(true); setSendError(null);
    try {
      const response = await fetch("/api/submissions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(submission) });
      const result: unknown = await response.json();
      if (response.ok && typeof result === "object" && result !== null && "ok" in result && result.ok === true) {
        setCompletion({ fortune: selectFortuneForParticipant(submission.participantType, { submissionId: submission.submissionId }), screenCount: steps.length, submission });
        setViewingAnswers(false); setVisitedAnswers(false); setState({ ...initialResearch, answers: {} }); goTo("complete");
      } else {
        setSendError(response.status === 409
          ? "Een eerdere versie van je antwoorden is al ontvangen. Deze aangepaste versie is niet opgeslagen. Neem bij twijfel contact op via raoul@crispy.nl."
          : "Je antwoorden zijn nog niet bevestigd als opgeslagen. Probeer het opnieuw. Je invoer blijft op deze pagina staan.");
      }
    } catch {
      setSendError("Er ging iets mis met de verbinding. Probeer opnieuw te versturen; je antwoorden blijven op deze pagina staan.");
    } finally { sendingRef.current = false; setBusy(false); }
  }
  function showShareStatus(status: Exclude<ShareStatus, "idle">) {
    if (shareTimerRef.current) clearTimeout(shareTimerRef.current);
    setShareStatus(status);
    shareTimerRef.current = setTimeout(() => setShareStatus("idle"), 2500);
  }
  async function shareResearch() {
    const url = new URL("/", window.location.origin); url.searchParams.set("via", "share");
    if (navigator.share) {
      try {
        await navigator.share({ title: stepTitles.intro, text: "Deel wat jij belangrijk vindt en waar je tegenaan loopt. Invullen duurt ongeveer 5 minuten, met een digitaal gelukskoekje als bedankje.", url: url.toString() });
        showShareStatus("shared"); return;
      } catch (error) { if (error instanceof DOMException && error.name === "AbortError") return; }
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
          <span>{stepId === "intro" ? "Invullen duurt ongeveer 5 minuten" : stepId === "complete" ? "Afgerond" : isContentStep(stepId) ? stepId.startsWith("employer") ? "Over de organisatie" : "Over jouw werk of studie" : "Jouw bijdrage"}</span>
          {stepId !== "intro" && (state.participantType || completion) && <span aria-label={`Scherm ${screenNumber} van ${screenCount}`}>{screenNumber} / {screenCount}</span>}
        </div>
        {stepId !== "complete" && <StepFrame key={stepId} title={stepTitles[stepId]}>
          <form onSubmit={next} noValidate aria-labelledby="step-title" aria-busy={busy}>
            <fieldset disabled={busy} className="min-w-0">
              {stepId === "intro" && <div className="space-y-5">
                <p className="text-[0.9375rem] leading-[1.55] text-muted-foreground">Wat vind je belangrijk in een baan of een nieuwe medewerker? Hoe zoek je en wat maak je daarbij mee? Met je antwoorden help je mijn afstudeeronderzoek.</p>
                <p className="text-[0.9375rem] leading-[1.55] text-muted-foreground">Ook als je nu geen werk zoekt of zelden personeel aanneemt, zijn je ervaringen welkom.</p>
                <p className="text-[0.9375rem] leading-[1.55] text-muted-foreground">Na het invullen krijg je een digitaal gelukskoekje als bedankje.</p>
                <ChoiceField id="participantType" label="Over welk onderwerp wil je vragen beantwoorden?"
                  options={topicOptions} value={state.participantType} error={errors.participantType}
                  onChange={(value) => { if (value === "personal" || value === "employer") { setState((current) => updateTopic(current, value)); setErrors({}); setSendError(null); } }} />
                {state.participantType === "personal" && <MultiChoiceField question={intakeQuestion} values={intakeValues(state)} error={errors.personalSituation}
                  onChange={(values) => { setState((current) => updateIntake(current, values)); setErrors({}); setSendError(null); }}
                  otherField={<TextField id="personalSituationOther" label="Eigen antwoord bij: Wat is je huidige situatie?" hideLabel
                    value={textAnswer(state.answers, "personalSituationOther")} error={errors.personalSituationOther}
                    onChange={(value) => updateAnswer("personalSituationOther", value)} maxLength={200} placeholder="Vul je eigen antwoord in" />} />}
                {state.participantType === "employer" && <ResearchQuestion question={intakeRoleQuestion} state={state} errors={errors} onChange={updateAnswer} />}
              </div>}
              {isContentStep(stepId) && <div className="space-y-8">
                {intakeQuestions(stepId, state).map((question) => <ResearchQuestion key={question.id} question={question} state={state} errors={errors} onChange={updateAnswer} />)}
              </div>}
              {stepId === "closing" && <div className="space-y-6">
                <TextAreaField id="comment" label="Wil je nog iets meegeven?" value={state.comment} error={errors.comment} onChange={(value) => updateState({ comment: value })} />
                <ChoiceField id="interviewConsent" label="Mag Raoul contact met je opnemen voor een gesprek over je antwoorden?"
                  value={state.interviewConsent} error={errors.interviewConsent} options={yesNo} onChange={(value) => {
                    if (value === "yes" || value === "no") updateState({ interviewConsent: value, ...(value === "no" ? { name: "", email: "", phone: "" } : {}) });
                  }} />
                {state.interviewConsent === "yes" && <div className="space-y-5">
                  <TextField id="name" label="Naam" value={state.name} error={errors.name} onChange={(value) => updateState({ name: value })} autoComplete="given-name" />
                  <TextField id="email" label="E-mailadres" type="email" value={state.email} error={errors.email} onChange={(value) => updateState({ email: value })} autoComplete="email" maxLength={254} placeholder="naam@voorbeeld.nl" />
                  <TextField id="phone" label="Telefoonnummer" type="tel" value={state.phone} error={errors.phone} onChange={(value) => updateState({ phone: value })} autoComplete="tel" maxLength={40} optional placeholder="06 1234 5678" />
                </div>}
                <p className="text-xs leading-[1.6] text-muted-foreground">Met versturen deel je jouw antwoorden voor dit afstudeeronderzoek. Contactgegevens worden alleen meegestuurd als je hierboven Ja kiest.</p>
              </div>}
              {Object.values(errors).some(Boolean) && <p role="alert" className="sr-only">Controleer de gemarkeerde velden.</p>}
              {sendError && <p role="alert" className="mt-5 text-sm text-destructive">{sendError}</p>}
              <div className={stepId === "intro" ? "mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between" : "mt-8 flex items-center justify-between gap-4"}>
                {stepId !== "intro" ? <Button type="button" variant="ghost" size="lg" onClick={() => goTo(steps[stepIndex - 1])} className="back-button -ml-4 text-muted-foreground"><ArrowLeft aria-hidden="true" className="back-arrow" /> Terug</Button> : <ShareResearchButton status={shareStatus} onShare={shareResearch} variant="ghost" className="-ml-4 self-start text-muted-foreground" />}
                <Button type="submit" size="lg" className={stepId === "intro" ? "next-button w-full sm:w-auto" : "next-button min-w-32"} disabled={busy} data-sending={busy}>
                  {busy ? <LoaderCircle aria-hidden="true" className="motion-safe:animate-spin" /> : null}
                  {busy ? "Versturen…" : stepId === "closing" ? "Versturen" : "Verder"}
                  {!busy && <ArrowRight aria-hidden="true" className="next-arrow" />}
                </Button>
              </div>
            </fieldset>
          </form>
          {stepId === "intro" && <details className="group mt-8 border-t border-border pt-3 text-sm text-muted-foreground">
            <summary className="flex min-h-11 w-fit cursor-pointer list-none items-center gap-2 rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary [&::-webkit-details-marker]:hidden">
              Privacy &amp; deelname
              <ChevronDown aria-hidden="true" className="size-4 group-open:rotate-180" />
            </summary>
            <div className="mt-2 space-y-3 leading-relaxed">
              <p>Je antwoorden gebruik ik alleen voor mijn afstudeeronderzoek en worden anoniem verwerkt in de resultaten. Deelname is vrijwillig en je kunt op ieder moment stoppen.</p>
              <p>Aan het einde kun je optioneel je naam en e-mailadres achterlaten als je openstaat voor een kort vervolggesprek. Deze gegevens worden alleen gebruikt om hiervoor contact met je op te nemen en niet voor commerciële doeleinden.</p>
            </div>
          </details>}
          <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
            {busy ? "Je antwoorden worden verstuurd." : ""}
          </div>
        </StepFrame>}
        {stepId === "complete" && completion && <>
          {!visitedAnswers && <CompletionConfetti />}
          <StepFrame key="complete" title={viewingAnswers ? "Jouw antwoorden" : "Heel erg bedankt!"}
            description={viewingAnswers ? undefined : <>Je antwoorden zijn ontvangen en helpen bij het onderzoek. <strong className="font-semibold">Tik of klik op het koekje</strong> om je boodschap te ontdekken.</>}>
            <div hidden={viewingAnswers}>
              <FortuneCookieAnimation fortune={completion.fortune} />
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Button type="button" variant="ghost" size="lg" className="back-button -ml-4 text-muted-foreground" onClick={() => { setVisitedAnswers(true); setViewingAnswers(true); window.scrollTo({ top: 0, behavior: "instant" }); }}><ArrowLeft aria-hidden="true" className="back-arrow" /> Antwoorden bekijken</Button>
                <ShareResearchButton status={shareStatus} onShare={shareResearch} />
              </div>
            </div>
            <div hidden={!viewingAnswers}>
              <SubmittedAnswers submission={completion.submission} />
              <Button type="button" variant="ghost" size="lg" className="back-button -ml-4 mt-8 text-muted-foreground" onClick={() => { setViewingAnswers(false); window.scrollTo({ top: 0, behavior: "instant" }); }}><ArrowLeft aria-hidden="true" className="back-arrow" /> Terug naar bedankje</Button>
            </div>
          </StepFrame>
        </>}
      </main>
      <footer className="mx-auto flex w-full max-w-[34rem] justify-center py-6"><Image src="/crispy-logo.png" alt="Crispy Concepts" width={105} height={34} /></footer>
    </div>
  </div>;
}
