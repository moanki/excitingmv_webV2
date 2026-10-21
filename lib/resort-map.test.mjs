import assert from "node:assert/strict";
import test from "node:test";

import { normalizeGoogleMapsEmbedUrl, parseOptionalCoordinates } from "./resort-map.ts";

test("accepts only a Google Maps embed URL from a copied iframe", () => {
  const html = '<iframe src="https://www.google.com/maps/embed?pb=%211m18&amp;foo=bar" width="600"></iframe>';
  assert.equal(normalizeGoogleMapsEmbedUrl(html), "https://www.google.com/maps/embed?pb=%211m18&foo=bar");
  assert.throws(() => normalizeGoogleMapsEmbedUrl("https://evil.example/maps/embed?pb=x"));
  assert.throws(() => normalizeGoogleMapsEmbedUrl("https://www.google.com/maps/search/?api=1&query=resort"));
  assert.equal(normalizeGoogleMapsEmbedUrl(""), "");
});

test("coordinates are optional but must be complete and in range", () => {
  assert.deepEqual(parseOptionalCoordinates("", ""), { latitude: null, longitude: null });
  assert.deepEqual(parseOptionalCoordinates("3.2028", "73.2207"), { latitude: 3.2028, longitude: 73.2207 });
  assert.throws(() => parseOptionalCoordinates("3.2", ""));
  assert.throws(() => parseOptionalCoordinates("91", "73"));
  assert.throws(() => parseOptionalCoordinates("3x", "73"));
});
