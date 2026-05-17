import { requireAdminApiSession } from "@/lib/auth/admin-api";
import { markChatConversationRead } from "@/lib/services/chat-service";

export async function POST(request: Request) {
  try {
    const session = await requireAdminApiSession();
    if (!session.ok) return session.response;

    const body = (await request.json().catch(() => null)) as { id?: string } | null;
    const id = String(body?.id ?? "");

    if (!id) {
      return Response.json({ ok: false, error: "Missing chat id." }, { status: 400 });
    }

    await markChatConversationRead(id);
    return Response.json({ ok: true });
  } catch (error) {
    console.error("Admin chat read failed", error);
    return Response.json({ ok: false, error: "Unable to mark chat as read." }, { status: 500 });
  }
}
