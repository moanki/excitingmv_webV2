"use client";

import { Fragment, useEffect, useMemo, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { Download, Paperclip, RotateCcw, Send, Upload, XCircle } from "lucide-react";

import type { ChatConversationRecord } from "@/lib/services/chat-service";

function formatConversation(conversation: ChatConversationRecord) {
  const lines = [
    `Guest: ${conversation.guestName}`,
    `Email: ${conversation.email}`,
    `Subject: ${conversation.subject}`,
    `Status: ${conversation.status}`,
    "",
    ...conversation.messages.map(
      (message) =>
        `[${new Date(message.createdAt).toLocaleString("en")}] ${message.senderType}: ${message.body}${
          message.attachmentUrl ? `\nAttachment: ${message.attachmentUrl}` : ""
        }`
    )
  ];

  return lines.join("\n");
}

export function ChatInbox({ conversations }: { conversations: ChatConversationRecord[] }) {
  const [items, setItems] = useState(conversations);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "open" | "unread" | "closed">("all");
  const [openId, setOpenId] = useState<string | null>(conversations[0]?.id ?? null);
  const [modalConversation, setModalConversation] = useState<ChatConversationRecord | null>(null);
  const [pendingAction, setPendingAction] = useState("");
  const [selectedAttachment, setSelectedAttachment] = useState<Record<string, string>>({});
  const [error, setError] = useState("");
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    if (openId) {
      void markRead(openId);
      void refreshConversation(openId);
    }
  }, [openId]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return items.filter((conversation) => {
      const isClosed = conversation.status === "closed";
      const matchesFilter =
        filter === "all" ||
        (filter === "closed" && isClosed) ||
        (filter === "open" && !isClosed) ||
        (filter === "unread" && conversation.unreadAdminCount > 0);
      const haystack = [
        conversation.guestName,
        conversation.email,
        conversation.subject,
        conversation.status,
        conversation.lastMessage,
        ...conversation.messages.map((message) => message.body)
      ]
        .join(" ")
        .toLowerCase();

      return matchesFilter && (!normalized || haystack.includes(normalized));
    });
  }, [filter, items, query]);

  async function refreshConversation(id: string) {
    const refresh = await fetch(`/api/admin/chat/conversation?id=${encodeURIComponent(id)}`, { cache: "no-store" });
    const payload = (await refresh.json().catch(() => null)) as { data?: ChatConversationRecord } | null;

    if (refresh.ok && payload?.data) {
      setItems((current) => current.map((item) => (item.id === id ? payload.data as ChatConversationRecord : item)));
      return payload.data;
    }

    return null;
  }

  async function markRead(id: string) {
    await fetch("/api/admin/chat/read", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id })
    }).catch(() => null);
    setItems((current) =>
      current.map((item) => (item.id === id ? { ...item, unreadAdminCount: 0 } : item))
    );
  }

  async function runAction(id: string, action: "close" | "open" | "request_attachment") {
    if (action === "close" && !window.confirm("Close this chat? The visitor will not be able to reply to this session again.")) {
      return;
    }

    setPendingAction(`${action}:${id}`);
    setError("");
    const response = await fetch("/api/admin/chat/status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action })
    });
    setPendingAction("");

    if (response.ok) {
      await refreshConversation(id);
    } else {
      const payload = await response.json().catch(() => null);
      setError(payload?.error ?? "Unable to update chat.");
    }
  }

  async function sendReply(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const id = String(formData.get("conversationId") ?? "");
    const message = String(formData.get("message") ?? "").trim();
    const attachment = formData.get("attachment");
    const hasAttachment = attachment instanceof File && attachment.size > 0;

    if (!id || (!message && !hasAttachment)) {
      return;
    }

    setPendingAction(`reply:${id}`);
    setError("");
    const response = hasAttachment
      ? await fetch("/api/admin/chat/reply", {
          method: "POST",
          body: formData
        })
      : await fetch("/api/admin/chat/reply", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ id, message })
        });
    setPendingAction("");

    if (response.ok) {
      form.reset();
      setSelectedAttachment((current) => ({ ...current, [id]: "" }));
      await refreshConversation(id);
    } else {
      const payload = await response.json().catch(() => null);
      setError(payload?.error ?? "Unable to send reply.");
    }
    setPendingAction("");
  }

  function submitOnEnter(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      event.currentTarget.form?.requestSubmit();
    }
  }

  function downloadConversation(conversation: ChatConversationRecord) {
    const blob = new Blob([formatConversation(conversation)], { type: "text/plain;charset=utf-8" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${conversation.guestName || "chat"}-${conversation.id}.txt`.replace(/[^a-z0-9.-]+/gi, "-");
    link.click();
    window.URL.revokeObjectURL(url);
  }

  return (
    <div className="stack">
      <div className="admin-toolbar">
        <label className="admin-search admin-search--large">
          <span className="sr-only">Search chats</span>
          <input
            className="admin-input"
            type="search"
            placeholder="Search Chat"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </label>
        <div className="resort-filter-pills" role="tablist" aria-label="Chat filters">
          {(["all", "open", "unread", "closed"] as const).map((option) => (
            <button
              key={option}
              type="button"
              className={filter === option ? "is-active" : ""}
              onClick={() => setFilter(option)}
            >
              {option[0].toUpperCase() + option.slice(1)}
            </button>
          ))}
        </div>
      </div>
      {error ? <p className="admin-alert admin-alert--error">{error}</p> : null}

      <div className="admin-chat-list">
        {filtered.map((conversation) => {
          const isOpen = openId === conversation.id;
          const isClosed = conversation.status === "closed";
          return (
            <article className={`panel admin-chat-card${isClosed ? " is-closed" : ""}`} key={conversation.id}>
              <div className="admin-chat-summary">
                <button
                  className="admin-chat-summary__main"
                  type="button"
                  onClick={() => {
                    if (isClosed) {
                      void refreshConversation(conversation.id).then((fresh) => setModalConversation(fresh ?? conversation));
                      return;
                    }
                    setOpenId(isOpen ? null : conversation.id);
                    void markRead(conversation.id);
                  }}
                  aria-expanded={!isClosed && isOpen}
                >
                  <span>
                    <strong>{conversation.guestName}</strong>
                    <small>{conversation.email}</small>
                  </span>
                  <span>{conversation.subject || "Live chat"}</span>
                  <small>{conversation.lastMessage || "No messages yet"}</small>
                </button>
                <em className={`admin-status-badge ${isClosed ? "is-neutral" : "is-approved"}`}>
                  {isClosed ? "closed" : conversation.unreadAdminCount > 0 ? `${conversation.unreadAdminCount} new` : conversation.status.replace("_", " ")}
                </em>
                <button
                  type="button"
                  className="admin-btn admin-btn--secondary admin-icon-only"
                  onClick={() => downloadConversation(conversation)}
                  aria-label={`Download conversation with ${conversation.guestName}`}
                >
                  <Download className="admin-icon" />
                </button>
              </div>

              {isOpen && !isClosed ? (
                <Fragment>
                  <div className="admin-chat-thread">
                    {isClosed ? <p className="admin-alert admin-alert--error">Chat closed by admin.</p> : null}
                    {conversation.messages.map((message) => (
                      <div
                        className={`admin-chat-bubble ${message.senderType === "admin" ? "is-admin" : ""} ${message.senderType === "system" ? "is-system" : ""}`}
                        key={message.id}
                      >
                        <p className="eyebrow">{message.senderType}</p>
                        <p>{message.body}</p>
                        <small>{new Date(message.createdAt).toLocaleString("en")}</small>
                        {message.attachmentUrl ? (
                          <a href={message.attachmentUrl} target="_blank" rel="noreferrer">
                            {message.attachmentName || "View attachment"}
                          </a>
                        ) : null}
                      </div>
                    ))}
                  </div>

                  <form onSubmit={sendReply} className="admin-chat-composer admin-chat-composer--inline">
                    <input type="hidden" name="conversationId" value={conversation.id} />
                    <input type="hidden" name="id" value={conversation.id} />
                    <label className="field admin-chat-reply-field">
                      <span className="sr-only">Reply</span>
                      <textarea
                        className="admin-textarea"
                        name="message"
                        placeholder="Reply to this conversation"
                        onKeyDown={submitOnEnter}
                        disabled={isClosed}
                      />
                    </label>
                    <div className="admin-chat-icon-actions">
                      <button className="admin-btn admin-btn--primary admin-icon-only" type="submit" disabled={Boolean(pendingAction) || isClosed} aria-label="Send reply">
                        <Send className="admin-icon" />
                      </button>
                      <button
                        type="button"
                        className="admin-btn admin-btn--secondary admin-icon-only"
                        disabled={Boolean(pendingAction)}
                        onClick={() => fileInputRefs.current[conversation.id]?.click()}
                        aria-label="Attach file to reply"
                      >
                        <Upload className="admin-icon" />
                      </button>
                      <input
                        ref={(node) => {
                          fileInputRefs.current[conversation.id] = node;
                        }}
                        className="sr-only"
                        name="attachment"
                        type="file"
                        accept="image/png,image/jpeg,image/webp,image/svg+xml,application/pdf"
                        onChange={(event) =>
                          setSelectedAttachment((current) => ({
                            ...current,
                            [conversation.id]: event.target.files?.[0]?.name ?? ""
                          }))
                        }
                      />
                      <button
                        type="button"
                        className="admin-btn admin-btn--secondary admin-icon-only"
                        disabled={Boolean(pendingAction)}
                        onClick={() => runAction(conversation.id, "request_attachment")}
                        aria-label="Send attachment request to guest"
                      >
                        <Paperclip className="admin-icon" />
                      </button>
                      <button
                        type="button"
                        className="admin-btn admin-btn--danger admin-btn--close-chat admin-icon-only"
                        disabled={Boolean(pendingAction)}
                        onClick={() => runAction(conversation.id, "close")}
                        aria-label="Close chat"
                      >
                        <XCircle className="admin-icon" />
                      </button>
                    </div>
                    {selectedAttachment[conversation.id] ? (
                      <p className="field__help admin-chat-attachment-name">{selectedAttachment[conversation.id]}</p>
                    ) : null}
                  </form>
                </Fragment>
              ) : null}
            </article>
          );
        })}
        {!filtered.length ? (
          <div className="admin-empty-panel">
            <h3>No chats found</h3>
            <p>Try another filter or wait for a new visitor message.</p>
          </div>
        ) : null}
      </div>

      {modalConversation ? (
        <div className="admin-modal-backdrop" role="dialog" aria-modal="true" aria-label="Chat history">
          <div className="admin-modal-panel admin-chat-history-modal">
            <div className="admin-record-card__header">
              <div>
                <strong>{modalConversation.guestName}</strong>
                <p className="muted">{modalConversation.email} - {modalConversation.subject || "Live chat"}</p>
              </div>
              <div className="admin-row-actions">
                <button
                  type="button"
                  className="admin-btn admin-btn--secondary admin-icon-only"
                  onClick={() => runAction(modalConversation.id, "open")}
                  aria-label="Reopen chat"
                >
                  <RotateCcw className="admin-icon" />
                </button>
                <button
                  type="button"
                  className="admin-btn admin-btn--secondary admin-icon-only"
                  onClick={() => downloadConversation(modalConversation)}
                  aria-label="Download conversation"
                >
                  <Download className="admin-icon" />
                </button>
                <button className="admin-btn admin-btn--ghost admin-icon-only" type="button" onClick={() => setModalConversation(null)} aria-label="Close history">
                  <XCircle className="admin-icon" />
                </button>
              </div>
            </div>
            <div className="admin-chat-thread admin-chat-thread--readonly">
              {modalConversation.messages.map((message) => (
                <div
                  className={message.senderType === "admin" ? "admin-chat-bubble is-admin" : "admin-chat-bubble"}
                  key={message.id}
                >
                  <p className="eyebrow">{message.senderType}</p>
                  <p>{message.body}</p>
                  {message.attachmentUrl ? (
                    <a href={message.attachmentUrl} target="_blank" rel="noreferrer">
                      {message.attachmentName || "View attachment"}
                    </a>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
