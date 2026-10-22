import assert from "node:assert/strict";
import test from "node:test";

import { normalizeHomepageServices } from "./homepage-services";

const defaults = {
  sectionLabel: "Destination Management",
  title: "Built around every Maldives booking.",
  description: "Local support",
  items: [{ title: "Default", description: "Default service", icon: "handshake", imageUrl: "", imageAlt: "", displayOrder: 1, enabled: true }]
};

test("legacy service arrays retain their rows and gain editable section copy", () => {
  const content = normalizeHomepageServices([
    { title: "Partner Operations", description: "Live support", icon: "headphones", displayOrder: 2, enabled: true },
    { title: "Resort Contracting", description: "Preferred access", icon: "handshake", displayOrder: 1, enabled: true }
  ], defaults);

  assert.equal(content.sectionLabel, "Destination Management");
  assert.equal(content.title, defaults.title);
  assert.deepEqual(content.items.map((item) => item.title), ["Resort Contracting", "Partner Operations"]);
});

test("saved section copy and disabled service rows survive normalization", () => {
  const content = normalizeHomepageServices({
    sectionLabel: "Our DMC",
    title: "Tailored support",
    description: "A custom summary",
    items: [{ title: "Concierge", description: "Local team", icon: "sparkles", displayOrder: 1, enabled: false }]
  }, defaults);

  assert.equal(content.sectionLabel, "Our DMC");
  assert.equal(content.description, "A custom summary");
  assert.equal(content.items[0].enabled, false);
});
