"use client";

import { useEffect, useState } from "react";

type ChatMessage = {
  id: string;
  senderType: "guest" | "partner" | "admin";
  body: string;
  createdAt: string;
};

type ChatConversation = {
  id: string;
  guestName: string;
  email: string;
  subject: string;
  status: string;
  messages: ChatMessage[];
};

const CHAT_STORAGE_KEY = "em_chat_conversation_id";

export function LiveChatWidget() {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [conversationId, setConversationId] = useState<string>("");
  const [conversation, setConversation] = useState<ChatConversation | null>(null);
  const [error, setError] = useState<string>();

  useEffect(() => {
    const existing = window.localStorage.getItem(CHAT_STORAGE_KEY);
    if (existing) {
      setConversationId(existing);
    }
  }, []);

  useEffect(() => {
    if (!conversationId) {
      return;
    }

    let cancelled = false;

    async function loadConversation() {
      const response = await fetch(`/api/chat/${conversationId}`);
      const json = await response.json().catch(() => null);

      if (!cancelled && response.ok && json?.data) {
        setConversation(json.data as ChatConversation);
      }
    }

    void loadConversation();
    const timer = window.setInterval(loadConversation, 5000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [conversationId]);

  async function startConversation(formData: FormData) {
    setPending(true);
    setError(undefined);

    const response = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        guestName: String(formData.get("guestName") ?? ""),
        email: String(formData.get("email") ?? ""),
        subject: String(formData.get("subject") ?? ""),
        body: String(formData.get("body") ?? "")
      })
    });

    const json = await response.json().catch(() => null);
    if (!response.ok || !json?.conversationId) {
      setError(json?.error ?? "Unable to start chat.");
      setPending(false);
      return;
    }

    window.localStorage.setItem(CHAT_STORAGE_KEY, json.conversationId);
    setConversationId(json.conversationId as string);
    setPending(false);
  }

  async function sendReply(formData: FormData) {
    if (!conversationId) {
      return;
    }

    setPending(true);
    const response = await fetch(`/api/chat/${conversationId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        body: String(formData.get("body") ?? "")
      })
    });

    if (response.ok) {
      const refresh = await fetch(`/api/chat/${conversationId}`);
      const json = await refresh.json().catch(() => null);
      setConversation(json?.data ?? null);
    } else {
      setError("Unable to send reply.");
    }

    setPending(false);
  }

  return (
    <div className={`chat-widget ${open ? "is-open" : ""}`}>
      <button className="chat-toggle" type="button" onClick={() => setOpen((value) => !value)}>
        {open ? "Close chat" : "Chat now"}
      </button>
      {open ? (
        <div className="chat-panel">
          <p className="eyebrow">Chat Now</p>
          {conversation ? (
            <div className="stack">
              <div className="chat-messages">
                {conversation.messages.map((message) => (
                  <div
                    className={`chat-message ${message.senderType === "admin" ? "is-admin" : ""}`}
                    key={message.id}
                  >
                    <p className="eyebrow">{message.senderType}</p>
                    <p>{message.body}</p>
                  </div>
                ))}
              </div>
              <form action={sendReply} className="stack">
                <label className="field">
                  Reply
                  <textarea name="body" placeholder="Type your message" />
                </label>
                <button className="button" type="submit" disabled={pending}>
                  {pending ? "Sending..." : "Send Message"}
                </button>
              </form>
            </div>
          ) : (
            <form action={startConversation} className="stack">
              <label className="field">
                Name
                <input name="guestName" />
              </label>
              <label className="field">
                Email
                <input name="email" type="email" />
              </label>
              <label className="field">
                Subject
                <input name="subject" />
              </label>
              <label className="field">
                Message
                <textarea name="body" />
              </label>
              <button className="button" type="submit" disabled={pending}>
                {pending ? "Starting..." : "Start Chat"}
              </button>
            </form>
          )}
          {error ? <p className="auth-error">{error}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
