import { getNotificationSettings } from "@/lib/site-content";

export async function getNotificationRecipient(kind: "partner" | "newsletter" | "business") {
  const { content } = await getNotificationSettings("published");

  if (kind === "partner") {
    return content.partnerRequestEmail || content.businessContactEmail;
  }

  if (kind === "newsletter") {
    return content.newsletterEmail || content.businessContactEmail;
  }

  return content.businessContactEmail;
}
