const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const test = require("node:test");
const ts = require("typescript");

const source = readFileSync(require.resolve("../lib/error-message.ts"), "utf8");
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const loaded = { exports: {} };
new Function("exports", "module", compiled)(loaded.exports, loaded);

test("extracts useful messages from service error objects", () => {
  assert.equal(loaded.exports.toErrorMessage({ error: { message: "File too large" } }, "Fallback"), "File too large");
  assert.equal(loaded.exports.toErrorMessage({}, "Fallback"), "Fallback");
});
