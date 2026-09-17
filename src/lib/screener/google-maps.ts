export function googleMapsDirectionsUrl(home: string, work: string): string {
  const url = new URL("https://www.google.com/maps/dir/");
  url.searchParams.set("api", "1");
  url.searchParams.set("origin", home.trim());
  url.searchParams.set("destination", work.trim());
  return url.toString();
}

export function googleMapsEmbedUrl(home: string, work: string, apiKey: string): string {
  const url = new URL("https://www.google.com/maps/embed/v1/directions");
  url.searchParams.set("key", apiKey);
  url.searchParams.set("origin", home.trim());
  url.searchParams.set("destination", work.trim());
  url.searchParams.set("language", "nl");
  url.searchParams.set("region", "nl");
  return url.toString();
}
