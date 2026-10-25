import { contentSecurityPolicy } from "@/lib/security/csp";
import { NextResponse, type NextRequest } from "next/server";

import { ADMIN_LOGIN_PATH } from "@/lib/auth/bootstrap-admin";

const ADMIN_PREFIX = "/admin";
const PARTNER_PREFIX = "/partner";
const ADMIN_API_PREFIX = "/api/admin";

function hasSupabaseSessionCookie(request: NextRequest) {
  return request.cookies.getAll().some((cookie) => cookie.name.startsWith("sb-") && cookie.name.includes("auth-token"));
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);
  const nonce=Buffer.from(crypto.randomUUID()).toString("base64");
  const policy=contentSecurityPolicy(nonce,process.env.NODE_ENV==="development");
  requestHeaders.set("x-nonce",nonce);
  requestHeaders.set("Content-Security-Policy",policy);
  function secure(response:NextResponse) { response.headers.set("Content-Security-Policy",policy); return response; }

  if (pathname.startsWith(ADMIN_API_PREFIX)) {
    if (!hasSupabaseSessionCookie(request)) {
      return secure(NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 }));
    }
  }

  if (pathname.startsWith(ADMIN_PREFIX)) {
    const hasSession = hasSupabaseSessionCookie(request);

    if (pathname === ADMIN_LOGIN_PATH) {
      return secure(NextResponse.next({
        request: {
          headers: requestHeaders
        }
      }));
    }

    if (!hasSession) {
      const loginUrl = new URL(ADMIN_LOGIN_PATH, request.url);
      loginUrl.searchParams.set("next", pathname);
      return secure(NextResponse.redirect(loginUrl));
    }
  }

  if (pathname.startsWith(ADMIN_PREFIX) || pathname.startsWith(PARTNER_PREFIX)) {
    const response = NextResponse.next({
      request: {
        headers: requestHeaders
      }
    });
    response.headers.set("x-auth-required", "true");
    return secure(response);
  }

  return secure(NextResponse.next({
    request: {
      headers: requestHeaders
    }
  }));
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/markitdown_convert).*)"]
};
