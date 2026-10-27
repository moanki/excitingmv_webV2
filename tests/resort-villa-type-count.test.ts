import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { test } from "node:test";
import { runInNewContext } from "node:vm";
import ts from "typescript";
import { adminResortPayloadSchema } from "../lib/validations";

test("Villas uses the saved count without changing the accommodation cards", async () => {
  const require = createRequire(import.meta.url);
  const source = readFileSync(new URL("../app/resorts/[slug]/page.tsx", import.meta.url), "utf8");
  const rooms = [{ id: "room-one", name: "Beach Villa", amenities: [] }, { id: "room-two", name: "Water Villa", amenities: [] }];
  const resort = { name: "Test Resort", slug: "test-resort", location: "Baa Atoll", category: "5-Star", transferType: "Seaplane",
    brochurePath: "", butlerService: {}, curatedMoments: [], mealPlans: [], highlights: [], roomTypes: rooms, villaTypeCount: null as number | null };
  const modules: Record<string, unknown> = {
    "next/link": { default: "a" },
    "next/navigation": { notFound() { throw new Error("Unexpected missing resort"); } },
    "@/lib/services/resort-service": { getResortBySlug: async () => resort, listSimilarPublishedResorts: async () => [] },
    "@/lib/image-urls": { optimizedImageUrl: (url: string) => url },
    "@/components/property-detail-overview": { PropertyDetailOverview: "overview", propertyFactIcons: {} },
    "@/components/property-room-card": { PropertyRoomCard: "room-card" },
    "@/components/resort-location-map": { ResortLocationMap: "map" },
    "@/lib/property-overview": { propertyOverviewCopy: () => "Overview" }
  };
  const exports: { default?: (props: unknown) => Promise<any> } = {};
  runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText,
    { exports, require: (name: string) => name in modules ? modules[name] : name === "react/jsx-runtime" ? require(name) : {} });
  for (const [count, label] of [[null, "2 room types"], [7, "7 room types"], [1, "1 room type"], [0, "0 room types"]] as const) {
    resort.villaTypeCount = count;
    const page = await exports.default!({ params: Promise.resolve({ slug: resort.slug }) });
    assert.equal(page.props.children[0].props.facts.find((fact: { label: string }) => fact.label === "Villas").value, label);
    assert.equal(rooms.length, 2);
  }
  resort.villaTypeCount = null;
  rooms.splice(0);
  const page = await exports.default!({ params: Promise.resolve({ slug: resort.slug }) });
  assert.equal(page.props.children[0].props.facts.find((fact: { label: string }) => fact.label === "Villas").value, "To be confirmed");
});

test("admin count accepts an explicit integer or clears to automatic", () => {
  const schema = adminResortPayloadSchema.pick({ villaTypeCount: true });
  for (const villaTypeCount of [undefined, null, 0, 1, 18]) assert.equal(schema.safeParse({ villaTypeCount }).success, true);
  for (const villaTypeCount of [-1, 1.5, Number.NaN, "7"]) assert.equal(schema.safeParse({ villaTypeCount }).success, false);
});
