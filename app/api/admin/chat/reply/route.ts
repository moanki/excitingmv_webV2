import { revalidatePath } from "next/cache";

import { addChatReply } from "@/lib/services/chat-service";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | {
        id?: string;
        message?: string;
      }
    | null;

  const id = String(body?.id ?? "");
  const message = String(body?.message ?? "").trim();

  if (!id || !message) {
    return Response.json({ error: "Missing chat id or message." }, { status: 400 });
  }

  await addChatReply(id, message, "admin");
  revalidatePath("/admin/chat");

  return Response.json({ ok: true });
}
