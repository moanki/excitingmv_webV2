import { randomBytes } from "crypto";

import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { sendNotificationEmail } from "@/lib/services/email-service";
import { getNotificationRecipient } from "@/lib/services/notification-settings-service";
import { uploadSiteAsset } from "@/lib/storage/site-assets";

export type ChatStatus = "open" | "waiting_admin" | "waiting_guest" | "closed";
export type ChatSenderType = "guest" | "admin" | "system";

export type ChatConversationRecord = {
  id: string;
  guestName: string;
  email: string;
  subject: string;
  status: ChatStatus;
  attachmentRequested: boolean;
  unreadAdminCount: number;
  unreadGuestCount: number;
  lastMessage: string;
  lastMessageAt: string;
  closedAt: string;
  closedBy: "admin" | "guest" | "system" | "";
  createdAt: string;
  updatedAt: string;
  messages: ChatMessageRecord[];
};

export type ChatMessageRecord = {
  id: string;
  senderType: ChatSenderType;
  body: string;
  attachmentUrl: string;
  attachmentName: string;
  attachmentType: string;
  attachmentSize: number;
  createdAt: string;
};

type ConversationRow = {
  id: string;
  guest_name: string | null;
  email: string | null;
  subject: string | null;
  status: ChatStatus | "resolved";
  attachment_requested: boolean | null;
  unread_admin_count: number | null;
  unread_guest_count: number | null;
  last_message: string | null;
  last_message_at: string | null;
  closed_at: string | null;
  closed_by: "admin" | "guest" | "system" | null;
  created_at: string;
  updated_at: string;
};

type MessageRow = {
  id: string;
  conversation_id: string;
  sender_type: ChatSenderType;
  body: string;
  attachment_url: string | null;
  attachment_name: string | null;
  attachment_type: string | null;
  attachment_size: number | null;
  created_at: string;
};

type AttachmentInput = {
  file?: File | null;
  url?: string;
  name?: string;
  type?: string;
  size?: number;
};

const CONVERSATION_COLUMNS =
  "id,guest_name,email,subject,status,attachment_requested,unread_admin_count,unread_guest_count,last_message,last_message_at,closed_at,closed_by,created_at,updated_at";
const MESSAGE_COLUMNS =
  "id,conversation_id,sender_type,body,attachment_url,attachment_name,attachment_type,attachment_size,created_at";

function normalizeStatus(status: ConversationRow["status"]): ChatStatus {
  return status === "resolved" ? "closed" : status;
}

function mapMessage(row: MessageRow): ChatMessageRecord {
  return {
    id: row.id,
    senderType: row.sender_type,
    body: row.body,
    attachmentUrl: row.attachment_url ?? "",
    attachmentName: row.attachment_name ?? "",
    attachmentType: row.attachment_type ?? "",
    attachmentSize: Number(row.attachment_size ?? 0),
    createdAt: row.created_at
  };
}

function mapConversation(row: ConversationRow, messages: ChatMessageRecord[] = []): ChatConversationRecord {
  return {
    id: row.id,
    guestName: row.guest_name ?? "Guest visitor",
    email: row.email ?? "",
    subject: row.subject ?? "",
    status: normalizeStatus(row.status),
    attachmentRequested: Boolean(row.attachment_requested),
    unreadAdminCount: Number(row.unread_admin_count ?? 0),
    unreadGuestCount: Number(row.unread_guest_count ?? 0),
    lastMessage: row.last_message ?? messages.at(-1)?.body ?? "",
    lastMessageAt: row.last_message_at ?? messages.at(-1)?.createdAt ?? row.updated_at,
    closedAt: row.closed_at ?? "",
    closedBy: row.closed_by ?? "",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    messages
  };
}

function createAccessToken() {
  return randomBytes(32).toString("hex");
}

async function uploadAttachment(conversationId: string, attachment?: AttachmentInput | null) {
  if (!attachment?.file || attachment.file.size <= 0) {
    return {
      attachmentUrl: attachment?.url ?? "",
      attachmentName: attachment?.name ?? "",
      attachmentType: attachment?.type ?? "",
      attachmentSize: attachment?.size ?? 0
    };
  }

  const url = await uploadSiteAsset(attachment.file, `chat-attachments/${conversationId}`, "full");

  return {
    attachmentUrl: url,
    attachmentName: attachment.file.name || "Attachment",
    attachmentType: attachment.file.type || "application/octet-stream",
    attachmentSize: attachment.file.size
  };
}

async function getConversationRow(id: string) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("chat_conversations")
    .select(`${CONVERSATION_COLUMNS},access_token`)
    .eq("id", id)
    .maybeSingle();

  if (error) {
    console.error("Failed to load chat conversation", error);
    throw new Error("Unable to load chat conversation.");
  }

  return data as (ConversationRow & { access_token: string }) | null;
}

async function assertVisitorAccess(id: string, accessToken: string) {
  if (!accessToken) {
    return null;
  }

  const conversation = await getConversationRow(id);
  if (!conversation || conversation.access_token !== accessToken) {
    return null;
  }

  return conversation;
}

async function fetchMessages(conversationId: string, limit = 100) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("chat_messages")
    .select(MESSAGE_COLUMNS)
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error) {
    console.error("Failed to load chat messages", error);
    throw new Error("Unable to load chat messages.");
  }

  return ((data ?? []) as MessageRow[]).map(mapMessage);
}

export async function createConversation(input: {
  guestName: string;
  email: string;
  subject?: string;
  body: string;
}) {
  const supabase = createSupabaseAdminClient();
  const now = new Date().toISOString();
  const accessToken = createAccessToken();
  const subject = input.subject?.trim() || "Live chat";

  const { data: conversation, error: conversationError } = await supabase
    .from("chat_conversations")
    .insert({
      guest_name: input.guestName,
      email: input.email,
      subject,
      status: "waiting_admin",
      access_token: accessToken,
      unread_admin_count: 1,
      unread_guest_count: 0,
      last_message: input.body,
      last_message_at: now,
      updated_at: now
    })
    .select("id")
    .single();

  if (conversationError || !conversation) {
    console.error("Failed to create chat conversation", conversationError);
    throw new Error("Unable to start chat.");
  }

  const { error: messageError } = await supabase.from("chat_messages").insert({
    conversation_id: conversation.id,
    sender_type: "guest",
    body: input.body
  });

  if (messageError) {
    console.error("Failed to create first chat message", messageError);
    throw new Error("Unable to save chat message.");
  }

  const recipient = await getNotificationRecipient("business");
  void sendNotificationEmail({
    to: recipient,
    subject: "New live chat request",
    html: `
      <h2>New live chat request</h2>
      <p><strong>Name:</strong> ${input.guestName}</p>
      <p><strong>Email:</strong> ${input.email}</p>
      <p><strong>Subject:</strong> ${subject}</p>
      <p><strong>Message:</strong> ${input.body}</p>
    `
  }).catch((error) => console.warn("Chat email notification failed", error));

  return { conversationId: conversation.id as string, accessToken };
}

export async function getConversationForVisitor(id: string, accessToken: string) {
  const conversation = await assertVisitorAccess(id, accessToken);
  if (!conversation) {
    return null;
  }

  const messages = await fetchMessages(id);
  return mapConversation(conversation, messages);
}

export async function getAdminConversation(id: string) {
  const conversation = await getConversationRow(id);
  if (!conversation) {
    return null;
  }

  const messages = await fetchMessages(id, 200);
  return mapConversation(conversation, messages);
}

export async function listAdminChatConversations({ limit = 50 }: { limit?: number } = {}) {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("chat_conversations")
    .select(CONVERSATION_COLUMNS)
    .order("last_message_at", { ascending: false, nullsFirst: false })
    .order("updated_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Failed to list chat conversations", error);
    return [];
  }

  return ((data ?? []) as ConversationRow[]).map((row) => mapConversation(row));
}

export const listChatConversations = listAdminChatConversations;

async function addMessage(input: {
  conversationId: string;
  senderType: ChatSenderType;
  body: string;
  attachment?: AttachmentInput | null;
}) {
  const supabase = createSupabaseAdminClient();
  const attachment = await uploadAttachment(input.conversationId, input.attachment);
  const messageBody = input.body.trim() || (attachment.attachmentName ? `Attachment: ${attachment.attachmentName}` : "");

  const { data, error } = await supabase
    .from("chat_messages")
    .insert({
      conversation_id: input.conversationId,
      sender_type: input.senderType,
      body: messageBody,
      attachment_url: attachment.attachmentUrl || null,
      attachment_name: attachment.attachmentName || null,
      attachment_type: attachment.attachmentType || null,
      attachment_size: attachment.attachmentSize || null
    })
    .select("id")
    .single();

  if (error) {
    console.error("Failed to add chat message", error);
    throw new Error("Unable to save chat message.");
  }

  return { id: data.id as string, body: messageBody };
}

export async function addGuestMessage(
  conversationId: string,
  accessToken: string,
  body: string,
  attachment?: AttachmentInput | null
) {
  const conversation = await assertVisitorAccess(conversationId, accessToken);
  if (!conversation) {
    return { ok: false as const, status: 403, error: "Invalid chat session." };
  }

  if (normalizeStatus(conversation.status) === "closed") {
    return { ok: false as const, status: 409, error: "This chat has ended. Please start a new chat." };
  }

  const message = await addMessage({ conversationId, senderType: "guest", body, attachment });
  const supabase = createSupabaseAdminClient();
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("chat_conversations")
    .update({
      status: "waiting_admin",
      unread_admin_count: Number(conversation.unread_admin_count ?? 0) + 1,
      last_message: message.body,
      last_message_at: now,
      updated_at: now,
      attachment_requested: attachment?.file ? false : conversation.attachment_requested
    })
    .eq("id", conversationId);

  if (error) {
    console.error("Failed to update chat after guest message", error);
    throw new Error("Unable to update chat.");
  }

  return { ok: true as const };
}

export async function addAdminReply(conversationId: string, body: string, attachment?: AttachmentInput | null) {
  const conversation = await getConversationRow(conversationId);
  if (!conversation) {
    return { ok: false as const, status: 404, error: "Conversation not found." };
  }

  if (normalizeStatus(conversation.status) === "closed") {
    return { ok: false as const, status: 409, error: "This chat is closed. Start a new conversation if needed." };
  }

  const message = await addMessage({ conversationId, senderType: "admin", body, attachment });
  const supabase = createSupabaseAdminClient();
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("chat_conversations")
    .update({
      status: "waiting_guest",
      unread_guest_count: Number(conversation.unread_guest_count ?? 0) + 1,
      last_message: message.body,
      last_message_at: now,
      updated_at: now
    })
    .eq("id", conversationId);

  if (error) {
    console.error("Failed to update chat after admin reply", error);
    throw new Error("Unable to update chat.");
  }

  return { ok: true as const };
}

export async function addChatReply(
  conversationId: string,
  body: string,
  senderType: "guest" | "admin" = "admin",
  attachment?: File | null
) {
  if (senderType === "guest") {
    throw new Error("Guest replies require visitor access token.");
  }
  const result = await addAdminReply(conversationId, body, { file: attachment });
  if (!result.ok) throw new Error(result.error);
}

export async function closeConversation(conversationId: string, closedBy: "admin" | "guest" | "system") {
  const conversation = await getConversationRow(conversationId);
  if (!conversation) {
    return { ok: false as const, status: 404, error: "Conversation not found." };
  }

  const supabase = createSupabaseAdminClient();
  const now = new Date().toISOString();
  const systemBody =
    closedBy === "admin" ? "This chat was closed by the support team." : "The visitor ended this chat.";

  const { error } = await supabase
    .from("chat_conversations")
    .update({
      status: "closed",
      closed_by: closedBy,
      closed_at: now,
      unread_admin_count: 0,
      last_message: systemBody,
      last_message_at: now,
      updated_at: now
    })
    .eq("id", conversationId);

  if (error) {
    console.error("Failed to close chat", error);
    throw new Error("Unable to close chat.");
  }

  await addMessage({ conversationId, senderType: "system", body: systemBody });
  return { ok: true as const };
}

export async function closeConversationForVisitor(conversationId: string, accessToken: string) {
  const conversation = await assertVisitorAccess(conversationId, accessToken);
  if (!conversation) {
    return { ok: false as const, status: 403, error: "Invalid chat session." };
  }

  return closeConversation(conversationId, "guest");
}

export async function reopenConversation(conversationId: string) {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase
    .from("chat_conversations")
    .update({
      status: "waiting_guest",
      closed_at: null,
      closed_by: null,
      updated_at: new Date().toISOString()
    })
    .eq("id", conversationId);

  if (error) {
    console.error("Failed to reopen chat", error);
    throw new Error("Unable to reopen chat.");
  }
}

export async function markConversationReadByAdmin(conversationId: string) {
  const supabase = createSupabaseAdminClient();
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("chat_conversations")
    .update({
      unread_admin_count: 0,
      last_read_by_admin_at: now,
      updated_at: now
    })
    .eq("id", conversationId);

  if (error) {
    console.error("Failed to mark chat read", error);
    throw new Error("Unable to mark chat read.");
  }

  await supabase
    .from("chat_messages")
    .update({ read_by_admin_at: now })
    .eq("conversation_id", conversationId)
    .eq("sender_type", "guest")
    .is("read_by_admin_at", null);
}

export const markChatConversationRead = markConversationReadByAdmin;

export async function markConversationReadByGuest(conversationId: string, accessToken: string) {
  const conversation = await assertVisitorAccess(conversationId, accessToken);
  if (!conversation) {
    return;
  }

  const supabase = createSupabaseAdminClient();
  const now = new Date().toISOString();
  await supabase
    .from("chat_conversations")
    .update({ unread_guest_count: 0, last_read_by_guest_at: now, updated_at: now })
    .eq("id", conversationId);
}

export async function requestChatAttachment(conversationId: string) {
  const conversation = await getConversationRow(conversationId);
  if (!conversation) {
    return { ok: false as const, status: 404, error: "Conversation not found." };
  }
  if (normalizeStatus(conversation.status) === "closed") {
    return { ok: false as const, status: 409, error: "This chat is closed." };
  }

  const body = "Please attach the requested photo or document here.";
  await addMessage({ conversationId, senderType: "system", body });
  const supabase = createSupabaseAdminClient();
  const now = new Date().toISOString();
  const { error } = await supabase
    .from("chat_conversations")
    .update({
      attachment_requested: true,
      status: "waiting_guest",
      unread_guest_count: Number(conversation.unread_guest_count ?? 0) + 1,
      last_message: body,
      last_message_at: now,
      updated_at: now
    })
    .eq("id", conversationId);

  if (error) {
    console.error("Failed to request chat attachment", error);
    throw new Error("Unable to request attachment.");
  }

  return { ok: true as const };
}

export async function getAdminUnreadChatSummary() {
  const supabase = createSupabaseAdminClient();
  const { data, error } = await supabase
    .from("chat_conversations")
    .select("id,unread_admin_count,last_message_at")
    .gt("unread_admin_count", 0)
    .order("last_message_at", { ascending: false })
    .limit(25);

  if (error) {
    console.error("Failed to get unread chat summary", error);
    return { count: 0, latestMessageId: null, latestConversationId: null };
  }

  const rows = (data ?? []) as Array<{ id: string; unread_admin_count: number | null; last_message_at: string | null }>;
  return {
    count: rows.reduce((total, row) => total + Number(row.unread_admin_count ?? 0), 0),
    latestMessageId: rows[0]?.last_message_at ?? null,
    latestConversationId: rows[0]?.id ?? null
  };
}

export async function getUnreadChatCount() {
  return (await getAdminUnreadChatSummary()).count;
}

export async function getConversation(conversationId: string) {
  return getAdminConversation(conversationId);
}

export async function updateChatConversationStatus(conversationId: string, status: "open" | "resolved" | "closed") {
  if (status === "resolved" || status === "closed") {
    const result = await closeConversation(conversationId, "admin");
    if (!result.ok) throw new Error(result.error);
    return;
  }

  await reopenConversation(conversationId);
}
