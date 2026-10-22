import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";

test("Partner Network draft, publish, image selection, and validation follow the settings workflow", async () => {
  const saved: Array<{ key: string; value: any }> = [];
  const published: string[] = [];
  const source = readFileSync(new URL("../app/admin/settings/actions.ts", import.meta.url), "utf8");
  const exports: Record<string, (...args: any[]) => Promise<any>> = {};
  const modules: Record<string, unknown> = {
    "next/cache": { revalidatePath() {} },
    "@/lib/site-content": {
      defaultHomepagePartnerContent: {},
      async saveSiteSettingDraft(key: string, _fallback: unknown, value: unknown) { saved.push({ key, value }); },
      async publishSiteSetting(key: string) { published.push(key); }
    },
    "@/lib/storage/site-assets": { async uploadSiteAsset() { return "https://example.com/uploaded.webp"; } },
    "@/lib/validations": { normalizeSafeMediaUrl(value: string) {
      if (value && !value.startsWith("https://")) throw new Error("Invalid media URL");
      return value;
    } }
  };
  runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText,
    { exports, require: (name: string) => modules[name], File, FormData, Error });
  const form = new FormData();
  for (const [key, value] of Object.entries({ title: "Partner title", summary: "Partner summary", sectionLabel: "Partners",
    buttonLabel: "Join", imageUrl: "https://example.com/selected.webp", tags: " Support \n\nRates\nSupport", intent: "draft" })) form.set(key, value);
  assert.equal((await exports.savePartnerDraftAction(undefined, form)).message, "Partner Network draft saved.");
  assert.equal(saved[0].key, "homepage.partner");
  assert.equal(saved[0].value.imageUrl, "https://example.com/selected.webp");
  assert.equal(JSON.stringify(saved[0].value.tags), JSON.stringify(["Support", "Rates"]));
  assert.equal(published.length, 0);
  form.set("intent", "publish");
  form.set("tags", "");
  form.set("partnerImageFile", new File(["image"], "partner.png", { type: "image/png" }));
  assert.equal((await exports.savePartnerDraftAction(undefined, form)).message, "Partner Network published.");
  assert.equal(saved[1].value.imageUrl, "https://example.com/uploaded.webp");
  assert.equal(saved[1].value.tags.length, 0);
  assert.deepEqual(published, ["homepage.partner"]);
  form.delete("partnerImageFile");
  form.set("imageUrl", "javascript:alert(1)");
  assert.equal((await exports.savePartnerDraftAction(undefined, form)).error, "Invalid media URL");
  assert.equal(saved.length, 2);
});
