import assert from "node:assert/strict";
import test from "node:test";

import { propertyOverviewCopy } from "./property-overview";

test("Main Description takes priority over an accommodation count", () => {
  assert.equal(propertyOverviewCopy({
    description: "An island with sparkling emerald waters.",
    summary: "SEO summary",
    seoSummary: "SEO summary",
    accommodationSummary: "96"
  }, "Fallback"), "An island with sparkling emerald waters.");
});

test("other copy is used only when Main Description is empty", () => {
  assert.equal(propertyOverviewCopy({
    description: "  ",
    summary: "  ",
    seoSummary: "  ",
    accommodationSummary: "Accommodation details"
  }, "Fallback"), "Accommodation details");
});
