import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";
import { defaultTeamDepartments } from "../lib/team-departments";

test("collapsed contact editors keep the complete save payload and separate draft and publish actions", () => {
  const require = createRequire(import.meta.url);
  const exports: Record<string, any> = {};
  const source = readFileSync(new URL("../app/admin/settings/contact/contact-settings-form.tsx", import.meta.url), "utf8");
  const modules: Record<string, any> = {
    react: { ...React, useActionState: () => [undefined, "/test-save", false] },
    "next/link": { default: ({ children, ...props }: any) => React.createElement("a", props, children) },
    "@/app/admin/settings/actions": { saveContactDraftAction() {} },
    "@/components/admin/action-feedback": { ActionMessage: () => null },
    "@/components/media-field": { MediaField: ({ inputName, value }: any) => React.createElement("input", { type: "hidden", name: inputName, value }) },
    "@/lib/image-urls": { optimizedImageUrl: (url: string) => url }
  };
  runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText,
    { exports, require: (name: string) => modules[name] ?? require(name) });
  const regions = ["Sales contact", "Finance contact"].map((contactName, index) => ({
    contactName, departmentId: index ? "finance" : "sales-reservations", role: "Manager", regionTitle: "Europe", location: "Maldives",
    email: `contact${index}@example.com`, whatsapp: "+960 1234567", photoUrl: "", displayOrder: index + 1, enabled: true
  }));
  const html = renderToStaticMarkup(React.createElement(exports.ContactSettingsForm, {
    contact: { title: "Meet Our Team", subtitle: "Our team", ctaText: "Contact us", ctaLabel: "Become a partner", ctaHref: "/partner/register", departments: defaultTeamDepartments, regions }, mediaLibrary: []
  }));
  assert.match(html, /<h1>Team<\/h1>/);
  assert.match(html, /name="department_count" value="4"/);
  assert.match(html, /name="contact_count" value="2"/);
  assert.equal((html.match(/data-contact-key=/g) ?? []).length, 2);
  assert(!/data-contact-key="[^"]+" open/.test(html), "editors start collapsed");
  for (const index of [0, 1]) {
    for (const field of ["contactName", "departmentId", "role", "regionTitle", "location", "email", "whatsapp", "photoUrl", "displayOrder", "enabled"]) {
      assert(html.includes(`name="contact_${index}_${field}"`), `${field} remains submitted for closed contact ${index}`);
    }
  }
  assert.match(html, /<button(?=[^>]*name="intent")(?=[^>]*value="draft")[^>]*>/);
  assert.match(html, /<button(?=[^>]*name="intent")(?=[^>]*value="publish")[^>]*>/);
  assert(!html.includes("Manage the page title, departments, and team contacts."));
});
