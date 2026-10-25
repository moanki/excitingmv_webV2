import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "excitingmv-web-v2",
    environment: process.env.APP_ENV,
    databaseProject: process.env.NEXT_PUBLIC_SUPABASE_URL ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname.split(".")[0] : null,
    timestamp: new Date().toISOString()
  });
}
