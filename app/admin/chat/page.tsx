import { ChatInbox } from "@/components/admin/chat-inbox";
import { listChatConversations } from "@/lib/services/chat-service";

export default async function AdminChatPage() {
  const conversations = await listChatConversations();

  return (
    <section className="stack">
      <ChatInbox conversations={conversations} />
    </section>
  );
}
