import { NextResponse } from "next/server";

import { createConversation } from "@/lib/services/chat-service";
import { chatStartSchema } from "@/lib/validations";

export async function POST(request: Request) {
  try {
    const json = await request.json().catch(() => null);
    const parsed = chatStartSchema.safeParse(json);

    if (!parsed.success) {
      return NextResponse.json({ ok: false, error: "Invalid chat request." }, { status: 400 });
    }

    const result = await createConversation(parsed.data);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("Chat start failed", error);
    return NextResponse.json({ ok: false, error: "Unable to start chat right now." }, { status: 500 });
  }
}
