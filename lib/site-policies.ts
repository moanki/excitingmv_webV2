export type PolicyId = "privacy" | "cookies";

export type SitePolicy = {
  title: string;
  body: string;
  effectiveDate: string;
  noticeEnabled?: boolean;
  noticeText?: string;
};

export const policyPaths: Record<PolicyId, string> = {
  privacy: "/privacy-policy",
  cookies: "/cookie-policy"
};

export const defaultPolicies: Record<PolicyId, SitePolicy> = {
  privacy: { title: "Privacy Policy", body: "", effectiveDate: "" },
  cookies: {
    title: "Cookie Policy", body: "", effectiveDate: "",
    noticeEnabled: true,
    noticeText: "Essential cookies keep sign-in secure, and we remember this notice on your browser."
  }
};

export function isPolicyId(value: unknown): value is PolicyId {
  return value === "privacy" || value === "cookies";
}

export function normalizeSitePolicy(value: unknown, id: PolicyId): SitePolicy {
  const source = value && typeof value === "object" ? value as Partial<SitePolicy> : {};
  const fallback = defaultPolicies[id];
  return {
    title: typeof source.title === "string" ? source.title : fallback.title,
    body: typeof source.body === "string" ? source.body : fallback.body,
    effectiveDate: typeof source.effectiveDate === "string" ? source.effectiveDate : "",
    ...(id === "cookies" ? {
      noticeEnabled: typeof source.noticeEnabled === "boolean" ? source.noticeEnabled : fallback.noticeEnabled,
      noticeText: typeof source.noticeText === "string" ? source.noticeText : fallback.noticeText
    } : {})
  };
}

export function policyFromForm(formData: FormData, id: PolicyId): SitePolicy {
  const title = String(formData.get("title") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const effectiveDate = String(formData.get("effectiveDate") ?? "");
  const noticeText = String(formData.get("noticeText") ?? "").trim();
  const noticeEnabled = formData.get("noticeEnabled") === "on";
  if (!title || title.length > 160) throw new Error("Enter a policy title of up to 160 characters.");
  if (body.length > 100_000) throw new Error("Policy content must be under 100,000 characters.");
  if (formData.get("intent") === "publish" && !body) throw new Error("Add policy content before publishing.");
  if (effectiveDate && (!/^\d{4}-\d{2}-\d{2}$/.test(effectiveDate) || !Number.isFinite(Date.parse(effectiveDate)) || new Date(effectiveDate).toISOString().slice(0, 10) !== effectiveDate)) {
    throw new Error("Enter a valid effective date.");
  }
  if (id === "cookies" && (noticeText.length > 1000 || (noticeEnabled && !noticeText))) {
    throw new Error("Enter cookie notice text of up to 1,000 characters, or turn off the notice.");
  }
  return { title, body, effectiveDate, ...(id === "cookies" ? { noticeEnabled, noticeText } : {}) };
}

export const COOKIE_NOTICE_STORAGE_KEY = "excitingmv.cookie-notice.v1";
export const COOKIE_NOTICE_EVENT = "excitingmv:cookie-notice";
export const COOKIE_NOTICE_MAX_AGE = 180 * 24 * 60 * 60 * 1000;

export function hasCurrentCookieAcknowledgement(raw: string | null, text: string, now = Date.now()) {
  try {
    const value = JSON.parse(raw ?? "null");
    return value?.text === text && typeof value.at === "number" && value.at <= now && now - value.at < COOKIE_NOTICE_MAX_AGE;
  } catch {
    return false;
  }
}
