import type {
  ChatMessageSummary,
  PartnerSummary,
  ResourceSummary,
  ResortSummary
} from "@/lib/types";

export const homepageHighlights = [
  {
    eyebrow: "Protected Access",
    title: "Partner approvals backed by roles and RLS.",
    description:
      "Approved partners access protected resort files, rates, and trade resources from one secure portal."
  },
  {
    eyebrow: "Live Support",
    title: "Realtime chat for sales and contracting questions.",
    description:
      "Supabase Realtime powers direct communication between partners and the internal sales team."
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
    status: "draft"
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

export const sampleMessages: ChatMessageSummary[] = [
  {
    id: "chat-1",
    sender: "Aurora Travel House",
    body: "Can you share the current seaplane supplement for Soneva Fushi?",
    status: "open"
  },
  {
    id: "chat-2",
    sender: "Sales Team",
    body: "We have updated the trade rate sheet and uploaded it to protected resources.",
    status: "resolved"
  }
];
