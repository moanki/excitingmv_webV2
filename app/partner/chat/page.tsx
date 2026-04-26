import { sampleMessages } from "@/lib/sample-data";

export default function PartnerChatPage() {
  return (
    <section>
      <p className="eyebrow">Chat Now</p>
      <h1 className="section-title">Realtime sales support for partner questions.</h1>
      <div className="stack">
        {sampleMessages.map((message) => (
          <article key={message.id} className="panel">
            <strong>{message.sender}</strong>
            <p className="muted">{message.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
