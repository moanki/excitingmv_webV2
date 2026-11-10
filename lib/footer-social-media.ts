export const footerSocialMediaKey = "site.footer.socialMedia";

export const footerSocialPlatforms = [
  { key: "linkedin", label: "LinkedIn" },
  { key: "instagram", label: "Instagram" },
  { key: "facebook", label: "Facebook" },
  { key: "tiktok", label: "TikTok" }
] as const;

export type FooterSocialMedia = Record<(typeof footerSocialPlatforms)[number]["key"], string>;

export const defaultFooterSocialMedia: FooterSocialMedia = {
  linkedin: "https://mv.linkedin.com/company/excitingmv",
  instagram: "https://www.instagram.com/excitingmv/",
  facebook: "https://www.facebook.com/excitingmv/",
  tiktok: "https://www.tiktok.com/tag/exciting"
};
