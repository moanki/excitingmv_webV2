import { revalidatePath } from "next/cache";

import { requestChatAttachment, updateChatConversationStatus } from "@/lib/services/chat-service";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | {
        id?: string;
        action?: "close" | "open" | "request_attachment";
      }
    | null;

  const id = String(body?.id ?? "");
  const action = body?.action;

  if (!id || !action) {
    return Response.json({ error: "Missing chat id or action." }, { status: 400 });
  }

  if (action === "request_attachment") {
    await requestChatAttachment(id);
  } else {
    await updateChatConversationStatus(id, action === "close" ? "resolved" : "open");
  }

  revalidatePath("/admin/chat");
  return Response.json({ ok: true });
}
