import { getUnreadChatCount } from "@/lib/services/chat-service";

export async function GET() {
  const count = await getUnreadChatCount();
  return Response.json({ count });
}
