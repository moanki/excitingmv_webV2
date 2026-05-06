"use client";

import { Fragment, useMemo, useState } from "react";

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
        <label className="admin-search">
          <span className="sr-only">Search chats</span>
          <input
            className="admin-input"
            type="search"
            placeholder="Search by name, email, subject, or message..."
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
              <button
                className="admin-chat-summary"
                type="button"
                onClick={() => setOpenId(isOpen ? null : conversation.id)}
                aria-expanded={isOpen}
              >
                <span>
                  <strong>{conversation.guestName}</strong>
                  <small>{conversation.email}</small>
                </span>
                <span>{conversation.subject || "Live chat"}</span>
                <em className={`admin-status-badge ${isClosed ? "is-neutral" : "is-approved"}`}>
                  {isClosed ? "closed" : "open"}
                </em>
              </button>

              {isOpen ? (
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

                  <div className="admin-row-actions admin-chat-actions">
                    <button
                      type="button"
                      className="admin-btn admin-btn--danger admin-btn--close-chat"
                      disabled={Boolean(pendingAction) || isClosed}
                      onClick={() => runAction(conversation.id, "close")}
                    >
                      Close Chat
                    </button>
                    <button
                      type="button"
                      className="admin-btn admin-btn--secondary"
                      disabled={Boolean(pendingAction)}
                      onClick={() => runAction(conversation.id, "request_attachment")}
                    >
                      Send Attachment Request
                    </button>
                    {isClosed ? (
                      <button
                        type="button"
                        className="admin-btn admin-btn--secondary"
                        disabled={Boolean(pendingAction)}
                        onClick={() => runAction(conversation.id, "open")}
                      >
                        Reopen
                      </button>
                    ) : null}
                    <button
                      type="button"
                      className="admin-btn admin-btn--secondary"
                      onClick={() => downloadConversation(conversation)}
                    >
                      Download Conversation
                    </button>
                  </div>

                  {!isClosed ? (
                    <form action={sendReply} className="stack admin-chat-composer">
                      <input type="hidden" name="conversationId" value={conversation.id} />
                      <label className="field">
                        <span className="field__label">Reply</span>
                        <textarea className="admin-textarea" name="message" placeholder="Reply to this conversation" />
                      </label>
                      <div className="admin-form-actions admin-form-actions--start">
                        <button className="admin-btn admin-btn--primary" type="submit" disabled={Boolean(pendingAction)}>
                          Send Reply
                        </button>
                      </div>
                    </form>
                  ) : null}
                </Fragment>
              ) : null}
            </article>
          );
        })}
      </div>
    </div>
  );
}
