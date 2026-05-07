import { revalidatePath } from "next/cache";

import { addChatReply } from "@/lib/services/chat-service";

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  let id = "";
  let message = "";
  let attachment: File | null = null;

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    id = String(formData.get("id") ?? "");
    message = String(formData.get("message") ?? "").trim();
    const file = formData.get("attachment");
    attachment = file instanceof File ? file : null;
  } else {
    const body = (await request.json().catch(() => null)) as
      | {
          id?: string;
          message?: string;
        }
      | null;
    id = String(body?.id ?? "");
    message = String(body?.message ?? "").trim();
  }

  if (!id || (!message && !attachment)) {
    return Response.json({ error: "Missing chat id or message." }, { status: 400 });
  }

  await addChatReply(id, message || "Attachment uploaded.", "admin", attachment);
  revalidatePath("/admin/chat");

  return Response.json({ ok: true });
}
