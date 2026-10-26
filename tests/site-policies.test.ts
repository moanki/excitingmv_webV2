import assert from "node:assert/strict";
import { test } from "node:test";
import { COOKIE_NOTICE_MAX_AGE, defaultPolicies, hasCurrentCookieAcknowledgement, isPolicyId, normalizeSitePolicy, policyFromForm } from "../lib/site-policies";

test("new settings retain explicit blanks and a disabled cookie notice", () => {
  assert.deepEqual(normalizeSitePolicy(null, "privacy"), defaultPolicies.privacy);
  assert.deepEqual(normalizeSitePolicy(null, "cookies"), defaultPolicies.cookies);
  const blank = { title: "Cookies", body: "", effectiveDate: "", noticeEnabled: false, noticeText: "" };
  assert.deepEqual(normalizeSitePolicy(blank, "cookies"), blank);
  assert.equal(normalizeSitePolicy({ noticeEnabled: "false" }, "cookies").noticeEnabled, true);
  assert.equal(isPolicyId("privacy"), true);
  assert.equal(isPolicyId("site.footer"), false);
});

function form(intent = "draft") {
  const data = new FormData();
  data.set("title", "Privacy Policy");
  data.set("intent", intent);
  return data;
}

test("blank policy drafts can be saved but not published", () => {
  assert.equal(policyFromForm(form(), "privacy").body, "");
  assert.throws(() => policyFromForm(form("publish"), "privacy"), /content before publishing/);
  const data = form("publish");
  data.set("body", "First paragraph.\n\nSecond paragraph.\n<script>alert(1)</script>");
  data.set("effectiveDate", "2026-10-26");
  assert.equal(policyFromForm(data, "privacy").body, data.get("body"));
  data.set("effectiveDate", "2026-02-31");
  assert.throws(() => policyFromForm(data, "privacy"), /valid effective date/);
  data.set("effectiveDate", "");
  data.set("body", "x".repeat(100_001));
  assert.throws(() => policyFromForm(data, "privacy"), /100,000/);
});

test("an enabled cookie notice needs text, while a disabled notice can be blank", () => {
  const data = form();
  data.set("noticeEnabled", "on");
  assert.throws(() => policyFromForm(data, "cookies"), /notice text/);
  data.set("noticeText", "Essential cookies only.");
  assert.equal(policyFromForm(data, "cookies").noticeEnabled, true);
  data.delete("noticeEnabled");
  data.set("noticeText", "");
  assert.equal(policyFromForm(data, "cookies").noticeEnabled, false);
});

test("cookie acknowledgement expires, updates with notice text, and rejects corrupt storage", () => {
  const now = 1_000_000_000_000;
  const stored = JSON.stringify({ text: "Notice", at: now - 1000 });
  assert.equal(hasCurrentCookieAcknowledgement(stored, "Notice", now), true);
  assert.equal(hasCurrentCookieAcknowledgement(stored, "Changed notice", now), false);
  assert.equal(hasCurrentCookieAcknowledgement(stored, "Notice", now + COOKIE_NOTICE_MAX_AGE), false);
  assert.equal(hasCurrentCookieAcknowledgement(JSON.stringify({ text: "Notice", at: now + 1 }), "Notice", now), false);
  for (const raw of [null, "broken", "{}", "null"]) assert.equal(hasCurrentCookieAcknowledgement(raw, "Notice", now), false);
});
