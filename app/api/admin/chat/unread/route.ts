import { requireAdminApiSession } from "@/lib/auth/admin-api";
import { getAdminUnreadChatSummary } from "@/lib/services/chat-service";

export async function GET() {
  const session = await requireAdminApiSession();
  if (!session.ok) return session.response;

  const summary = await getAdminUnreadChatSummary();
  return Response.json({ ok: true, ...summary });
}
