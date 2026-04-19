import { NextResponse, type NextRequest } from "next/server";

const ADMIN_PREFIX = "/admin";
const PARTNER_PREFIX = "/partner";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith(ADMIN_PREFIX) || pathname.startsWith(PARTNER_PREFIX)) {
    const response = NextResponse.next();
    response.headers.set("x-auth-required", "true");
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/partner/:path*"]
};
