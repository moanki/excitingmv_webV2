import { sampleMessages } from "@/lib/sample-data";

export default function AdminChatPage() {
  return (
    <section>
      <p className="eyebrow">Chat Inbox</p>
      <h1 className="section-title">Resolve partner questions in real time.</h1>
      <div className="stack">
        {sampleMessages.map((message) => (
          <article className="panel" key={message.id}>
            <div className="section-heading">
              <strong>{message.sender}</strong>
              <span className="badge">{message.status}</span>
            </div>
            <p className="muted">{message.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
