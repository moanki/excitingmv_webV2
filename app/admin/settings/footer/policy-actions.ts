"use server";

import { revalidatePath } from "next/cache";
import { defaultPolicies, isPolicyId, policyFromForm, policyPaths } from "@/lib/site-policies";
import { publishSiteSetting, saveSiteSettingDraft } from "@/lib/site-content";
import type { ActionState } from "@/components/admin/action-feedback";

export async function savePolicyAction(_: ActionState, formData: FormData): Promise<ActionState> {
  try {
    const id = formData.get("policyId");
    if (!isPolicyId(id)) throw new Error("Unknown policy.");
    const value = policyFromForm(formData, id);
    const key = `site.policy.${id}`;
    await saveSiteSettingDraft(key, defaultPolicies[id], value);
    const publish = formData.get("intent") === "publish";
    if (publish) await publishSiteSetting(key, defaultPolicies[id]);
    revalidatePath(`/admin/settings/footer${policyPaths[id]}`);
    if (publish) {
      revalidatePath(policyPaths[id]);
      revalidatePath("/", "layout");
    }
    return { message: `${value.title} ${publish ? "published" : "draft saved"}.` };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not save the policy." };
  }
}
