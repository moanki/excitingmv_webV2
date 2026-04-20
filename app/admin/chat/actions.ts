"use server";

import { revalidatePath } from "next/cache";

import { addChatReply } from "@/lib/services/chat-service";

export async function replyToChatAction(formData: FormData) {
  const conversationId = String(formData.get("conversationId") ?? "");
  const body = String(formData.get("body") ?? "").trim();

  if (!conversationId || !body) {
    return;
  }

  await addChatReply(conversationId, body, "admin");
  revalidatePath("/admin/chat");
}
