import { createHmac, timingSafeEqual } from "node:crypto";

import { cookies } from "next/headers";

import { env } from "@/lib/env";

export const RESOURCE_ACCESS_COOKIE = "emv_resource_access";
export const RESOURCE_ACCESS_MAX_AGE_SECONDS = 60 * 60 * 6;

type ResourceAccessPayload = {
  scope: "partner_resources";
  exp: number;
};

function secret() {
  return env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_URL;
}

function base64Url(value: string) {
  return Buffer.from(value).toString("base64url");
}

function sign(value: string) {
  return createHmac("sha256", secret()).update(value).digest("base64url");
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);

  return left.length === right.length && timingSafeEqual(left, right);
}

export function createResourceAccessToken() {
  const payload: ResourceAccessPayload = {
    scope: "partner_resources",
    exp: Date.now() + RESOURCE_ACCESS_MAX_AGE_SECONDS * 1000
  };
  const encoded = base64Url(JSON.stringify(payload));

  return `${encoded}.${sign(encoded)}`;
}

export function verifyResourceAccessToken(token?: string) {
  if (!token) {
    return false;
  }

  const [encoded, signature] = token.split(".");
  if (!encoded || !signature || !safeEqual(sign(encoded), signature)) {
    return false;
  }

  try {
    const payload = JSON.parse(Buffer.from(encoded, "base64url").toString("utf8")) as ResourceAccessPayload;
    return payload.scope === "partner_resources" && payload.exp > Date.now();
  } catch {
    return false;
  }
}

export async function hasResourceAccessSession() {
  const store = await cookies();
  return verifyResourceAccessToken(store.get(RESOURCE_ACCESS_COOKIE)?.value);
}

