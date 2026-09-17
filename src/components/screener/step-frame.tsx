"use client";

import { useEffect, useRef, type ReactNode } from "react";

type StepFrameProps = {
  title: string;
  description: string;
  children: ReactNode;
  roomyDescription?: boolean;
};

export function StepFrame({ title, description, children, roomyDescription = false }: StepFrameProps) {
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
        className={`${roomyDescription ? "mt-4" : "mt-2"} text-[0.9375rem] leading-[1.55] text-muted-foreground`}
      >
        {description}
      </p>
      <div className="mt-7">{children}</div>
    </section>
  );
}
