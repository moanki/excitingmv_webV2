const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const test = require("node:test");
const ts = require("typescript");

test("manual resort selection accepts the PDF and imports with progress and attachment feedback", async () => {
  const states = [];
  let cursor = 0;
  const requests = [];
  const progress = [];
  const finished = [];
  const path = "Brochures/Reviewed resort/factsheet.pdf";
  const modules = {
    react: {
      useState(initial) {
        const index = cursor++;
        if (!(index in states)) states[index] = initial;
        return [states[index], (next) => { states[index] = typeof next === "function" ? next(states[index]) : next; }];
      }
    },
    "@/components/admin/admin-action-feedback": {
      useAdminActionFeedback: () => ({
        startAction: () => "upload",
        updateAction: (_, value) => progress.push(value),
        finishAction: (_, value) => finished.push(value),
        notifyError: () => {}
      })
    },
    "@/lib/supabase/browser": {},
    "@/lib/public-env": { publicEnv: { NEXT_PUBLIC_SUPABASE_URL: "https://example.supabase.co", NEXT_PUBLIC_SUPABASE_ANON_KEY: "public" } },
    "@/lib/brochure-import": { signedBrochureTusConfig: () => ({}) },
    "tus-js-client": {
      Upload: class {
        constructor(_, options) { this.options = options; }
        start() { this.options.onProgress(50, 100); this.options.onSuccess(); }
      }
    }
  };
  const exports = {};
  const source = readFileSync(require.resolve("../components/brochure-upload.tsx"), "utf8");
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX } }).outputText;
  const fetch = async (_, options) => {
    const body = JSON.parse(options.body);
    requests.push(body);
    const data = body.mode === "preview" ? {
      rows: [{ relativePath: path, folder: "Reviewed resort", name: "factsheet.pdf", size: 1, resortId: "", status: "Review required.", duplicate: false }],
      resorts: [{ id: "chosen-resort", name: "Chosen resort", hasBrochure: true }]
    } : body.mode === "sign" ? { bucket: "resort-brochures", path: "new.pdf", token: "signed" } : { path: "new.pdf" };
    return { ok: true, json: async () => ({ ok: true, data }) };
  };
  new Function("exports", "require", "fetch", code)(exports, (name) => modules[name] ?? require(name), fetch);
  const render = () => { cursor = 0; return exports.BrochureImportPanel({}); };
  function find(element, predicate) {
    if (!element || typeof element !== "object") return undefined;
    if (predicate(element)) return element;
    for (const child of [element.props?.children].flat(Infinity)) {
      const found = find(child, predicate);
      if (found) return found;
    }
  }
  const file = new File(["%PDF-1.4"], "factsheet.pdf", { type: "application/pdf" });
  Object.defineProperty(file, "webkitRelativePath", { value: path });
  await find(render(), (e) => e.type === "input" && e.props.type === "file").props.onChange({ target: { files: [file] } });
  let tree = render();
  assert.equal(find(tree, (e) => e.type === "input" && e.props.type === "checkbox").props.checked, false);
  find(tree, (e) => e.type === "select").props.onChange({ target: { value: "chosen-resort" } });
  tree = render();
  assert.equal(find(tree, (e) => e.type === "input" && e.props.type === "checkbox").props.checked, true);
  const button = find(tree, (e) => e.type === "button" && e.props.onClick?.name === "importAccepted");
  assert.equal(button.props.disabled, false);
  await button.props.onClick();
  assert.deepEqual(requests.map((r) => r.mode), ["preview", "sign", "attach"]);
  assert.ok(progress.some((p) => p.message?.includes("Uploading PDF — 50%")));
  assert.ok(progress.some((p) => p.message?.includes("Linking uploaded PDF")));
  assert.equal(finished[0].status, "success");
  assert.match(finished[0].message, /1 of 1 brochures uploaded/);
  assert.equal(find(render(), (e) => e.type === "button" && e.props.onClick?.name === "importAccepted").props.disabled, true);
});
