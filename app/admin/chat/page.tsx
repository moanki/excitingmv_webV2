import { replyToChatAction } from "@/app/admin/chat/actions";
import { listChatConversations } from "@/lib/services/chat-service";

export default async function AdminChatPage() {
  const conversations = await listChatConversations();

  return (
    <section className="stack">
      <div className="admin-page-header">
        <div className="admin-page-header__content">
          <p className="eyebrow">Chat Inbox</p>
          <h1 className="section-title">Review live chat history and respond from the admin portal.</h1>
          <p className="admin-page-lede">A calmer, more readable inbox view for guest conversations and team replies.</p>
        </div>
      </div>

      <div className="stack">
        {conversations.map((conversation) => (
          <article className="panel admin-chat-card" key={conversation.id}>
            <div className="admin-record-card__header">
              <div>
                <strong>{conversation.guestName}</strong>
                <p className="muted">{conversation.email} • {conversation.subject}</p>
              </div>
              <span className="badge">{conversation.status}</span>
            </div>

            <div className="admin-chat-thread">
              {conversation.messages.map((message) => (
                <div
                  className={message.senderType === "admin" ? "admin-chat-bubble is-admin" : "admin-chat-bubble"}
                  key={message.id}
                >
                  <p className="eyebrow">{message.senderType}</p>
                  <p>{message.body}</p>
                </div>
              ))}
            </div>

            <form action={replyToChatAction} className="stack admin-chat-composer">
              <input type="hidden" name="conversationId" value={conversation.id} />
              <label className="field">
                <span className="field__label">Reply</span>
                <textarea className="admin-textarea" name="body" placeholder="Reply to this conversation" />
              </label>
              <div className="admin-form-actions">
                <button className="admin-btn admin-btn--primary" type="submit">
                  Send Reply
                </button>
              </div>
            </form>
          </article>
        ))}
      </div>
    </section>
  );
}
