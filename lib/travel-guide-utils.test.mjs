import assert from "node:assert/strict";
import test from "node:test";

import { relatedResortsForGuide, travelGuideReadTime, travelGuideTags } from "./travel-guide-utils.ts";

const guide = {
  category: "Sales Narrative",
  title: "Positioning seaplane arrivals",
  summary: "Explain the transfer as part of the experience.",
  mainContent: "Seaplane journeys suit clients who value a memorable arrival.",
  tips: [],
  sections: [],
  faq: []
};

test("derives metadata and only recommends matching resorts", () => {
  assert.equal(travelGuideReadTime(guide), "2 min");
  assert.deepEqual(travelGuideTags(guide), ["Seaplane positioning"]);
  assert.deepEqual(
    relatedResortsForGuide(guide, [
      { id: "1", name: "Air Resort", transferType: "Seaplane" },
      { id: "2", name: "Boat Resort", transferType: "Speedboat" }
    ]).map((resort) => resort.id),
    ["1"]
  );
});
