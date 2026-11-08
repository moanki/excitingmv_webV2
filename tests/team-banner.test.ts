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
  const modules: Record<string, any> = {
    "next/link": { default: ({ children, ...props }: any) => React.createElement("a", props, children) },
    "@/lib/team-departments": { groupTeamContacts: () => [] },
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
});
