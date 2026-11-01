import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import ExcelJS from "exceljs";
import ts from "typescript";

function loadService(existing: any[], staged?: any) {
  const require = createRequire(import.meta.url);
  const source = readFileSync(new URL("../lib/services/excel-resort-sync-service.ts", import.meta.url), "utf8");
  const writes: string[] = [];
  const client = {
    from(table: string) {
      return {
        select() { return this; },
        eq() { return this; },
        async maybeSingle() { return { data: staged, error: null }; },
        update() { writes.push(table); throw new Error("Unexpected write"); },
        insert() { writes.push(table); throw new Error("Unexpected write"); }
      };
    }
  };
  const modules: Record<string, unknown> = {
    "@/lib/error-message": { toErrorMessage: (error: Error) => error.message },
    "@/lib/supabase/admin": { createSupabaseAdminClient: () => client },
    "@/lib/services/resort-ai-service": {},
    "@/lib/services/resort-service": { listAdminResorts: async () => existing }
  };
  const exports: any = {};
  runInNewContext(ts.transpileModule(source + "\nexports.matchResort = matchResort;", {
    compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true }
  }).outputText, { exports, require: (name: string) => name in modules ? modules[name] : require(name), console });
  return { service: exports, writes };
}

const meridien = { id: "meridien", name: "Le Méridien Maldives Resort & Spa", slug: "le-meridien-maldives", location: "Lhaviyani Atoll" };
const eri = { id: "eri", name: "Eri Maldives", slug: "eri-maldives", location: "North Malé Atoll" };
const model = {
  resort: { name: "Eri Maldives", slug: "eri-maldives", location: "North Malé Atoll" },
  providedResortFields: ["name"], sourceFile: { filename: "Eri.xlsx" }
};

test("Eri stays a new property despite an incorrect saved or manual Le Méridien match", () => {
  const { service } = loadService([meridien]);
  for (const [manual, saved] of [[undefined, undefined], [undefined, "meridien"], ["meridien", undefined]]) {
    assert.equal(service.matchResort(model, [meridien], manual, saved).status, "new_candidate");
  }
  const staleSlug = { ...model, resort: { ...model.resort, slug: meridien.slug } };
  assert.equal(service.matchResort(staleSlug, [meridien]).status, "new_candidate");
});

test("an existing Eri with a short name is matched and a wrong saved mapping cannot take precedence", () => {
  const { service } = loadService([meridien, eri]);
  assert.equal(service.matchResort(model, [meridien, eri], undefined, "meridien").resortId, "eri");
  assert.equal(service.matchResort(model, [eri], "eri").confidence, "manual");
});

test("a partial filename is not treated as an exact property match", () => {
  const { service } = loadService([meridien]);
  const unnamed = { ...model, providedResortFields: [], resort: { ...model.resort, name: "Meridien", slug: "meridien" }, sourceFile: { filename: "Meridien.xlsx" } };
  assert.equal(service.matchResort(unnamed, [meridien]).status, "new_candidate");
});

test("the Eri workbook layout preserves its explicit name and six room types", async () => {
  const workbook = new ExcelJS.Workbook();
  workbook.addWorksheet("Generic Details").addRows([
    ["Resort Name", "Location of Resort", "No of Villas", "Transfer", "Resort Catergory", "Description of Resort", "Butler Service"],
    ["Eri Maldives", "North Malé Atoll", "68 villas", "45 minutes by speedboat", "4 star plus", "Eri Maldives is an eco-chic lifestyle resort.", "No"]
  ]);
  workbook.addWorksheet("Villa Details").addRows([
    ["Room Type", "Villa Size", "Maximum Occupancy", "Room Description", "Room Amenities"],
    ...["Sky Studio", "Beach Studio", "Beach Villa", "Sunset Beach Villa", "BEACH SUITE", "BEACH POOL VILLA"].map(name => [name, "45 SQM", "3A", "Room description", "Wi-Fi"])
  ]);
  const { service } = loadService([meridien]);
  const [parsed] = await service.parseExcelResortWorkbook({ sourceUrl: "upload:Eri.xlsx", filename: "Eri.xlsx", bytes: await workbook.xlsx.writeBuffer() });
  assert.equal(parsed.resort.name, "Eri Maldives");
  assert.equal(parsed.rooms.length, 6);
  assert.equal(service.matchResort(parsed, [meridien], undefined, "meridien").status, "new_candidate");
});

test("an old Eri-to-Le Méridien update preview is blocked before any write", async () => {
  const payload = { kind: "excel_resort_sync_preview", version: 1, propertyType: "resort", status: "ready_to_update", model,
    match: { status: "matched", resortId: "meridien", resortName: meridien.name, confidence: "exact" } };
  const { service, writes } = loadService([meridien], { extracted_payload: payload, review_status: payload.status });
  const result = await service.applyExcelResortSyncPreview("old-preview");
  assert.equal(result.ok, false);
  assert.equal(result.status, 409);
  assert.match(result.error, /fresh preview/);
  assert.deepEqual(writes, []);
});

test("Add Draft cannot silently become an update when Eri was created after preview", async () => {
  const payload = { kind: "excel_resort_sync_preview", version: 1, propertyType: "resort", status: "new_candidate", model,
    match: { status: "new_candidate", candidates: [] } };
  const { service, writes } = loadService([eri], { extracted_payload: payload, review_status: payload.status });
  const result = await service.applyExcelResortSyncPreview("create-preview", "create_draft");
  assert.equal(result.ok, false);
  assert.equal(result.status, 409);
  assert.deepEqual(writes, []);
});
