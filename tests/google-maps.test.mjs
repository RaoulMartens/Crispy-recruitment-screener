import test from "node:test";
import assert from "node:assert/strict";
import { googleMapsDirectionsUrl, googleMapsEmbedUrl } from "../src/lib/screener/google-maps.ts";

test("Google Maps URLs keep both entered towns separate and encoded", () => {
  const link = new URL(googleMapsDirectionsUrl(" Venray ", "'s-Hertogenbosch "));
  assert.equal(link.origin, "https://www.google.com");
  assert.equal(link.pathname, "/maps/dir/");
  assert.equal(link.searchParams.get("api"), "1");
  assert.equal(link.searchParams.get("origin"), "Venray");
  assert.equal(link.searchParams.get("destination"), "'s-Hertogenbosch");

  const embed = new URL(googleMapsEmbedUrl(" Venray ", " Venlo ", "test-key"));
  assert.equal(embed.pathname, "/maps/embed/v1/directions");
  assert.equal(embed.searchParams.get("origin"), "Venray");
  assert.equal(embed.searchParams.get("destination"), "Venlo");
  assert.equal(embed.searchParams.get("key"), "test-key");
  assert.equal(embed.searchParams.get("language"), "nl");
});
