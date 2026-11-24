import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import * as social from "../lib/footer-social-media";

test("Telegram is editable with social links and follows draft, publish and optional URL rules", async () => {
  const saved: any[] = [];
  const paths: string[] = [];
  const modules: Record<string, unknown> = {
    "next/cache": { revalidatePath: (path: string) => paths.push(path) },
    "@/lib/footer-social-media": social,
    "@/lib/site-content": { saveSiteSettingDraft: (...args: unknown[]) => saved.push(args) }
  };
  const exports: Record<string, any> = {};
  const source = readFileSync(new URL("../app/admin/settings/footer/social-media/actions.ts", import.meta.url), "utf8");
  runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText,
    { exports, require: (name: string) => modules[name], URL, Error });
  const form = new FormData();
  for (const [key, value] of Object.entries(social.defaultFooterSocialMedia)) form.set(key, value);
  assert.equal(form.get("telegram"), "https://t.me/excitingmv_dmc");
  form.set("telegram", "javascript:alert(1)");
  assert.match((await exports.saveFooterSocialMediaAction(undefined, form)).error, /Telegram channel/);
  assert.equal(saved.length, 0);
  form.set("telegram", " https://t.me/updated_channel ");
  form.set("intent", "draft");
  assert.match((await exports.saveFooterSocialMediaAction(undefined, form)).message, /draft saved/);
  assert.equal(saved[0][2].telegram, "https://t.me/updated_channel");
  assert.equal(saved[0][2].instagram, social.defaultFooterSocialMedia.instagram);
  assert.equal(saved[0][3], false);
  assert.ok(!paths.includes("/"));
  form.set("telegram", "");
  form.set("intent", "publish");
  assert.match((await exports.saveFooterSocialMediaAction(undefined, form)).message, /published/);
  assert.equal(saved[1][2].telegram, "");
  assert.equal(saved[1][3], true);
  assert.ok(paths.includes("/"));
});
