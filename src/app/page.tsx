import { Sidebar } from "@/components/sidebar/sidebar";
import { ChatWindow } from "@/components/chat/chat-window";

export default function Home() {
  return (
    <main className="flex h-screen w-full bg-[#0a0a0a] overflow-hidden">
      <Sidebar />
      <div className="flex-1 h-full overflow-hidden relative">
        <ChatWindow />
      </div>
    </main>
  );
}
