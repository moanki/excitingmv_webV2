type PropertyOverviewSource = {
  description: string;
  summary: string;
  seoSummary: string;
  accommodationSummary: string;
};

export function propertyOverviewCopy(property: PropertyOverviewSource, fallback: string) {
  return [property.description, property.summary, property.seoSummary, property.accommodationSummary]
    .map((value) => value.trim())
    .find(Boolean) || fallback;
}
