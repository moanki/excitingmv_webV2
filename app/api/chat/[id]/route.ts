import { NextResponse } from "next/server";

import {
  addGuestMessage,
  closeConversationForVisitor,
  getConversationForVisitor,
  markConversationReadByGuest
} from "@/lib/services/chat-service";

function tokenFromRequest(request: Request) {
  const url = new URL(request.url);
  return request.headers.get("x-chat-access-token") ?? url.searchParams.get("token") ?? "";
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const conversation = await getConversationForVisitor(id, tokenFromRequest(request));

    if (!conversation) {
      return NextResponse.json({ ok: false, error: "Invalid chat session." }, { status: 403 });
    }

    await markConversationReadByGuest(id, tokenFromRequest(request));
    return NextResponse.json({ ok: true, data: conversation });
  } catch (error) {
    console.error("Visitor chat load failed", error);
    return NextResponse.json({ ok: false, error: "Unable to load chat." }, { status: 500 });
  }
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const token = tokenFromRequest(request);
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

    if (body.length > 4000) {
      return NextResponse.json({ ok: false, error: "Message is too long." }, { status: 400 });
    }

    if (!body && !attachment) {
      return NextResponse.json({ ok: false, error: "Message or attachment is required." }, { status: 400 });
    }

    const result = await addGuestMessage(id, token, body || "Attachment uploaded.", { file: attachment });
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Visitor chat reply failed", error);
    return NextResponse.json({ ok: false, error: "Unable to send message." }, { status: 500 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const result = await closeConversationForVisitor(id, tokenFromRequest(request));

    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.error }, { status: result.status });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Visitor chat close failed", error);
    return NextResponse.json({ ok: false, error: "Unable to close chat." }, { status: 500 });
  }
}
