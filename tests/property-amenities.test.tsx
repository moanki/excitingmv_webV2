import assert from "node:assert/strict";
import { test } from "node:test";
import { renderToStaticMarkup } from "react-dom/server";
import { PropertyDetailOverview } from "../components/property-detail-overview";
import type { ResortCuratedMoment } from "../lib/types";

function renderAmenities(curatedMoments: ResortCuratedMoment[]) {
  return renderToStaticMarkup(<PropertyDetailOverview actionLabel="resort" backHref="/resorts"
    curatedMoments={curatedMoments} facts={[]} kicker="Maldives" name="Test resort"
    overviewCopy="An island resort." overviewTitle="Island stays" />);
}

test("amenities keep their saved order without category headings and use matching icons", () => {
  const html = renderAmenities([
    { title: "Restaurants", description: "" },
    { title: "Free Wi-Fi", description: "Available at the spa" },
    { title: "Spa", description: "" },
    { title: "Spacious surroundings", description: "" }
  ]);
  assert.doesNotMatch(html, /<h3|property-detail-curated__group/);
  assert.ok(html.indexOf("Restaurants") < html.indexOf("Free Wi-Fi"));
  assert.match(html, /lucide-utensils/);
  assert.match(html, /lucide-wifi/);
  assert.equal((html.match(/lucide-flower-2/g) ?? []).length, 1);
  assert.match(html, /lucide-sparkles/);
});

test("long lists remain accessible through view more and custom icons are preserved", () => {
  const items = Array.from({ length: 21 }, (_, index) => ({ title: `Amenity ${index}`, description: "" }));
  const html = renderAmenities([...items, { title: "Custom", description: "", iconUrl: "https://example.com/icon.png" }]);
  assert.equal((html.match(/<li /g) ?? []).length, 22);
  assert.match(html, /<details[^>]*><summary>view more<\/summary>/);
  assert.ok(html.indexOf("Amenity 19") < html.indexOf("<details"));
  assert.ok(html.indexOf("Amenity 20") > html.indexOf("<details"));
  assert.match(html, /https:\/\/example.com\/icon.png/);
});
