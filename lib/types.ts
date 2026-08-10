export type PartnerStatus = "pending" | "approved" | "rejected" | "suspended";
export type PublishStatus = "draft" | "published" | "archived";
export type ResourceAudience = "all_partners" | "selected_partners";

export type ResortPublishingMode =
  | "draft"
  | "archived"
  | "published_standard"
  | "published_featured";

export type ResortRoomSummary = {
  id?: string;
  name: string;
  description: string;
  seoDescription: string;
  photoUrl?: string;
  sizeLabel?: string;
  maxOccupancy?: number | null;
  bedType?: string;
  viewLabel?: string;
  amenities?: string[];
};

export type ResortCuratedMoment = {
  title: string;
  description: string;
  iconUrl?: string;
};

export type ResortSummary = {
  id: string;
  slug: string;
  name: string;
  location: string;
  category: string;
  transferType: string;
  summary: string;
  accommodationSummary?: string;
  heroImageUrl?: string;
  status: PublishStatus;
  isFeaturedHomepage?: boolean;
  selectionTags?: string[];
  highlights?: string[];
  mealPlans?: string[];
  curatedMoments?: ResortCuratedMoment[];
  butlerService?: {
    available?: boolean;
    displayName?: string;
    description?: string;
  };
  recommendedOrder?: number;
  createdAt?: string;
  updatedAt?: string;
};

export type PartnerSummary = {
  name: string;
  email: string;
  market: string;
  status: PartnerStatus;
};

export type ResourceSummary = {
  title: string;
  kind: string;
  audience: ResourceAudience;
  status: PublishStatus;
};

export type ServiceResult<T> =
  | {
      ok: true;
      data: T;
    }
  | {
      ok: false;
      error: string;
      status?: number;
      details?: unknown;
    };
