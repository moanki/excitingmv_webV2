import { createSupabaseAdminClient } from "@/lib/supabase/admin";

export type ChatConversationRecord = {
  id: string;
  guestName: string;
  email: string;
  subject: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessageRecord[];
};

export type ChatMessageRecord = {
  id: string;
  senderType: "guest" | "partner" | "admin";
  body: string;
  createdAt: string;
};

type ConversationRow = {
  id: string;
  guest_name: string | null;
  email: string | null;
  subject: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

type MessageRow = {
  id: string;
  conversation_id: string;
  sender_type: "guest" | "partner" | "admin";
  body: string;
  created_at: string;
};

function mapMessage(row: MessageRow): ChatMessageRecord {
  return {
    id: row.id,
    senderType: row.sender_type,
    body: row.body,
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
  const { data: conversation, error: conversationError } = await supabase
    .from("chat_conversations")
    .insert({
      guest_name: input.guestName,
      email: input.email,
      subject: input.subject,
      status: "open"
    })
    .select("id")
    .single();

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

  return conversation.id;
}

export async function addChatReply(conversationId: string, body: string, senderType: "guest" | "admin" = "admin") {
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.from("chat_messages").insert({
    conversation_id: conversationId,
    sender_type: senderType,
    body
  });

  if (error) {
    throw new Error(error.message);
  }

  await supabase
    .from("chat_conversations")
    .update({ updated_at: new Date().toISOString(), status: "open" })
    .eq("id", conversationId);
}

export async function getConversation(conversationId: string) {
  const conversations = await listChatConversations();
  return conversations.find((conversation) => conversation.id === conversationId) ?? null;
}
