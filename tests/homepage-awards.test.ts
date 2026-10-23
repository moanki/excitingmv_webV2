import assert from "node:assert/strict";
import { test } from "node:test";
import { newestAwardsFirst } from "../lib/homepage-awards";

test("homepage awards show 2026, 2025, 2024, 2023 without mutating saved settings", () => {
  const items = [2023, 2024, 2025, 2026].map((year) => ({ name: `TTM Awards - Top Producers ${year}`, imageUrl: `${year}.png` }));
  assert.deepEqual(newestAwardsFirst(items).map((item) => item.imageUrl), ["2026.png", "2025.png", "2024.png", "2023.png"]);
  assert.equal(items[0].imageUrl, "2023.png");
});

test("awards without years retain their relative order after dated awards", () => {
  const items = [{ name: "Recognition A" }, { name: "TTM 2026" }, { name: "Recognition B" }];
  assert.deepEqual(newestAwardsFirst(items).map((item) => item.name), ["TTM 2026", "Recognition A", "Recognition B"]);
});
