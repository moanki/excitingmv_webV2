const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const test = require("node:test");
const ts = require("typescript");

const source = readFileSync(require.resolve("../lib/brochure-import.ts"), "utf8");
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const loaded = { exports: {} };
new Function("exports", "module", compiled)(loaded.exports, loaded);

test("finds resort subfolders under any selected parent folder", () => {
  assert.equal(loaded.exports.brochureFolderName("ResortPDF/Vakkaru Island/Vakkaru Island.pdf"), "Vakkaru Island");
  assert.equal(loaded.exports.brochureFolderName("ResortBrochure/Vakkaru Island/brochure.pdf"), "Vakkaru Island");
  assert.equal(loaded.exports.brochureFolderName("Vakkaru Island\\brochure.pdf"), "Vakkaru Island");
});

test("rejects unexpected nesting instead of matching the wrong resort", () => {
  assert.equal(loaded.exports.brochureFolderName("ResortBrochure/Vakkaru Island/Old/brochure.pdf"), "");
  assert.equal(loaded.exports.brochureFolderName("brochure.pdf"), "");
});

test("uses the signed TUS endpoint with its required headers", () => {
  assert.deepEqual(
    loaded.exports.signedBrochureTusConfig("https://project.supabase.co", "public-key", "signed-token"),
    {
      endpoint: "https://project.storage.supabase.co/storage/v1/upload/resumable/sign",
      headers: { apikey: "public-key", "x-signature": "signed-token" }
    }
  );
});

test("separates brochure storage paths by property type", () => {
  assert.equal(loaded.exports.brochureStoragePrefix("resort", "abc"), "resorts/abc/brochures/");
  assert.equal(loaded.exports.brochureStoragePrefix("hotels", "abc"), "hotels/abc/brochures/");
  assert.equal(loaded.exports.brochureStoragePrefix("liveaboards", "abc"), "liveaboards/abc/brochures/");
});

test("choosing a replacement deselects other PDFs for that property without affecting other properties", () => {
  const original = {
    "resort/old.pdf": { resortId: "resort", accepted: true },
    "other/file.pdf": { resortId: "other", accepted: true }
  };
  const next = loaded.exports.selectBrochure(original, "resort/new.pdf", "resort", true);
  assert.equal(next["resort/new.pdf"].accepted, true);
  assert.equal(next["resort/old.pdf"].accepted, false);
  assert.equal(next["other/file.pdf"].accepted, true);
  assert.equal(original["resort/old.pdf"].accepted, true);
  const chosenOld = loaded.exports.selectBrochure(next, "resort/old.pdf", "resort", true);
  assert.equal(chosenOld["resort/new.pdf"].accepted, false);
  assert.equal(chosenOld["resort/old.pdf"].accepted, true);
});

test("skipping a PDF or clearing its property leaves other accepted brochures selected", () => {
  const original = { "resort/new.pdf": { resortId: "resort", accepted: true } };
  const skipped = loaded.exports.selectBrochure(original, "resort/old.pdf", "resort", false);
  assert.equal(skipped["resort/new.pdf"].accepted, true);
  assert.equal(skipped["resort/old.pdf"].accepted, false);
  const cleared = loaded.exports.selectBrochure(skipped, "resort/new.pdf", "", true);
  assert.equal(cleared["resort/new.pdf"].accepted, false);
});
