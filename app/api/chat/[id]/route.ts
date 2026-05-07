import { NextResponse } from "next/server";

import { addChatReply, getConversation, updateChatConversationStatus } from "@/lib/services/chat-service";

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
  const contentType = request.headers.get("content-type") ?? "";
  let body = "";
  let attachment: File | null = null;

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    body = String(formData.get("body") ?? "").trim();
    const file = formData.get("attachment");
    attachment = file instanceof File ? file : null;
  } else {
    const json = (await request.json().catch(() => null)) as { body?: string } | null;
    body = String(json?.body ?? "").trim();
  }

  if (!body && !attachment) {
    return NextResponse.json({ ok: false, error: "Message or attachment is required." }, { status: 400 });
  }

  await addChatReply(id, body || "Attachment uploaded.", "guest", attachment);
  return NextResponse.json({ ok: true });
}

export async function PATCH(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await updateChatConversationStatus(id, "resolved");
  return NextResponse.json({ ok: true });
}
