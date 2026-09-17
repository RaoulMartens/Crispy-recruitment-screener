"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Image from "next/image";
import welcomeCover from "../../../public/welcome-cover.webp";
import { ArrowLeft, ArrowRight, Check, Info, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { StepFrame } from "@/components/screener/step-frame";
import { CompletionConfetti } from "@/components/screener/completion-confetti";
import { FortuneCookieAnimation } from "@/components/screener/fortune-cookie-animation";
import { CommuteRoutePreview } from "@/components/screener/commute-route-preview";
import type { Fortune } from "@/lib/screener/fortunes";
import { selectFortuneForParticipant } from "@/lib/screener/select-fortune";
import {
  initialAnswers,
  questions,
  getSteps,
  getQuestionIds,
  validateStep,
  firstInvalidStep,
  createSubmission,
  type Answers,
  type StepId,
  type Question,
  type Submission,
  type WorkerDecision,
} from "@/lib/screener/steps";

export function Screener() {
  const [stepId, setStepId] = useState<StepId>("intro");
  const [answers, setAnswers] = useState<Answers>(initialAnswers);
  const [error, setError] = useState<string | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [selectedFortune, setSelectedFortune] = useState<Fortune | null>(null);
  const [submissionStatus, setSubmissionStatus] = useState<
    "idle" | "submitting" | "complete"
  >("idle");
  const [privacyTooltipOpen, setPrivacyTooltipOpen] = useState(false);
  const [shareStatus, setShareStatus] = useState<
    "idle" | "shared" | "copied" | "error"
  >("idle");
  const firstOptionRef = useRef<HTMLButtonElement>(null);
  const firstCheckboxRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const shareStatusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const steps = getSteps(answers);
  const stepIndex = steps.indexOf(stepId);
  const question: Question | null =
    stepId === "intro" || stepId === "bridge" || stepId === "complete"
      ? null
      : questions[stepId];
  const questionCount = getQuestionIds(answers).length;
  const questionIndex = question ? getQuestionIds(answers).indexOf(stepId as keyof typeof questions) + 1 : 0;
  const isLastQuestion =
    stepIndex === steps.length - 2 &&
    !(question?.kind === "choice" && !answers[question.field]);

  useEffect(() => {
    if (error) (firstOptionRef.current ?? firstCheckboxRef.current ?? inputRef.current)?.focus();
  }, [error, stepId]);

  useEffect(
    () => () => {
      if (shareStatusTimerRef.current) {
        clearTimeout(shareStatusTimerRef.current);
      }
    },
    [],
  );

  function goTo(id: StepId) {
    setError(null);
    setPrivacyTooltipOpen(false);
    if (id !== "complete") setSubmissionStatus("idle");
    setStepId(id);
  }

  function updateAnswer(field: Exclude<keyof Answers, "workerDecisions">, value: string) {
    setAnswers((current) => ({
      ...current,
      [field]: value,
      ...(["participantType", "employerHiringRole", "employerInterview", "workerInterview"].includes(field)
        ? { consent: "" }
        : {}),
    }));
    setError(null);
    setSubmission(null);
    setSelectedFortune(null);
    setSubmissionStatus("idle");
  }

  function toggleDecision(value: WorkerDecision) {
    setAnswers((current) => ({
      ...current,
      workerDecisions: current.workerDecisions.includes(value)
        ? current.workerDecisions.filter((item) => item !== value)
        : value === "none"
          ? ["none"]
          : [...current.workerDecisions.filter((item) => item !== "none"), value],
    }));
    setError(null);
    setSubmission(null);
    setSelectedFortune(null);
    setSubmissionStatus("idle");
  }

  function showTemporaryShareStatus(
    status: Exclude<typeof shareStatus, "idle">,
  ) {
    if (shareStatusTimerRef.current) {
      clearTimeout(shareStatusTimerRef.current);
    }
    setShareStatus(status);
    shareStatusTimerRef.current = setTimeout(() => {
      setShareStatus("idle");
      shareStatusTimerRef.current = null;
    }, 2500);
  }

  async function shareResearch() {
    const url = new URL("/", window.location.origin);
    url.searchParams.set("via", "share");
    const shareData = {
      text: "Ken je iemand voor wie dit relevant is? Stuur 'm door.",
      url: url.toString(),
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        showTemporaryShareStatus("shared");
        return;
      } catch (shareError) {
        if (
          shareError instanceof DOMException &&
          shareError.name === "AbortError"
        ) {
          return;
        }
      }
    }

    if (!navigator.clipboard) {
      showTemporaryShareStatus("error");
      return;
    }

    try {
      await navigator.clipboard.writeText(url.toString());
      showTemporaryShareStatus("copied");
    } catch {
      showTemporaryShareStatus("error");
    }
  }

  async function next(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submissionStatus === "submitting") return;
    const message = validateStep(stepId, answers);
    if (message) {
      setError(message);
      (firstOptionRef.current ?? firstCheckboxRef.current ?? inputRef.current)?.focus();
      return;
    }
    if (
      question?.kind === "text" &&
      question.inputType === "email" &&
      inputRef.current?.validity.typeMismatch
    ) {
      setError(
        "Vul een geldig e-mailadres in, bijvoorbeeld naam@voorbeeld.nl.",
      );
      return;
    }
    if (isLastQuestion) {
      const invalid = firstInvalidStep(answers);
      if (invalid) {
        setStepId(invalid);
        setError(validateStep(invalid, answers));
        return;
      }
      setError(null);
      setSubmissionStatus("submitting");
      try {
        const nextSubmission = createSubmission(answers);
        const response = await fetch("/api/submissions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(nextSubmission),
        });
        const result: { error?: string } = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(result.error ?? "Opslaan is niet gelukt. Probeer het opnieuw.");
        }
        const nextFortune = selectFortuneForParticipant(
          nextSubmission.participantType,
        );
        setSubmission(nextSubmission);
        setSelectedFortune(nextFortune);
        setSubmissionStatus("complete");
        goTo("complete");
      } catch (submitError) {
        setSubmissionStatus("idle");
        setError(
          submitError instanceof Error && submitError.message !== "Failed to fetch"
            ? submitError.message
            : "Opslaan is niet gelukt. Probeer het opnieuw.",
        );
      }
      return;
    }
    goTo(steps[stepIndex + 1]);
  }

  return (
    <div className="flex min-h-svh flex-col">
      {stepId === "intro" && (
        <div className="relative h-44 w-full shrink-0 sm:h-58">
          <Image
            src={welcomeCover}
            alt="Iemand werkt aan een bureau met een laptop en telefoon."
            fill
            sizes="100vw"
            preload
            placeholder="blur"
            className="object-cover object-[50%_43%]"
          />
        </div>
      )}
    <div className="screener mx-auto flex w-full max-w-4xl flex-1 flex-col px-6 sm:px-10">
      {stepId === "intro" && (
        <header className="flex flex-col gap-1.5 py-6 sm:flex-row sm:items-center sm:justify-between sm:gap-4 sm:py-8">
          <p className="text-xs text-muted-foreground">Deelnemen aan onderzoek</p>
          <span className="text-xs text-muted-foreground">Invullen duurt ongeveer <strong className="font-semibold">1–2 minuten</strong>.</span>
        </header>
      )}
      <main
        id="main-content"
        className="mx-auto w-full max-w-[34rem] flex-1 pb-16 pt-10 sm:pt-16"
      >
        {question && (
          <div className="mb-6 flex min-h-5 items-center justify-between gap-4 text-xs text-muted-foreground tabular-nums">
            <span>{question.label}</span>
            <span aria-label={`Vraag ${questionIndex} van ${questionCount}`}>
              {questionIndex} / {questionCount}
            </span>
          </div>
        )}
        {stepId === "intro" && (
          <StepFrame
            key={stepId}
            title="Hoe komen mensen en werk bij elkaar?"
            description="Voor mijn afstudeerproject bij Crispy onderzoek ik hoe kleinere werkgevers en mensen in Noord-Limburg bij elkaar komen rondom werk, en wat ervoor zorgt dat dat wel of niet goed uitpakt. Daarover ga ik graag ongeveer 30 minuten met je in gesprek."
            roomyDescription
          >
            <p className="mb-3 text-sm leading-[1.55] text-muted-foreground">
              Met dit korte formulier kijk ik of je binnen mijn onderzoek
              past en hoe ik contact met je kan opnemen.
            </p>
            <p className="mb-8 text-sm leading-[1.55] text-muted-foreground">Als kleine dank krijg je aan het einde een <span className="font-medium">persoonlijke digitale verrassing</span>.</p>
            <Button
              size="lg"
              onClick={() => goTo("participant")}
              className="next-button"
            >
              Start <ArrowRight aria-hidden="true" className="next-arrow" />
            </Button>
          </StepFrame>
        )}
        {stepId === "bridge" && (
          <StepFrame
            key={stepId}
            title="Nog een paar vragen over jouw werk"
            description="Je gaf aan dat beide situaties op jou van toepassing zijn. Ik heb nog een paar korte vragen over jouw eigen werksituatie."
          >
            <div className="flex items-center justify-between gap-4">
              <Button type="button" variant="ghost" size="lg" onClick={() => goTo(steps[stepIndex - 1])} className="back-button -ml-4 text-muted-foreground">
                <ArrowLeft aria-hidden="true" className="back-arrow" /> Terug
              </Button>
              <Button type="button" size="lg" onClick={() => goTo("workerLocations")} className="next-button">
                Volgende <ArrowRight aria-hidden="true" className="next-arrow" />
              </Button>
            </div>
          </StepFrame>
        )}
        {question && (
          <StepFrame
            key={stepId}
            title={question.title}
            description={question.description}
          >
            <form
              onSubmit={next}
              noValidate
              aria-labelledby="step-title"
              aria-describedby="step-description"
            >
              {question.kind === "locations" ? (
                <div>
                  <div className="grid gap-4">
                    <div>
                      <Label htmlFor="worker-home-location" className="mb-2 block text-sm font-medium">Waar woon je?</Label>
                      <Input
                        ref={inputRef}
                        id="worker-home-location"
                        name="workerHomeLocation"
                        value={answers.workerHomeLocation}
                        onChange={(event) => updateAnswer("workerHomeLocation", event.target.value)}
                        placeholder="Vul je plaatsnaam in"
                        maxLength={120}
                        autoComplete="off"
                        className="h-12 rounded-md px-3.5 text-base md:text-base"
                      />
                    </div>
                    <div>
                      <Label htmlFor="worker-work-location" className="mb-2 block text-sm font-medium">Waar werk je?</Label>
                      <Input
                        id="worker-work-location"
                        name="workerWorkLocation"
                        value={answers.workerWorkLocation}
                        onChange={(event) => updateAnswer("workerWorkLocation", event.target.value)}
                        placeholder="Vul de plaatsnaam van je werk in"
                        maxLength={120}
                        autoComplete="off"
                        className="h-12 rounded-md px-3.5 text-base md:text-base"
                      />
                    </div>
                  </div>
                  <CommuteRoutePreview home={answers.workerHomeLocation} work={answers.workerWorkLocation} />
                </div>
              ) : question.kind === "choice" ? (
                <div>
                <RadioGroup
                  value={answers[question.field]}
                  onValueChange={(value) => updateAnswer(question.field, value)}
                  aria-labelledby="step-title"
                  aria-required="true"
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? "step-error" : "step-description"}
                  className="gap-2"
                >
                  {question.options.map((option, index) => (
                    <Label
                      key={option.value}
                      htmlFor={`${stepId}-${option.value}`}
                      className="answer-row flex min-h-12 cursor-pointer items-center gap-3 rounded-md border border-border px-3.5 py-3 text-[0.9375rem] leading-[1.45] font-normal"
                    >
                      <RadioGroupItem
                        ref={index === 0 ? firstOptionRef : undefined}
                        id={`${stepId}-${option.value}`}
                        value={option.value}
                        className="shrink-0"
                      />
                      <span>{option.label}</span>
                    </Label>
                  ))}
                </RadioGroup>
                </div>
              ) : question.kind === "multiple" ? (
                <div role="group" aria-labelledby="step-title" aria-describedby={error ? "step-error" : "step-description"}>
                  {question.options.map((option, index) => (
                    <Label key={option.value} htmlFor={`${stepId}-${option.value}`} className="answer-row mb-2 flex min-h-12 cursor-pointer items-center gap-3 rounded-md border border-border px-3.5 py-3 text-[0.9375rem] leading-[1.45] font-normal">
                      <input
                        ref={index === 0 ? firstCheckboxRef : undefined}
                        id={`${stepId}-${option.value}`}
                        type="checkbox"
                        checked={answers.workerDecisions.includes(option.value)}
                        onChange={() => toggleDecision(option.value)}
                        className="size-4 shrink-0 cursor-pointer accent-primary"
                      />
                      <span>{option.label}</span>
                    </Label>
                  ))}
                </div>
              ) : (
                <div className="relative">
                  <Input
                    ref={inputRef}
                    id={question.field}
                    name={question.field}
                    aria-labelledby="step-title"
                    aria-describedby={error ? "step-error" : "step-description"}
                    aria-invalid={Boolean(error)}
                    required={!question.optional}
                    type={question.inputType ?? "text"}
                    inputMode={question.inputType === "email" ? "email" : question.inputType === "tel" ? "tel" : "text"}
                    value={answers[question.field]}
                    onChange={(event) =>
                      updateAnswer(question.field, event.target.value)
                    }
                    placeholder={question.placeholder}
                    autoComplete={question.autoComplete ?? "off"}
                    maxLength={question.maxLength}
                    className="h-12 rounded-md px-3.5 text-base md:text-base"
                  />
                  {(stepId === "name" || stepId === "email" || stepId === "phone") && (
                      <div className="mt-2 flex justify-end sm:absolute sm:right-0 sm:bottom-full sm:mt-0 sm:mb-2">
                        <TooltipProvider>
                          <Tooltip
                            open={privacyTooltipOpen}
                            onOpenChange={setPrivacyTooltipOpen}
                          >
                            <TooltipTrigger asChild>
                              <button
                                type="button"
                                aria-label="Privacyinformatie"
                                onClick={() =>
                                  setPrivacyTooltipOpen((open) => !open)
                                }
                                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-primary"
                              >
                                Privacyinformatie <Info aria-hidden="true" className="size-3.5" />
                              </button>
                            </TooltipTrigger>
                            <TooltipContent id="contact-privacy">
                              Ik gebruik je gegevens alleen voor dit afstudeeronderzoek.
                              Toegang: Crispy Concepts B.V. en HAN University of Applied
                              Sciences. Bewaartermijn: 6 maanden. Je kunt je gegevens
                              laten verwijderen door te mailen naar raoul@crispy.nl.
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </div>
                    )}
                </div>
              )}
              {error && (
                <p
                  id="step-error"
                  role="alert"
                  className="mt-4 text-sm text-destructive"
                >
                  {error}
                </p>
              )}
              <div className="mt-8 flex items-center justify-between gap-4">
                <Button
                  type="button"
                  variant="ghost"
                  size="lg"
                  onClick={() => goTo(steps[stepIndex - 1])}
                  className="back-button -ml-4 text-muted-foreground"
                >
                  <ArrowLeft aria-hidden="true" className="back-arrow" /> Terug
                </Button>
                <Button
                  type="submit"
                  size="lg"
                  disabled={submissionStatus === "submitting"}
                  className="next-button"
                >
                  {submissionStatus === "submitting"
                    ? "Opslaan…"
                    : isLastQuestion
                      ? "Afronden"
                      : "Volgende"}{" "}
                  <ArrowRight aria-hidden="true" className="next-arrow" />
                </Button>
              </div>
            </form>
          </StepFrame>
        )}
        {stepId === "complete" && submission && (
          <>
            {submission.interviewInterest && submission.consent && <CompletionConfetti />}
            {selectedFortune ? (
              <FortuneCookieAnimation fortune={selectedFortune} />
            ) : null}
            <StepFrame
              key={stepId}
              title={
                submission.interviewInterest && submission.consent
                  ? "Bedankt voor je hulp"
                  : "Bedankt voor het invullen"
              }
              description={
                submission.interviewInterest && submission.consent
                  ? "Je antwoorden zijn ontvangen. Als jouw situatie goed aansluit op wat ik voor het onderzoek nodig heb, neem ik contact met je op om een gesprek van ongeveer 30 minuten in te plannen."
                  : submission.participantType === "employer" && submission.employer?.hiringRole === "no"
                    ? "Op basis van je antwoorden sluit jouw situatie op dit moment minder goed aan bij de deelnemers die ik voor deze onderzoeksronde zoek. Je input helpt me alsnog verder."
                    : "Je antwoorden zijn ontvangen. Bedankt voor het invullen; er worden geen contactgegevens voor een interview gebruikt."
              }
            >
              <p className="mb-5 text-sm leading-[1.55] text-muted-foreground">
                {submission.interviewInterest && submission.consent
                  ? "Tijdens dat gesprek zijn er geen goede of foute antwoorden. Ik wil begrijpen wat er in een echte situatie gebeurde. En zoals beloofd: klik op het digitale gelukskoekje hierboven om je boodschap te ontdekken."
                  : "Ook voor jou staat het digitale gelukskoekje klaar. Klik erop om je boodschap te ontdekken."}
              </p>
              <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:gap-3">
                <Button
                  type="button"
                  variant="ghost"
                  size="lg"
                  onClick={() => goTo(steps[steps.length - 2])}
                  className="back-button w-full justify-start text-muted-foreground sm:-ml-4 sm:w-auto"
                >
                  <ArrowLeft aria-hidden="true" className="back-arrow" /> Antwoorden bekijken
                </Button>
                <Button
                  type="button"
                  size="lg"
                  onClick={shareResearch}
                  className="w-full sm:w-auto"
                >
                  {shareStatus === "shared" || shareStatus === "copied" ? (
                    <Check aria-hidden="true" />
                  ) : (
                    <Share2 aria-hidden="true" />
                  )}
                  {shareStatus === "shared"
                    ? "Gedeeld"
                    : shareStatus === "copied"
                      ? "Link gekopieerd"
                      : shareStatus === "error"
                        ? "Kopiëren mislukt"
                        : "Onderzoek delen"}
                </Button>
                <span className="sr-only" role="status" aria-live="polite">
                  {shareStatus === "shared"
                    ? "Het onderzoek is gedeeld."
                    : shareStatus === "copied"
                      ? "De link is naar het klembord gekopieerd."
                      : shareStatus === "error"
                        ? "De link kon niet worden gekopieerd. Kopieer de link uit de adresbalk."
                        : ""}
                </span>
              </div>
            </StepFrame>
          </>
        )}
      </main>
      <footer className="mx-auto flex w-full max-w-[34rem] justify-center py-6 text-xs leading-5 text-muted-foreground">
        <Image
          src="/crispy-logo.png"
          alt="Crispy Concepts"
          width={105}
          height={34}
        />
      </footer>
    </div>
    </div>
  );
}
