"use client";

import { useEffect, useRef, type ReactNode } from "react";

type StepFrameProps = {
  title: string;
  description: string;
  children: ReactNode;
};

export function StepFrame({ title, description, children }: StepFrameProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, []);

  return (
    <section aria-labelledby="step-title" className="step-enter">
      <h1
        id="step-title"
        ref={headingRef}
        tabIndex={-1}
        className="text-[1.75rem] leading-[1.1] font-semibold tracking-[-0.035em] text-balance outline-none sm:text-[2.25rem]"
      >
        {title}
      </h1>
      <p
        id="step-description"
        className="mt-2 text-[0.9375rem] leading-[1.7] text-muted-foreground"
      >
        {description}
      </p>
      <div className="mt-7">{children}</div>
    </section>
  );
}
