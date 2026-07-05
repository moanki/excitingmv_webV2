import type { PartnerSummary, ResourceSummary, ResortSummary } from "@/lib/types";

function supabaseStorageUrl(path: string) {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace(/\/$/, "");
  return baseUrl ? `${baseUrl}${path}` : "";
}

export const homepageHighlights = [
  {
    eyebrow: "Protected Access",
    title: "Partner approvals backed by roles and RLS.",
    description:
      "Approved partners access protected resort files, rates, and trade resources from one secure portal."
  },
  {
    eyebrow: "Partner Support",
    title: "Clear contact pathways for sales and contracting questions.",
    description:
      "Dedicated inquiry and contact flows route partner questions to the internal sales team."
  },
    {
      eyebrow: "Admin AI",
      title: "AI Gateway powers import review and SEO drafting.",
      description:
        "AI helps the admin team accelerate data extraction and summary generation without auto-publishing."
  }
];

export const sampleResorts: ResortSummary[] = [
  {
    id: "resort-1",
    slug: "soneva-fushi",
    name: "Soneva Fushi",
    location: "Baa Atoll",
    category: "Ultra Luxury",
    transferType: "Seaplane",
    summary: "Barefoot luxury with expansive villas, marine experiences, and iconic family appeal.",
    heroImageUrl:
      "https://images.unsplash.com/photo-1540541338287-41700207dee6?auto=format&fit=crop&w=1200&q=88",
    status: "published"
  },
  {
    id: "resort-2",
    slug: "joali-maldives",
    name: "JOALI Maldives",
    location: "Raa Atoll",
    category: "Luxury Art Retreat",
    transferType: "Seaplane",
    summary: "Art-led island hospitality with curated wellness, refined dining, and elevated design.",
    heroImageUrl:
      supabaseStorageUrl("/storage/v1/render/image/public/site-assets/resorts/1777890426234-ff89c105-42a8-44b1-a1a3-f33fe8289e09.jpg?width=1200&height=800&resize=cover&quality=90"),
    status: "published"
  },
  {
    id: "resort-3",
    slug: "patina-fari-islands",
    name: "Patina Maldives, Fari Islands",
    location: "North Male Atoll",
    category: "Modern Luxury",
    transferType: "Speedboat",
    summary: "Contemporary island living built for design-conscious travellers and multi-experience stays.",
    heroImageUrl:
      "https://images.unsplash.com/photo-1519046904884-53103b34b206?auto=format&fit=crop&w=1200&q=88",
    status: "published"
  },
  {
    id: "resort-4",
    slug: "waldorf-astoria-maldives-ithaafushi",
    name: "Waldorf Astoria Maldives Ithaafushi",
    location: "South Male Atoll",
    category: "Ultra Luxury",
    transferType: "Speedboat",
    summary: "Three private islands, expansive pool villas, and exceptional destination dining.",
    heroImageUrl:
      supabaseStorageUrl("/storage/v1/render/image/public/site-assets/resorts/1777887197118-55eee71b-a9d2-4d21-8028-84b4b9a1de14.jpg?width=1200&height=800&resize=cover&quality=90"),
    status: "published"
  },
  {
    id: "resort-5",
    slug: "hilton-maldives-amingiri",
    name: "Hilton Maldives Amingiri Resort & Spa",
    location: "North Male Atoll",
    category: "Luxury",
    transferType: "Speedboat",
    summary: "A polished island retreat with private pools, family experiences, and easy access from Male.",
    heroImageUrl:
      supabaseStorageUrl("/storage/v1/render/image/public/site-assets/media-library/1780221773862-5459d356-30b3-4950-adc1-27405f131657.webp?width=1200&height=800&resize=cover&quality=90"),
    status: "published"
  }
];

export const samplePartnerResources: ResourceSummary[] = [
  {
    title: "Summer Offer Deck",
    kind: "Presentation",
    audience: "all_partners",
    status: "published"
  },
  {
    title: "Confidential Rate Sheet",
    kind: "Rate Sheet",
    audience: "selected_partners",
    status: "published"
  },
  {
    title: "Resort Sales Kit",
    kind: "Sales Kit",
    audience: "all_partners",
    status: "draft"
  }
];

export const samplePartners: PartnerSummary[] = [
  {
    name: "Aurora Travel House",
    email: "sales@auroratravel.com",
    market: "UK",
    status: "pending"
  },
  {
    name: "Island Partners GCC",
    email: "contracts@islandpartners.ae",
    market: "UAE",
    status: "approved"
  }
];

