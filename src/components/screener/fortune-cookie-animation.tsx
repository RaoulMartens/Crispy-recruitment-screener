"use client";

import Image from "next/image";
import {
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import type { Fortune } from "@/lib/screener/fortunes";

const FRAME_PATHS = Array.from(
  { length: 8 },
  (_, index) => `/cookie-animation/frame-${index + 1}.webp`,
);
const LAST_FRAME_INDEX = FRAME_PATHS.length - 1;
const FRAME_DURATION_MS = 100;

type AnimationState = "idle" | "preparing" | "playing" | "opened" | "error";

type FortuneCookieAnimationProps = {
  fortune: Fortune;
};

type FortuneWordStyle = CSSProperties & {
  "--fortune-word-y": string;
  "--fortune-word-rotation": string;
};

function balanceFortuneLines(fortune: string) {
  const words = fortune.trim().split(/\s+/);
  const lineCount = fortune.length > 56 ? 3 : fortune.length > 24 ? 2 : 1;
  const targetLength = fortune.length / lineCount;
  const lines: string[][] = [];
  let currentLine: string[] = [];
  let currentLength = 0;

  words.forEach((word, index) => {
    const nextLength = currentLength + (currentLine.length ? 1 : 0) + word.length;
    const remainingWords = words.length - index;
    const remainingLines = lineCount - lines.length - 1;

    if (
      currentLine.length > 0 &&
      lines.length < lineCount - 1 &&
      nextLength > targetLength &&
      remainingWords >= remainingLines
    ) {
      lines.push(currentLine);
      currentLine = [word];
      currentLength = word.length;
      return;
    }

    currentLine.push(word);
    currentLength = nextLength;
  });

  if (currentLine.length) lines.push(currentLine);
  return lines;
}

function getFortuneWordStyle(index: number, wordCount: number): FortuneWordStyle {
  const position = wordCount > 1 ? (index / (wordCount - 1)) * 2 - 1 : 0;
  const curve = -(1 - position ** 2) * 1.6;

  return {
    "--fortune-word-y": `${curve.toFixed(2)}px`,
    "--fortune-word-rotation": `${(position * 0.7).toFixed(2)}deg`,
  };
}

function preloadFrames() {
  return Promise.all(
    FRAME_PATHS.map(
      (src) =>
        new Promise<void>((resolve, reject) => {
          const image = new window.Image();
          image.onload = () => {
            image.decode().then(resolve).catch(reject);
          };
          image.onerror = () =>
            reject(new Error(`Fortune-cookieframe kon niet laden: ${src}`));
          image.src = src;
        }),
    ),
  )
    .then(() => true)
    .catch((error: unknown) => {
      console.error(error);
      return false;
    });
}

export function FortuneCookieAnimation({
  fortune,
}: FortuneCookieAnimationProps) {
  const [activeFrame, setActiveFrame] = useState(0);
  const [animationState, setAnimationState] =
    useState<AnimationState>("idle");
  const preloadPromiseRef = useRef<Promise<boolean> | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    preloadPromiseRef.current = preloadFrames();
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (animationState !== "playing") return;

    const timers = FRAME_PATHS.slice(1).map((_, index) =>
      window.setTimeout(() => {
        const nextFrame = index + 1;
        setActiveFrame(nextFrame);
        if (nextFrame === LAST_FRAME_INDEX) {
          setAnimationState("opened");
        }
      }, (index + 1) * FRAME_DURATION_MS),
    );

    return () => timers.forEach(window.clearTimeout);
  }, [animationState]);

  async function openCookie() {
    if (animationState !== "idle") return;

    setAnimationState("preparing");
    const framesReady = await (preloadPromiseRef.current ?? preloadFrames());
    if (!mountedRef.current) return;

    if (!framesReady) {
      setAnimationState("error");
      return;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setActiveFrame(LAST_FRAME_INDEX);
      setAnimationState("opened");
      return;
    }

    setAnimationState("playing");
  }

  const isInteractive = animationState === "idle";
  const fortuneLines = balanceFortuneLines(fortune.text);

  return (
    <div className="fortune-cookie-stage" data-state={animationState}>
      <button
        type="button"
        className="fortune-cookie"
        onClick={openCookie}
        aria-label={
          animationState === "error"
            ? "Gelukskoekje kon niet worden geladen"
            : isInteractive
              ? "Gelukskoekje openbreken"
              : "Gelukskoekje geopend"
        }
        disabled={!isInteractive}
      >
        <span className="fortune-cookie-motion" aria-hidden="true">
          {FRAME_PATHS.map((src, index) => (
            <Image
              key={src}
              src={src}
              alt=""
              fill
              sizes="(max-width: 640px) calc(100vw - 3rem), 544px"
              preload={index === 0}
              loading={index === 0 ? undefined : "eager"}
              decoding="sync"
              unoptimized
              hidden={activeFrame !== index}
              className="fortune-cookie-frame"
            />
          ))}
        </span>
      </button>
      {animationState === "opened" ? (
        <p
          className="fortune-cookie-message"
          role="status"
          aria-live="polite"
          aria-label={fortune.text}
        >
          <span className="fortune-cookie-copy" aria-hidden="true">
            {fortuneLines.map((line, lineIndex) => (
              <span
                className="fortune-cookie-line"
                key={`${lineIndex}-${line.join("-")}`}
              >
                {line.map((word, wordIndex) => (
                  <span
                    className="fortune-cookie-word"
                    style={getFortuneWordStyle(wordIndex, line.length)}
                    key={`${wordIndex}-${word}`}
                  >
                    {word}
                  </span>
                ))}
              </span>
            ))}
          </span>
        </p>
      ) : null}
      <span className="sr-only" role="status" aria-live="polite">
        {animationState === "error"
          ? "De animatie kon niet worden geladen."
          : ""}
      </span>
    </div>
  );
}
