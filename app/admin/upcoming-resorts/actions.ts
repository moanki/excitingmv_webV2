"use server";

import { revalidatePath } from "next/cache";
import { requireAdminRole } from "@/lib/auth/require-admin";
import { upcomingPageSchema } from "@/lib/upcoming-resorts";
import { saveUpcomingResorts } from "@/lib/services/upcoming-resorts-service";

export async function saveCalendarAction(_: { error?: string; message?: string; revision: string }, form: FormData): Promise<{ error?: string; message?: string; revision: string }> {
  const revision = String(form.get("revision") ?? "");
  try {
    await requireAdminRole(["super_admin", "admin", "content_manager"]);
    const input = String(form.get("content") ?? "");
    if (input.length > 750000) throw new Error("This calendar is too large to save.");
    const parsed = upcomingPageSchema.safeParse(JSON.parse(input));
    if (!parsed.success) {
      const issue = parsed.error.issues[0];
      throw new Error(`${issue.path.join(" → ")}: ${issue.message}`);
    }
    const publish = form.get("intent") === "publish";
    const nextRevision = await saveUpcomingResorts(parsed.data, revision, publish);
    revalidatePath("/upcoming-resorts");
    revalidatePath("/admin/upcoming-resorts");
    return { revision: nextRevision, message: publish ? "Calendar published. The page now shows your changes." : "Draft saved. The published page has not changed." };
  } catch (error) {
    return { revision, error: error instanceof Error ? error.message : "Saving failed. Please try again." };
  }
}
