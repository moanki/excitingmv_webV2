import { NextResponse, type NextRequest } from "next/server";

import { ADMIN_LOGIN_PATH } from "@/lib/auth/bootstrap-admin";

export function proxy(request: NextRequest) {
  if (request.method !== "GET" && request.method !== "HEAD") {
    return NextResponse.json(
      { ok: false, error: "Submissions are disabled in this read-only preview." },
      { status: 405, headers: { Allow: "GET, HEAD" } },
    );
  }

  const { pathname } = request.nextUrl;
  if (pathname.startsWith("/api/admin")) {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }
  if (pathname.startsWith("/admin") && pathname !== ADMIN_LOGIN_PATH) {
    const loginUrl = new URL(ADMIN_LOGIN_PATH, request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.delete("cookie");
  requestHeaders.delete("x-pathname");
  const partnerRoute = pathname.startsWith("/partner");
  if (partnerRoute || pathname === ADMIN_LOGIN_PATH) requestHeaders.set("x-pathname", pathname);
  const response = NextResponse.next({ request: { headers: requestHeaders } });
  if (partnerRoute) response.headers.set("x-auth-required", "true");
  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
