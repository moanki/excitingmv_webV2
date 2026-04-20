import { NextResponse } from "next/server";

import { addChatReply, getConversation } from "@/lib/services/chat-service";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const conversation = await getConversation(id);

  if (!conversation) {
    return NextResponse.json({ ok: false, error: "Conversation not found." }, { status: 404 });
  }

  return NextResponse.json({ ok: true, data: conversation });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const json = (await request.json().catch(() => null)) as { body?: string } | null;
  const body = String(json?.body ?? "").trim();

  if (!body) {
    return NextResponse.json({ ok: false, error: "Message body is required." }, { status: 400 });
  }

  await addChatReply(id, body, "guest");
  return NextResponse.json({ ok: true });
}
