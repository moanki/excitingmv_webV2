import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { sendNotificationEmail } from "@/lib/services/email-service";
import { getNotificationRecipient } from "@/lib/services/notification-settings-service";
import { uploadSiteAsset } from "@/lib/storage/site-assets";

export type ChatConversationRecord = {
  id: string;
  guestName: string;
  email: string;
  subject: string;
  status: string;
  attachmentRequested: boolean;
  unreadAdminCount: number;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessageRecord[];
};

export type ChatMessageRecord = {
  id: string;
  senderType: "guest" | "partner" | "admin";
  body: string;
  attachmentUrl: string;
  attachmentName: string;
  createdAt: string;
};

type ConversationRow = {
  id: string;
  guest_name: string | null;
  email: string | null;
  subject: string | null;
  status: string;
  attachment_requested?: boolean | null;
  unread_admin_count?: number | null;
  created_at: string;
  updated_at: string;
};

type MessageRow = {
  id: string;
  conversation_id: string;
  sender_type: "guest" | "partner" | "admin";
  body: string;
  attachment_url?: string | null;
  attachment_name?: string | null;
  created_at: string;
};

function isMissingUnreadColumnError(error: unknown) {
  const message =
    error instanceof Error
      ? error.message
      : typeof error === "object" && error !== null && "message" in error
        ? String((error as { message?: unknown }).message ?? "")
        : "";

  return message.includes("unread_admin_count") || message.includes("last_read_by_admin_at");
}

function mapMessage(row: MessageRow): ChatMessageRecord {
  return {
    id: row.id,
    senderType: row.sender_type,
    body: row.body,
    attachmentUrl: row.attachment_url ?? "",
    attachmentName: row.attachment_name ?? "",
    createdAt: row.created_at
  };
}

export async function listChatConversations() {
  try {
    const supabase = createSupabaseAdminClient();
    const { data: conversations, error: conversationsError } = await supabase
      .from("chat_conversations")
      .select("*")
      .order("updated_at", { ascending: false });

    if (conversationsError) {
      throw new Error(conversationsError.message);
    }

    const ids = ((conversations ?? []) as ConversationRow[]).map((conversation) => conversation.id);

    const { data: messages, error: messageError } = ids.length
      ? await supabase
          .from("chat_messages")
          .select("*")
          .in("conversation_id", ids)
          .order("created_at", { ascending: true })
      : { data: [], error: null };

    if (messageError) {
      throw new Error(messageError.message);
    }

    const messageMap = new Map<string, ChatMessageRecord[]>();
    ((messages ?? []) as MessageRow[]).forEach((message) => {
      const bucket = messageMap.get(message.conversation_id) ?? [];
      bucket.push(mapMessage(message));
      messageMap.set(message.conversation_id, bucket);
    });

    return ((conversations ?? []) as ConversationRow[]).map((conversation) => ({
      id: conversation.id,
      guestName: conversation.guest_name ?? "Guest visitor",
      email: conversation.email ?? "",
      subject: conversation.subject ?? "",
      status: conversation.status,
      attachmentRequested: Boolean(conversation.attachment_requested),
      unreadAdminCount: Number(conversation.unread_admin_count ?? 0),
      createdAt: conversation.created_at,
      updatedAt: conversation.updated_at,
      messages: messageMap.get(conversation.id) ?? []
    }));
  } catch {
    return [];
  }
}

export async function createConversation(input: {
  guestName: string;
  email: string;
  subject: string;
  body: string;
}) {
  const supabase = createSupabaseAdminClient();
  let { data: conversation, error: conversationError } = await supabase
    .from("chat_conversations")
    .insert({
      guest_name: input.guestName,
      email: input.email,
      subject: input.subject,
      status: "open",
      unread_admin_count: 1
    })
    .select("id")
    .single();

  if (conversationError && isMissingUnreadColumnError(conversationError)) {
    const fallback = await supabase
      .from("chat_conversations")
      .insert({
        guest_name: input.guestName,
        email: input.email,
        subject: input.subject,
        status: "open"
      })
      .select("id")
      .single();
    conversation = fallback.data;
    conversationError = fallback.error;
  }

  if (conversationError || !conversation) {
    throw new Error(conversationError?.message ?? "Failed to create chat conversation.");
  }

  const { error: messageError } = await supabase.from("chat_messages").insert({
    conversation_id: conversation.id,
    sender_type: "guest",
    body: input.body
  });

  if (messageError) {
    throw new Error(messageError.message);
  }

  const recipient = await getNotificationRecipient("business");
  void sendNotificationEmail({
    to: recipient,
    subject: "New live chat request",
    html: `
      <h2>New live chat request</h2>
      <p><strong>Name:</strong> ${input.guestName}</p>
      <p><strong>Email:</strong> ${input.email}</p>
      <p><strong>Subject:</strong> ${input.subject}</p>
      <p><strong>Message:</strong> ${input.body}</p>
    `
  });

  return conversation.id;
}

export async function addChatReply(
  conversationId: string,
  body: string,
  senderType: "guest" | "admin" = "admin",
  attachment?: File | null
) {
  const supabase = createSupabaseAdminClient();
  const attachmentUrl = attachment && attachment.size > 0
    ? await uploadSiteAsset(attachment, `chat-attachments/${conversationId}`, "full")
    : "";

  const { error } = await supabase.from("chat_messages").insert({
    conversation_id: conversationId,
    sender_type: senderType,
    body,
    attachment_url: attachmentUrl || null,
    attachment_name: attachmentUrl ? attachment?.name || "Attachment" : null
  });

  if (error) {
    throw new Error(error.message);
  }

  const conversationUpdate: Record<string, string | boolean | number> = {
    updated_at: new Date().toISOString()
  };

  if (senderType === "guest") {
    conversationUpdate.status = "open";
    const { data: conversation } = await supabase
      .from("chat_conversations")
      .select("unread_admin_count")
      .eq("id", conversationId)
      .maybeSingle();
    conversationUpdate.unread_admin_count = Number(
      (conversation as { unread_admin_count?: number | null } | null)?.unread_admin_count ?? 0
    ) + 1;
  }

  if (senderType === "guest" && attachmentUrl) {
    conversationUpdate.attachment_requested = false;
  }

  const { error: updateError } = await supabase.from("chat_conversations").update(conversationUpdate).eq("id", conversationId);

  if (updateError && isMissingUnreadColumnError(updateError)) {
    const { unread_admin_count: _unreadAdminCount, last_read_by_admin_at: _lastReadByAdminAt, ...legacyUpdate } =
      conversationUpdate;
    await supabase.from("chat_conversations").update(legacyUpdate).eq("id", conversationId);
  }
}

export async function getUnreadChatCount() {
  try {
    const supabase = createSupabaseAdminClient();
    const { data, error } = await supabase
      .from("chat_conversations")
      .select("unread_admin_count")
      .gt("unread_admin_count", 0);

    if (error) {
      throw error;
    }

    return ((data ?? []) as Array<{ unread_admin_count?: number | null }>).reduce(
      (total, row) => total + Number(row.unread_admin_count ?? 0),
      0
    );
  } catch {
    return 0;
  }
}

export async function markChatConversationRead(conversationId: string) {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("chat_conversations")
    .update({
      unread_admin_count: 0,
      last_read_by_admin_at: new Date().toISOString()
    })
    .eq("id", conversationId);

  if (error && isMissingUnreadColumnError(error)) {
    return;
  }

  if (error) {
    throw new Error(error.message);
  }
}

export async function getConversation(conversationId: string) {
  const conversations = await listChatConversations();
  return conversations.find((conversation) => conversation.id === conversationId) ?? null;
}

export async function updateChatConversationStatus(conversationId: string, status: "open" | "resolved") {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("chat_conversations")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", conversationId);

  if (error) {
    throw new Error(error.message);
  }
}

export async function requestChatAttachment(conversationId: string) {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("chat_conversations")
    .update({ attachment_requested: true, updated_at: new Date().toISOString() })
    .eq("id", conversationId);

  if (error) {
    throw new Error(error.message);
  }

  await addChatReply(conversationId, "Please attach the requested photo or document here.", "admin");
}
