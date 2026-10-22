import assert from "node:assert/strict";
import { test } from "node:test";
import { normalizeHomepageWhyUs } from "../lib/homepage-why-us";

const defaults = { imageUrl: "https://example.com/default.jpg", items: [{ title: "Default", description: "Default reason" }] };

test("legacy settings retain every saved reason and get the existing photo", () => {
  const items = [{ title: "Saved title", description: "Saved description" }];
  assert.deepEqual(normalizeHomepageWhyUs(items, defaults), { imageUrl: defaults.imageUrl, items });
});

test("saved photo is used, including when no reasons remain", () => {
  const saved = { imageUrl: "https://example.com/selected.jpg", items: [] };
  assert.deepEqual(normalizeHomepageWhyUs(saved, defaults), saved);
});

test("missing settings use defaults and cleared images stay cleared", () => {
  assert.deepEqual(normalizeHomepageWhyUs(null, defaults), defaults);
  assert.deepEqual(normalizeHomepageWhyUs({ imageUrl: "", items: [] }, defaults), { imageUrl: "", items: [] });
});
