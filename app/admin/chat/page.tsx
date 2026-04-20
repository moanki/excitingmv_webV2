import { replyToChatAction } from "@/app/admin/chat/actions";
import { listChatConversations } from "@/lib/services/chat-service";

export default async function AdminChatPage() {
  const conversations = await listChatConversations();

  return (
    <section className="stack">
      <div>
        <p className="eyebrow">Chat Inbox</p>
        <h1 className="section-title">Review live chat history and respond from the admin portal.</h1>
      </div>
      <div className="stack">
        {conversations.map((conversation) => (
          <article className="panel" key={conversation.id}>
            <div className="section-heading">
              <div>
                <strong>{conversation.guestName}</strong>
                <p className="muted">
                  {conversation.email} • {conversation.subject}
                </p>
              </div>
              <span className="badge">{conversation.status}</span>
            </div>
            <div className="stack">
              {conversation.messages.map((message) => (
                <div className="panel panel-soft" key={message.id}>
                  <p className="eyebrow">{message.senderType}</p>
                  <p className="muted">{message.body}</p>
                </div>
              ))}
            </div>
            <form action={replyToChatAction} className="stack" style={{ marginTop: "1rem" }}>
              <input type="hidden" name="conversationId" value={conversation.id} />
              <label className="field">
                Reply
                <textarea name="body" placeholder="Reply to this conversation" />
              </label>
              <button className="button" type="submit">
                Send Reply
              </button>
            </form>
          </article>
        ))}
      </div>
    </section>
  );
}
