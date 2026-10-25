"use server";

import { revalidatePath } from "next/cache";
import { cookies, headers } from "next/headers";
import { checkRateLimit, getClientIp } from "@/lib/security/rate-limit";

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
    const username = String(formData.get("resourceUsername") ?? "").trim().toLowerCase();
    if (!password || password.length > 256 || !username || username.length > 254) return { ok: false, error: "Enter your partner email and password." };
    const ip = getClientIp({ headers: await headers() });
    const limits = await Promise.all([
      checkRateLimit({key: `resource-ip:${ip}`,limit:10,windowMs:15*60*1000}),
      checkRateLimit({key: `resource-account:${username}`,limit:5,windowMs:15*60*1000})
    ]);
    if (limits.some(limit => !limit.allowed)) return {ok:false,error:"Too many attempts. Please try again later."};
    const partner = await validateActiveResourcePassword(password, username);
    if (!partner) {
      return {
        ok: false,
        error: "Incorrect password. Please check the password provided by our team."
      };
    }

    const store = await cookies();
    store.set(RESOURCE_ACCESS_COOKIE, "", { path:"/partner/resources", maxAge:0 });
    store.set(RESOURCE_ACCESS_COOKIE, await createResourceAccessToken(partner.agentId, partner.accessVersion), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/partner",
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

