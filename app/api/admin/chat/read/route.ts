import { markChatConversationRead } from "@/lib/services/chat-service";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as { id?: string } | null;
  const id = String(body?.id ?? "");

  if (!id) {
    return Response.json({ error: "Missing chat id." }, { status: 400 });
  }

  await markChatConversationRead(id);
  return Response.json({ ok: true });
}
