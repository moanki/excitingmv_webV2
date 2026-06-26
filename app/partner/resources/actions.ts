"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

import {
  createResourceAccessToken,
  RESOURCE_ACCESS_COOKIE,
  RESOURCE_ACCESS_MAX_AGE_SECONDS
} from "@/lib/partner-resource-access";
import { validateActiveResourcePassword } from "@/lib/services/resource-permission-service";

export type ResourceUnlockState = {
  ok: boolean;
  error?: string;
};

export async function unlockResourcesAction(
  _previousState: ResourceUnlockState,
  formData: FormData
): Promise<ResourceUnlockState> {
  const password = String(formData.get("resourcePassword") ?? "").trim();

  try {
    const isValid = await validateActiveResourcePassword(password);
    if (!isValid) {
      return {
        ok: false,
        error: "Incorrect password. Please check the password provided by our team."
      };
    }

    const store = await cookies();
    store.set(RESOURCE_ACCESS_COOKIE, createResourceAccessToken(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/partner/resources",
      maxAge: RESOURCE_ACCESS_MAX_AGE_SECONDS
    });

    revalidatePath("/partner/resources");

    return { ok: true };
  } catch {
    return {
      ok: false,
      error: "Incorrect password. Please check the password provided by our team."
    };
  }
}

