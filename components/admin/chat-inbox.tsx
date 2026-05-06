"use client";

import { Fragment, useMemo, useState } from "react";
import { Download, Paperclip, RotateCcw, Send, XCircle } from "lucide-react";

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
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(conversations[0]?.id ?? null);
  const [modalConversation, setModalConversation] = useState<ChatConversationRecord | null>(null);
  const [pendingAction, setPendingAction] = useState("");

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return conversations.filter((conversation) => {
      const haystack = [
        conversation.guestName,
        conversation.email,
        conversation.subject,
        conversation.status,
        ...conversation.messages.map((message) => message.body)
      ]
        .join(" ")
        .toLowerCase();

      return !normalized || haystack.includes(normalized);
    });
  }, [conversations, query]);

  async function runAction(id: string, action: "close" | "open" | "request_attachment") {
    setPendingAction(`${action}:${id}`);
    const response = await fetch("/api/admin/chat/status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, action })
    });
    setPendingAction("");

    if (response.ok) {
      window.location.reload();
    }
  }

  async function sendReply(formData: FormData) {
    const id = String(formData.get("conversationId") ?? "");
    const message = String(formData.get("message") ?? "").trim();

    if (!id || !message) {
      return;
    }

    setPendingAction(`reply:${id}`);
    const response = await fetch("/api/admin/chat/reply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, message })
    });
    setPendingAction("");

    if (response.ok) {
      window.location.reload();
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
      </div>

      <div className="admin-chat-list">
        {filtered.map((conversation) => {
          const isOpen = openId === conversation.id;
          const isClosed = conversation.status === "resolved";
          return (
            <article className="panel admin-chat-card" key={conversation.id}>
              <div className="admin-chat-summary">
                <button
                  className="admin-chat-summary__main"
                  type="button"
                  onClick={() => (isClosed ? setModalConversation(conversation) : setOpenId(isOpen ? null : conversation.id))}
                  aria-expanded={!isClosed && isOpen}
                >
                  <span>
                    <strong>{conversation.guestName}</strong>
                    <small>{conversation.email}</small>
                  </span>
                  <span>{conversation.subject || "Live chat"}</span>
                </button>
                <em className={`admin-status-badge ${isClosed ? "is-neutral" : "is-approved"}`}>
                  {isClosed ? "closed" : "open"}
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
                    {conversation.messages.map((message) => (
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

                  <form action={sendReply} className="admin-chat-composer admin-chat-composer--inline">
                    <input type="hidden" name="conversationId" value={conversation.id} />
                    <label className="field admin-chat-reply-field">
                      <span className="sr-only">Reply</span>
                      <textarea className="admin-textarea" name="message" placeholder="Reply to this conversation" />
                    </label>
                    <div className="admin-chat-icon-actions">
                      <button className="admin-btn admin-btn--primary admin-icon-only" type="submit" disabled={Boolean(pendingAction)} aria-label="Send reply">
                        <Send className="admin-icon" />
                      </button>
                      <button
                        type="button"
                        className="admin-btn admin-btn--secondary admin-icon-only"
                        disabled={Boolean(pendingAction)}
                        onClick={() => runAction(conversation.id, "request_attachment")}
                        aria-label="Send attachment request"
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
                  </form>
                </Fragment>
              ) : null}
            </article>
          );
        })}
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
