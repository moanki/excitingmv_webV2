"use client";

import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";

type ChatMessage = {
  id: string;
  senderType: "guest" | "admin" | "system";
  body: string;
  attachmentUrl: string;
  attachmentName: string;
  createdAt: string;
};

type ChatConversation = {
  id: string;
  guestName: string;
  email: string;
  subject: string;
  status: "open" | "waiting_admin" | "waiting_guest" | "closed";
  attachmentRequested: boolean;
  unreadGuestCount: number;
  closedAt: string;
  closedBy: string;
  messages: ChatMessage[];
};

const CHAT_STORAGE_KEY = "em_chat_conversation_id";
const CHAT_TOKEN_STORAGE_KEY = "em_chat_access_token";

export function LiveChatWidget() {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [conversationId, setConversationId] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [conversation, setConversation] = useState<ChatConversation | null>(null);
  const [error, setError] = useState("");
  const [newReplyBadge, setNewReplyBadge] = useState(0);
  const [selectedAttachment, setSelectedAttachment] = useState("");
  const messagesRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const existingId = window.localStorage.getItem(CHAT_STORAGE_KEY) ?? "";
    const existingToken = window.localStorage.getItem(CHAT_TOKEN_STORAGE_KEY) ?? "";

    if (existingId && existingToken) {
      setConversationId(existingId);
      setAccessToken(existingToken);
    }
  }, []);

  useEffect(() => {
    if (!conversationId || !accessToken) {
      return;
    }

    let cancelled = false;
    let lastAdminMessageCount = 0;

    async function loadConversation() {
      const response = await fetch(`/api/chat/${conversationId}?token=${encodeURIComponent(accessToken)}`, {
        cache: "no-store"
      });
      const json = await response.json().catch(() => null);

      if (cancelled) return;

      if (response.ok && json?.data) {
        const nextConversation = json.data as ChatConversation;
        const adminMessageCount = nextConversation.messages.filter((message) => message.senderType === "admin").length;
        if (!open && adminMessageCount > lastAdminMessageCount) {
          setNewReplyBadge((count) => count + (adminMessageCount - lastAdminMessageCount));
        }
        lastAdminMessageCount = adminMessageCount;
        setConversation(nextConversation);

        if (nextConversation.status === "closed") {
          window.localStorage.removeItem(CHAT_STORAGE_KEY);
          window.localStorage.removeItem(CHAT_TOKEN_STORAGE_KEY);
        }
      } else if (response.status === 403 || response.status === 404) {
        window.localStorage.removeItem(CHAT_STORAGE_KEY);
        window.localStorage.removeItem(CHAT_TOKEN_STORAGE_KEY);
        setConversationId("");
        setAccessToken("");
        setConversation(null);
      }
    }

    void loadConversation();
    const timer = window.setInterval(loadConversation, 4000);
    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [accessToken, conversationId, open]);

  useEffect(() => {
    messagesRef.current?.scrollTo({ top: messagesRef.current.scrollHeight, behavior: "smooth" });
  }, [conversation?.messages.length, open]);

  async function startConversation(formData: FormData) {
    setPending(true);
    setError("");

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
    setPending(false);

    if (!response.ok || !json?.conversationId || !json?.accessToken) {
      setError(json?.error ?? "Unable to start chat.");
      return;
    }

    window.localStorage.setItem(CHAT_STORAGE_KEY, json.conversationId);
    window.localStorage.setItem(CHAT_TOKEN_STORAGE_KEY, json.accessToken);
    setConversationId(json.conversationId);
    setAccessToken(json.accessToken);
    setOpen(true);
  }

  async function sendReply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!conversationId || !accessToken || conversation?.status === "closed") return;

    const form = event.currentTarget;
    const formData = new FormData(form);
    const attachment = formData.get("attachment");
    const hasAttachment = attachment instanceof File && attachment.size > 0;
    const body = String(formData.get("body") ?? "").trim();

    if (!body && !hasAttachment) return;

    setPending(true);
    setError("");

    const response = hasAttachment
      ? await fetch(`/api/chat/${conversationId}`, {
          method: "POST",
          headers: { "x-chat-access-token": accessToken },
          body: formData
        })
      : await fetch(`/api/chat/${conversationId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-chat-access-token": accessToken },
          body: JSON.stringify({ body })
        });

    const json = await response.json().catch(() => null);
    setPending(false);

    if (!response.ok) {
      setError(json?.error ?? "Unable to send message.");
      if (response.status === 409) {
        window.localStorage.removeItem(CHAT_STORAGE_KEY);
        window.localStorage.removeItem(CHAT_TOKEN_STORAGE_KEY);
      }
      return;
    }

    form.reset();
    setSelectedAttachment("");
    await refreshConversation();
  }

  async function refreshConversation() {
    if (!conversationId || !accessToken) return;
    const response = await fetch(`/api/chat/${conversationId}?token=${encodeURIComponent(accessToken)}`, {
      cache: "no-store"
    });
    const json = await response.json().catch(() => null);
    if (response.ok && json?.data) setConversation(json.data as ChatConversation);
  }

  async function endChat() {
    if (!conversationId || !accessToken) return;
    await fetch(`/api/chat/${conversationId}`, {
      method: "PATCH",
      headers: { "x-chat-access-token": accessToken }
    }).catch(() => null);
    await refreshConversation();
  }

  function startNewChat() {
    window.localStorage.removeItem(CHAT_STORAGE_KEY);
    window.localStorage.removeItem(CHAT_TOKEN_STORAGE_KEY);
    setConversationId("");
    setAccessToken("");
    setConversation(null);
    setError("");
    setNewReplyBadge(0);
  }

  function submitOnEnter(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  }

  const isClosed = conversation?.status === "closed";

  return (
    <div className={`chat-widget ${open ? "is-open" : ""}`}>
      <div className="chat-widget__launcher">
        {!open && <span className="chat-widget__label">{newReplyBadge ? "New reply" : "Live Chat"}</span>}
        <button
          className="chat-toggle"
          type="button"
          onClick={() => {
            setOpen((value) => !value);
            setNewReplyBadge(0);
          }}
          aria-label={open ? "Minimize live chat" : "Chat with Exciting Maldives support"}
        >
          {newReplyBadge && !open ? <span className="chat-widget__badge">{newReplyBadge > 9 ? "9+" : newReplyBadge}</span> : null}
          {open ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M20 2H4a2 2 0 00-2 2v18l4-4h14a2 2 0 002-2V4a2 2 0 00-2-2z" />
            </svg>
          )}
        </button>
      </div>

      {open ? (
        <div className="chat-panel">
          <div className="chat-panel__header">
            <div>
              <p className="eyebrow">Exciting Maldives Support</p>
              <strong>{isClosed ? "Chat ended" : conversation ? "We'll reply shortly" : "Hi, how can we help?"}</strong>
            </div>
            {conversation && !isClosed ? (
              <button className="admin-btn admin-btn--ghost" type="button" onClick={endChat}>
                End chat
              </button>
            ) : null}
          </div>

          {conversation ? (
            <div className="stack">
              <div className="chat-messages" ref={messagesRef}>
                {conversation.messages.map((message) => (
                  <div
                    className={`chat-message ${message.senderType === "admin" ? "is-admin" : ""} ${message.senderType === "system" ? "is-system" : ""}`}
                    key={message.id}
                  >
                    <p className="eyebrow">{message.senderType === "admin" ? "Support" : message.senderType}</p>
                    <p>{message.body}</p>
                    <small>{new Date(message.createdAt).toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" })}</small>
                    {message.attachmentUrl ? (
                      <a href={message.attachmentUrl} target="_blank" rel="noreferrer">
                        {message.attachmentName || "View attachment"}
                      </a>
                    ) : null}
                  </div>
                ))}
              </div>

              {isClosed ? (
                <div className="chat-ended-card">
                  <strong>This chat has ended.</strong>
                  <p>Start a new chat if you need more help.</p>
                  <button className="button" type="button" onClick={startNewChat}>
                    Start New Chat
                  </button>
                </div>
              ) : (
                <form onSubmit={sendReply} className="stack">
                  <label className="field">
                    Reply
                    <textarea name="body" placeholder="Type your message" onKeyDown={submitOnEnter} />
                  </label>
                  {conversation.attachmentRequested ? (
                    <label className="field">
                      Attachment requested
                      <input
                        name="attachment"
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/svg+xml,application/pdf"
                        onChange={(event) => setSelectedAttachment(event.target.files?.[0]?.name ?? "")}
                      />
                      {selectedAttachment ? <span className="field__help">{selectedAttachment}</span> : null}
                    </label>
                  ) : null}
                  <button className="button" type="submit" disabled={pending}>
                    {pending ? "Sending..." : "Send Message"}
                  </button>
                </form>
              )}
            </div>
          ) : (
            <form action={startConversation} className="stack">
              <p className="muted">Send us a message and our destination team will reply here.</p>
              <label className="field">
                Name
                <input name="guestName" required maxLength={120} />
              </label>
              <label className="field">
                Email
                <input name="email" type="email" required maxLength={180} />
              </label>
              <label className="field">
                Subject
                <input name="subject" maxLength={200} />
              </label>
              <label className="field">
                Message
                <textarea name="body" required maxLength={4000} />
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
