"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight } from "lucide-react";
import { googleMapsDirectionsUrl, googleMapsEmbedUrl } from "@/lib/screener/google-maps";

type CommuteRoutePreviewProps = {
  home: string;
  work: string;
};

export function CommuteRoutePreview({ home, work }: CommuteRoutePreviewProps) {
  const [settledPlaces, setSettledPlaces] = useState<{ home: string; work: string } | null>(null);
  const homePlace = home.trim();
  const workPlace = work.trim();
  const ready = homePlace.length >= 2 && workPlace.length >= 2;
  const mapsEmbedKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_EMBED_API_KEY;

  useEffect(() => {
    if (!ready) return;
    const timer = window.setTimeout(() => {
      setSettledPlaces({ home: homePlace, work: workPlace });
    }, 700);
    return () => window.clearTimeout(timer);
  }, [homePlace, workPlace, ready]);

  if (!ready) return null;

  const showMap = Boolean(
    mapsEmbedKey &&
      settledPlaces?.home === homePlace &&
      settledPlaces.work === workPlace,
  );

  return (
    <div className="mt-6">
      {showMap && mapsEmbedKey && (
        <iframe
          title={`Route van ${homePlace} naar ${workPlace}`}
          src={googleMapsEmbedUrl(homePlace, workPlace, mapsEmbedKey)}
          loading="eager"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
          className="h-64 w-full rounded-md border border-border sm:h-72"
        />
      )}
      {mapsEmbedKey && (
        <p className="mt-2 text-xs text-muted-foreground">
          Als je beide plaatsen invult, worden ze met Google gedeeld om de route te tonen.
        </p>
      )}
      <a
        href={googleMapsDirectionsUrl(homePlace, workPlace)}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-foreground underline underline-offset-4 hover:text-muted-foreground"
      >
        Bekijk route in Google Maps <ArrowUpRight aria-hidden="true" className="size-4" />
      </a>
    </div>
  );
}
