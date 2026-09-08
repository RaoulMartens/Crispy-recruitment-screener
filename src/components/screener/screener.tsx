"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Image from "next/image";
import welcomeCover from "../../../public/welcome-cover.webp";
import { ArrowLeft, ArrowRight, Info } from "lucide-react";
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
} from "@/lib/screener/steps";

export function Screener() {
  const [stepId, setStepId] = useState<StepId>("intro");
  const [answers, setAnswers] = useState<Answers>(initialAnswers);
  const [error, setError] = useState<string | null>(null);
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [submissionStatus, setSubmissionStatus] = useState<
    "idle" | "submitting" | "complete"
  >("idle");
  const [contactConsent, setContactConsent] = useState(false);
  const [consentError, setConsentError] = useState<string | null>(null);
  const [privacyTooltipOpen, setPrivacyTooltipOpen] = useState(false);
  const firstOptionRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const consentRef = useRef<HTMLInputElement>(null);
  const steps = getSteps(answers);
  const stepIndex = steps.indexOf(stepId);
  const question: Question | null =
    stepId === "intro" || stepId === "complete" ? null : questions[stepId];
  const questionCount = getQuestionIds(answers).length;
  const isLastQuestion = stepIndex === steps.length - 2;

  useEffect(() => {
    if (error) (firstOptionRef.current ?? inputRef.current)?.focus();
  }, [error, stepId]);

  useEffect(() => {
    if (consentError) consentRef.current?.focus();
  }, [consentError]);

  function goTo(id: StepId) {
    setError(null);
    setConsentError(null);
    setPrivacyTooltipOpen(false);
    if (id !== "complete") setSubmissionStatus("idle");
    setStepId(id);
  }

  function updateAnswer(field: keyof Answers, value: string) {
    setAnswers((current) => ({ ...current, [field]: value }));
    setError(null);
    setSubmission(null);
    setSubmissionStatus("idle");
    if (field === "interview" && value === "no") {
      setContactConsent(false);
      setConsentError(null);
    }
  }

  async function next(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submissionStatus === "submitting") return;
    const message = validateStep(stepId, answers);
    if (message) {
      setError(message);
      (firstOptionRef.current ?? inputRef.current)?.focus();
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
      if (answers.interview === "yes" && !contactConsent) {
        setConsentError("Geef toestemming om je contactgegevens te gebruiken, of kies bij de interviewvraag voor Nee.");
        consentRef.current?.focus();
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
        setSubmission(nextSubmission);
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
          <p className="text-xs font-medium text-muted-foreground">Deelnemen aan onderzoek</p>
          <span className="text-xs text-muted-foreground">Invullen duurt ongeveer 1–2 minuten.</span>
        </header>
      )}
      <main
        id="main-content"
        className="mx-auto w-full max-w-[34rem] flex-1 pb-16 pt-10 sm:pt-16"
      >
        {question && (
          <div className="mb-6 flex min-h-5 items-center justify-between gap-4 text-xs text-muted-foreground tabular-nums">
            <span>{question.label}</span>
            <span aria-label={`Vraag ${stepIndex} van ${questionCount}`}>
              {stepIndex} / {questionCount}
            </span>
          </div>
        )}
        {stepId === "intro" && (
          <StepFrame
            key={stepId}
            title="Denk mee over werk vinden en medewerkers werven"
            description="Voor mijn afstudeerproject bij Crispy onderzoek ik hoe werkgevers en werkzoekenden elkaar vinden en beoordelen. Hiervoor zoek ik mensen die later ongeveer 30 minuten met mij in gesprek willen."
          >
            <p className="mb-8 text-sm leading-6 text-muted-foreground">
              Met dit korte formulier kijk ik alleen of je binnen de doelgroep
              past en hoe ik contact met je kan opnemen.
            </p>
            <Button size="lg" onClick={() => goTo("participant")}>
              Start <ArrowRight aria-hidden="true" />
            </Button>
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
              {question.kind === "choice" ? (
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
              ) : (
                <div className="relative">
                  {answers.interview === "yes" &&
                    (stepId === "name" || stepId === "email") && (
                      <div className="absolute right-0 bottom-full mb-2">
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
                  <Input
                    ref={inputRef}
                    id={question.field}
                    name={question.field}
                    aria-labelledby="step-title"
                    aria-describedby={error ? "step-error" : "step-description"}
                    aria-invalid={Boolean(error)}
                    required
                    type={question.inputType ?? "text"}
                    inputMode={question.inputType === "email" ? "email" : "text"}
                    value={answers[question.field]}
                    onChange={(event) =>
                      updateAnswer(question.field, event.target.value)
                    }
                    placeholder={question.placeholder}
                    autoComplete={question.autoComplete ?? "off"}
                    maxLength={question.maxLength}
                    className="h-12 rounded-md px-3.5 text-base md:text-base"
                  />
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
              {answers.interview === "yes" && stepId === "email" && (
                <div className="mt-4">
                  <label htmlFor="contact-consent" className="flex min-h-11 cursor-pointer items-start gap-3 py-2 text-sm leading-6">
                    <input
                      ref={consentRef}
                      id="contact-consent"
                      type="checkbox"
                      required
                      checked={contactConsent}
                      onChange={(event) => {
                        setContactConsent(event.target.checked);
                        setConsentError(null);
                        setSubmission(null);
                      }}
                      aria-invalid={Boolean(consentError)}
                      aria-describedby={consentError ? "contact-privacy consent-error" : "contact-privacy"}
                      className="mt-1 size-4 shrink-0 cursor-pointer accent-primary focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-primary"
                    />
                    <span>Ik geef toestemming om mijn gegevens te gebruiken om contact met mij op te nemen voor dit afstudeeronderzoek.</span>
                  </label>
                  {consentError && (
                    <p id="consent-error" role="alert" className="mt-2 text-sm text-destructive">
                      {consentError}
                    </p>
                  )}
                </div>
              )}
              <div className="mt-8 flex items-center justify-between gap-4">
                <Button
                  type="button"
                  variant="ghost"
                  size="lg"
                  onClick={() => goTo(steps[stepIndex - 1])}
                  className="-ml-4 text-muted-foreground"
                >
                  <ArrowLeft aria-hidden="true" /> Terug
                </Button>
                <Button type="submit" size="lg" disabled={submissionStatus === "submitting"}>
                  {submissionStatus === "submitting"
                    ? "Opslaan…"
                    : isLastQuestion
                      ? "Afronden"
                      : "Volgende"}{" "}
                  <ArrowRight aria-hidden="true" />
                </Button>
              </div>
            </form>
          </StepFrame>
        )}
        {stepId === "complete" && submission && (
          <>
            {submission.openToInterview && (
              <>
                <CompletionConfetti />
                <Image
                  src="/thank-you.webp"
                  alt="Een man kijkt verbaasd in een kantoor."
                  width={341}
                  height={192}
                  unoptimized
                  loading="lazy"
                  className="mb-7 h-auto w-full rounded-md"
                />
              </>
            )}
            <StepFrame
              key={stepId}
              title={
                submission.openToInterview
                  ? "Yesss! gelukt"
                  : "Bedankt voor je reactie"
              }
              description={
                submission.openToInterview
                  ? "Bedankt voor het invullen. Als je binnen de doelgroep past, neem ik mogelijk contact met je op voor een kort interview."
                  : "Bedankt voor het invullen. Je reactie helpt bij mijn afstudeeronderzoek. Zoals aangegeven neem ik geen contact met je op voor een interview."
              }
            >
              <div className="flex flex-wrap items-center gap-3">
                <Button size="lg" onClick={() => goTo(steps[steps.length - 2])}>
                  <ArrowLeft aria-hidden="true" /> Antwoorden bekijken
                </Button>
                <Button
                  variant="ghost"
                  size="lg"
                  onClick={() => {
                    setAnswers(initialAnswers);
                    setSubmission(null);
                    setSubmissionStatus("idle");
                    setContactConsent(false);
                    goTo("intro");
                  }}
                >
                  Opnieuw beginnen
                </Button>
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
