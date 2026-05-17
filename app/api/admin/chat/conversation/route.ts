import { requireAdminApiSession } from "@/lib/auth/admin-api";
import { getAdminConversation } from "@/lib/services/chat-service";

export async function GET(request: Request) {
  try {
    const session = await requireAdminApiSession();
    if (!session.ok) return session.response;

    const id = new URL(request.url).searchParams.get("id") ?? "";
    if (!id) {
      return Response.json({ ok: false, error: "Missing chat id." }, { status: 400 });
    }

    const conversation = await getAdminConversation(id);
    if (!conversation) {
      return Response.json({ ok: false, error: "Conversation not found." }, { status: 404 });
    }

    return Response.json({ ok: true, data: conversation });
  } catch (error) {
    console.error("Admin chat conversation load failed", error);
    return Response.json({ ok: false, error: "Unable to load conversation." }, { status: 500 });
  }
}
