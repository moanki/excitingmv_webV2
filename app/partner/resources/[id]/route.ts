import { NextRequest, NextResponse } from "next/server";

import { getResourceAccessSession } from "@/lib/partner-resource-access";
import { createProtectedResourceUrl, getPublishedResource } from "@/lib/services/resource-service";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await getResourceAccessSession();
  if (!session) {
    return NextResponse.redirect(new URL("/partner/resources?access=required", request.url));
  }

  const { id } = await params;
  const resource = await getPublishedResource(id, session.agentId);
  if (!resource) {
    return NextResponse.redirect(new URL("/partner/resources?access=missing", request.url));
  }

  const mode = request.nextUrl.searchParams.get("mode") === "download" ? "download" : "view";
  const protectedUrl = await createProtectedResourceUrl(resource, mode);

  return NextResponse.redirect(protectedUrl);
}

