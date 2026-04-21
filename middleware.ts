import { NextResponse, type NextRequest } from "next/server";

import { ADMIN_LOGIN_PATH, ADMIN_SESSION_COOKIE } from "@/lib/auth/bootstrap-admin";

const ADMIN_PREFIX = "/admin";
const PARTNER_PREFIX = "/partner";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-pathname", pathname);

  if (pathname.startsWith(ADMIN_PREFIX)) {
    const adminSession = request.cookies.get(ADMIN_SESSION_COOKIE)?.value;

    if (pathname === ADMIN_LOGIN_PATH) {
      if (adminSession) {
        return NextResponse.redirect(new URL("/admin", request.url));
      }

      return NextResponse.next();
    }

    if (!adminSession) {
      const loginUrl = new URL(ADMIN_LOGIN_PATH, request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  if (pathname.startsWith(ADMIN_PREFIX) || pathname.startsWith(PARTNER_PREFIX)) {
    const response = NextResponse.next({
      request: {
        headers: requestHeaders
      }
    });
    response.headers.set("x-auth-required", "true");
    return response;
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders
    }
  });
}

export const config = {
  matcher: ["/admin/:path*", "/partner/:path*"]
};
