import "server-only";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { UPCOMING_SETTING_KEY, upcomingPageSchema, type UpcomingPageContent } from "@/lib/upcoming-resorts";

export async function getUpcomingResorts(mode: "draft" | "published" = "published") {
  const { data, error } = await createSupabaseAdminClient().from("site_settings")
    .select("value").eq("key", UPCOMING_SETTING_KEY).maybeSingle();
  if (error) throw new Error("The opening calendar could not be loaded. Please try again.");
  if (!data?.value?.[mode]) return null;
  return { content: upcomingPageSchema.parse(data.value[mode]), revision: String(data.value.updatedAt ?? "") };
}

export async function saveUpcomingResorts(content: UpcomingPageContent, revision: string, publish: boolean) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase.from("site_settings").select("value").eq("key", UPCOMING_SETTING_KEY).single();
  if (error || !data?.value) throw new Error("The calendar could not be loaded. Your edits have not been saved.");
  const nextRevision = new Date().toISOString();
  const value = { ...data.value, draft: content, ...(publish ? { published: content } : {}), updatedAt: nextRevision };
  const result = await supabase.from("site_settings").update({ value }).eq("key", UPCOMING_SETTING_KEY)
    .eq("value->>updatedAt", revision).select("key");
  if (result.error) throw new Error("Saving failed. Your edits are still here; please try again.");
  if (!result.data?.length) throw new Error("Someone else saved this calendar. Open a fresh editor before applying your changes.");
  return nextRevision;
}
