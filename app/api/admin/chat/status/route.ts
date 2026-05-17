import { revalidatePath } from "next/cache";

import { requireAdminApiSession } from "@/lib/auth/admin-api";
import { closeConversation, reopenConversation, requestChatAttachment } from "@/lib/services/chat-service";

export async function POST(request: Request) {
  try {
    const session = await requireAdminApiSession();
    if (!session.ok) return session.response;

    const body = (await request.json().catch(() => null)) as
      | {
          id?: string;
          action?: "close" | "open" | "reopen" | "request_attachment";
        }
      | null;

    const id = String(body?.id ?? "");
    const action = body?.action;

    if (!id || !action) {
      return Response.json({ ok: false, error: "Missing chat id or action." }, { status: 400 });
    }

    const result =
      action === "request_attachment"
        ? await requestChatAttachment(id)
        : action === "close"
          ? await closeConversation(id, "admin")
          : await reopenConversation(id).then(() => ({ ok: true as const }));

    if (!result.ok) {
      return Response.json({ ok: false, error: result.error }, { status: result.status });
    }

    revalidatePath("/admin/chat");
    return Response.json({ ok: true });
  } catch (error) {
    console.error("Admin chat status failed", error);
    return Response.json({ ok: false, error: "Unable to update chat status." }, { status: 500 });
  }
}
