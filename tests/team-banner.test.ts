import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import * as React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";

test("Team uses its published banner, keeps the legacy fallback, and honors a cleared banner", async () => {
  const require = createRequire(import.meta.url);
  const exports: Record<string, any> = {};
  let heroImageUrl: string | undefined;
  let groups: any[] = [];
  const modules: Record<string, any> = {
    "next/link": { default: ({ children, ...props }: any) => React.createElement("a", props, children) },
    "@/lib/team-departments": { groupTeamContacts: () => groups },
    "./team-portraits.css": {},
    "@/lib/image-urls": { optimizedImageUrl: (url: string) => url },
    "@/lib/site-content": {
      getContactPageContent: async (mode: string) => {
        assert.equal(mode, "published");
        return { content: { title: "Team", subtitle: "Our people", departments: [], regions: [], heroImageUrl } };
      },
      getCatalogueContent: async () => ({ content: { heroImageUrl: "https://example.com/legacy.jpg" } })
    }
  };
  const source = readFileSync(new URL("../app/team/page.tsx", import.meta.url), "utf8");
  runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText,
    { exports, require: (name: string) => modules[name] ?? require(name) });
  assert.match(renderToStaticMarkup(await exports.default()), /legacy\.jpg/);
  heroImageUrl = "https://example.com/new-banner.jpg";
  const updated = renderToStaticMarkup(await exports.default());
  assert.match(updated, /new-banner\.jpg/);
  assert.doesNotMatch(updated, /legacy\.jpg/);
  heroImageUrl = "";
  assert.doesNotMatch(renderToStaticMarkup(await exports.default()), /background-image|legacy\.jpg|new-banner\.jpg/);
  const person = { contactName: "Executive member", role: "Director", photoUrl: "https://example.com/portrait.jpg", email: "private@example.com", whatsapp: "+9601234567" };
  groups = [
    { id: "executive", name: "Executive team", displayStyle: "portraits", contacts: [person] },
    { id: "sales", name: "Sales", displayStyle: "contacts", contacts: [{ ...person, contactName: "Sales member", email: "sales@example.com" }] }
  ];
  const mixed = renderToStaticMarkup(await exports.default());
  const portrait = mixed.slice(mixed.indexOf('<figure class="team-portrait"'), mixed.indexOf("</figure>"));
  assert.match(portrait, /portrait\.jpg/);
  assert.match(portrait, /<figcaption><h3>Executive member<\/h3><p>Director<\/p><\/figcaption>/);
  assert.doesNotMatch(portrait, /mailto:|wa\.me|private@example/);
  assert.match(mixed, /mailto:sales@example.com/);
});
