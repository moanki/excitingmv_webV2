export type PartnerStatus = "pending" | "approved" | "rejected" | "suspended";
export type PublishStatus = "draft" | "published" | "archived";
export type ResourceAudience = "all_partners" | "selected_partners";
export type ChatStatus = "open" | "resolved";

export type ResortSummary = {
  id: string;
  slug: string;
  name: string;
  location: string;
  category: string;
  transferType: string;
  summary: string;
  status: PublishStatus;
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

export type ChatMessageSummary = {
  id: string;
  sender: string;
  body: string;
  status: ChatStatus;
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
