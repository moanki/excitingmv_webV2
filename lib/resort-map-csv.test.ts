import assert from "node:assert/strict";
import test from "node:test";

import { stringify } from "csv-stringify/sync";

import { createResortMapTemplate, previewResortMapCsv, type ResortMapRecord } from "./resort-map-csv";

const resorts: ResortMapRecord[] = [
  { id: "a", name: "Vakkaru Island", slug: "vakkaru-island", map_embed_url: null, latitude: null, longitude: null },
  { id: "b", name: "Cora Cora Maldives", slug: "cora-cora-maldives", map_embed_url: null, latitude: 5.3, longitude: 72.9 }
];

function csv(rows: Array<[string, string, string, string]>) {
  return stringify(rows, { header: true, columns: ["slug", "map_embed_url", "latitude", "longitude"] });
}

test("template includes exact slugs and saved locations; blank rows are ignored", () => {
  const template = createResortMapTemplate(resorts);
  assert.match(template, /vakkaru-island/);
  const preview = previewResortMapCsv(template, resorts);
  assert.equal(preview.length, 1);
  assert.equal(preview[0].status, "unchanged");
});

test("quoted Google iframe HTML and decimal coordinates preview as changes", () => {
  const html = '<iframe src="https://www.google.com/maps/embed?pb=%211m18&amp;foo=bar"></iframe>';
  const rows = previewResortMapCsv(csv([
    ["vakkaru-island", html, "", ""],
    ["cora-cora-maldives", "", "5.31", "72.91"]
  ]), resorts);
  assert.deepEqual(rows.map((row) => row.status), ["ready", "ready"]);
  assert.equal(rows[0].mapEmbedUrl, "https://www.google.com/maps/embed?pb=%211m18&foo=bar");
  assert.equal(rows[1].longitude, 72.91);
});

test("invalid, unmatched, and duplicate rows cannot be selected", () => {
  const rows = previewResortMapCsv(csv([
    ["vakkaru-island", "", "5.2", ""],
    ["unknown-resort", "", "5.2", "72.8"],
    ["cora-cora-maldives", "", "5.2", "72.8"],
    ["cora-cora-maldives", "", "5.4", "72.9"]
  ]), resorts);
  assert.deepEqual(rows.map((row) => row.status), ["invalid", "unmatched", "duplicate", "duplicate"]);
  assert.throws(() => previewResortMapCsv("wrong,header\na,b", resorts), /CSV columns must be/);
});

test("Google map and coordinates in the same row require review", () => {
  const rows = previewResortMapCsv(csv([
    ["vakkaru-island", "https://www.google.com/maps/embed?pb=x", "5", "73"]
  ]), resorts);
  assert.equal(rows[0].status, "invalid");
});

test("hotel slugs use the same reviewed CSV matching without resort data", () => {
  const hotels: ResortMapRecord[] = [
    { id: "hotel-1", name: "Example Hotel", slug: "example-hotel", map_embed_url: null, latitude: null, longitude: null }
  ];
  const rows = previewResortMapCsv(csv([
    ["example-hotel", "", "4.2", "73.5"],
    ["vakkaru-island", "", "5.2", "72.9"]
  ]), hotels);
  assert.deepEqual(rows.map((row) => row.status), ["ready", "unmatched"]);
  assert.equal(rows[0].resortId, "hotel-1");
});
