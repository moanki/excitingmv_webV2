import assert from "node:assert/strict";
import { test } from "node:test";
import { calendarValidationMessage, featuredOpenings, upcomingPageSchema, openingSchema, openingStats, visibleOpenings, type UpcomingPageContent } from "../lib/upcoming-resorts";

const resort = {
  id: "one", sectionId: "year", name: "Test opening", atoll: "Raa Atoll", operator: "", openingYear: 2027,
  launchDate: "", dateLabel: "2027", status: "In development", dateMoved: true, note: "", highlights: "",
  keyCount: 54, keysLabel: "54", imageUrl: "", imageAlt: "", imageCaption: "", officialUrl: "https://example.com",
  sourceUrl: "https://example.com/source", checkedOn: "2026-11-08", enabled: true
};
const content: UpcomingPageContent = {
  enabled: true, seoTitle: "Calendar", seoDescription: "", eyebrow: "", title: "Calendar", subtitle: "", description: "",
  bannerUrl: "", bannerAlt: "", bannerCaption: "", jumpLabel: "Jump", askLabel: "Ask", teamUrl: "/team",
  officialLabel: "Official", sourceLabel: "Source", dateMovedLabel: "Moved", checkedLabel: "Checked", emptyMessage: "Empty", keysUnit: "keys",
  stats: [{ id: "total", label: "Openings", metric: "openings", value: "" }, { id: "keys", label: "Keys", metric: "keys", value: "" }],
  sections: [{ id: "year", title: "2027", description: "", jumpLabel: "", enabled: true }],
  guidanceTitle: "", guidanceBody: "", ctaTitle: "", ctaBody: "", ctaLabel: "", disclaimer: "", resorts: [resort]
};

test("validates configurable copy, arbitrary statuses, and empty optional links", () => {
  assert.equal(upcomingPageSchema.parse(content).resorts.length, 1);
  assert.equal(openingSchema.parse({ ...resort, status: "Awaiting final inspection", officialUrl: "", sourceUrl: "" }).status, "Awaiting final inspection");
});
test("rejects unsafe URLs, impossible dates, invalid years and negative inventory", () => {
  for (const officialUrl of ["javascript:alert(1)", "data:text/html,hello", "//example.com", "https://name:password@example.com"])
    assert.equal(openingSchema.safeParse({ ...resort, officialUrl }).success, false);
  for (const launchDate of ["2027-02-30", "2027-99-10", "invalid"])
    assert.equal(openingSchema.safeParse({ ...resort, launchDate }).success, false);
  assert.equal(openingSchema.safeParse({ ...resort, keyCount: -1 }).success, false);
  assert.equal(openingSchema.safeParse({ ...resort, openingYear: 0 }).success, false);
  assert.equal(upcomingPageSchema.safeParse({ ...content, resorts: [{ ...resort, launchDate: "2028-03-01" }] }).success, false);
});
test("rejects duplicate IDs and orphan sections before any data is saved", () => {
  assert.equal(upcomingPageSchema.safeParse({ ...content, resorts: [resort, resort] }).success, false);
  assert.equal(upcomingPageSchema.safeParse({ ...content, resorts: [{ ...resort, sectionId: "missing" }] }).success, false);
  assert.equal(upcomingPageSchema.safeParse({ ...content, sections: [] }).success, false);
});
test("statistics and public cards consistently exclude hidden resorts and hidden sections", () => {
  const c = { ...content, resorts: [resort, { ...resort, id: "hidden", enabled: false }] };
  assert.equal(visibleOpenings(c).length, 1);
  assert.deepEqual(openingStats(c).map((s) => s.displayValue), ["1", "54"]);
  assert.equal(visibleOpenings({ ...c, sections: [{ ...content.sections[0], enabled: false }] }).length, 0);
  assert.equal(openingStats({ ...c, sections: [{ ...content.sections[0], enabled: false }] })[0].displayValue, "0");
  assert.equal(openingStats({ ...c, stats: [{ ...content.stats[0], value: "Around ten" }] })[0].displayValue, "Around ten");
});

test("validation errors identify the resort, visible field and recovery tab", () => {
  const invalid = { ...content, resorts: [{ ...resort, launchDate: "2028-03-01" }] };
  const result = upcomingPageSchema.safeParse(invalid);
  assert.equal(result.success, false);
  if (!result.success) {
    const message = calendarValidationMessage(result.error.issues[0], invalid);
    assert.match(message, /Test opening — Exact launch date/);
    assert.match(message, /Open Resort openings/);
    assert.doesNotMatch(message, /resorts → 0/);
  }
});

test("homepage features are opt-in, keep calendar order and respect published visibility", () => {
  assert.deepEqual(featuredOpenings(upcomingPageSchema.parse(content)), []);
  const selected = Array.from({ length: 12 }, (_, index) => ({
    ...resort, id: `selected-${index}`, featuredOnHomepage: true
  }));
  const calendar = upcomingPageSchema.parse({
    ...content,
    sections: [...content.sections, { id: "hidden-year", title: "2028", description: "", jumpLabel: "", enabled: false }],
    resorts: [
      ...selected,
      { ...resort, id: "hidden-resort", enabled: false, featuredOnHomepage: true },
      { ...resort, id: "hidden-section", sectionId: "hidden-year", featuredOnHomepage: true }
    ]
  });
  assert.deepEqual(featuredOpenings(calendar).map((entry) => entry.id), selected.map((entry) => entry.id));
  assert.deepEqual(featuredOpenings({ ...calendar, enabled: false }), []);
});
