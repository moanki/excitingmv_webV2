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
