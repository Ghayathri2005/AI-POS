import React from "react";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { 
  Sparkles, 
  User, 
  Brain, 
  ExternalLink,
  MessageSquare,
  Clock
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const revalidate = 0; // Disable server cache to ensure fresh loads

async function getSharedChat(id: string) {
  try {
    const conversation = await prisma.conversation.findUnique({
      where: { id },
      include: {
        messages: {
          orderBy: { createdAt: "asc" }
        }
      }
    });

    if (!conversation) return null;
    return conversation;
  } catch (err) {
    console.error("Failed to load shared conversation:", err);
    return null;
  }
}

export default async function SharePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const conversation = await getSharedChat(id);

  if (!conversation) {
    notFound();
  }

  const formattedDate = new Date(conversation.updatedAt).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric"
  });

  return (
    <div className="flex flex-col min-h-screen bg-[#0a0a0a] text-zinc-100 selection:bg-indigo-500/20">
      {/* Premium Header */}
      <header className="h-16 border-b border-[#262626] flex items-center justify-between px-6 sticky top-0 bg-[#0a0a0a]/80 backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold shadow-lg shadow-indigo-500/10">
            AI
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-zinc-100 text-sm">AI-POS Share View</span>
            <span className="text-[10px] text-zinc-500 flex items-center gap-1">
              <Clock size={10} /> Shared on {formattedDate}
            </span>
          </div>
        </div>

        <Link href="/">
          <Button className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all duration-200 shadow-lg shadow-indigo-600/10">
            Go to App <ExternalLink size={12} className="ml-1.5" />
          </Button>
        </Link>
      </header>

      {/* Shared Title Banner */}
      <div className="max-w-3xl mx-auto w-full pt-8 px-4">
        <div className="bg-[#171717]/40 border border-[#262626] rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles size={11} /> Publicly Shared Chat
            </span>
            <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-zinc-100">
              {conversation.title || "Shared Conversation"}
            </h1>
          </div>
          <div className="flex items-center gap-1.5 text-zinc-500 text-xs font-semibold shrink-0">
            <MessageSquare size={14} /> {conversation.messages.length} messages
          </div>
        </div>
      </div>

      {/* Messages Render Area */}
      <div className="flex-1 max-w-3xl mx-auto w-full py-12 px-4 space-y-12">
        {conversation.messages.map((message) => (
          <div key={message.id} className="flex gap-4 group">
            <Avatar className="h-8 w-8 rounded-lg shrink-0">
              {message.role === "user" ? (
                <AvatarFallback className="bg-zinc-800 text-zinc-400">
                  <User size={16} />
                </AvatarFallback>
              ) : (
                <AvatarFallback className="bg-zinc-800 text-zinc-400">
                  <Brain size={16} className="text-indigo-400" />
                </AvatarFallback>
              )}
            </Avatar>
            
            <div className="flex-1 space-y-2 overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-zinc-100">
                  {message.role === "user" ? "You" : "AI-POS"}
                </span>
              </div>
              
              <div className="prose prose-invert prose-p:leading-relaxed prose-pre:p-0 max-w-none text-zinc-300 text-[15px]">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    code({ node, inline, className, children, ...props }: any) {
                      const match = /language-(\w+)/.exec(className || "");
                      return !inline && match ? (
                        <div className="relative group/code my-4 rounded-xl overflow-hidden border border-[#262626]">
                          <div className="flex items-center justify-between px-4 py-2 bg-[#1c1c1c] border-b border-[#262626]">
                            <span className="text-xs font-mono text-zinc-500">{match[1]}</span>
                          </div>
                          <SyntaxHighlighter
                            style={oneDark}
                            language={match[1]}
                            PreTag="div"
                            customStyle={{
                              margin: 0,
                              background: "#0d0d0d",
                              padding: "1rem",
                              fontSize: "13px"
                            }}
                            {...props}
                          >
                            {String(children).replace(/\n$/, "")}
                          </SyntaxHighlighter>
                        </div>
                      ) : (
                        <code className="bg-[#262626] rounded px-1.5 py-0.5 text-sm font-mono text-indigo-300" {...props}>
                          {children}
                        </code>
                      );
                    },
                  }}
                >
                  {message.content}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer Disclaimer */}
      <footer className="mt-auto py-8 border-t border-[#262626] bg-[#0c0c0c] text-center text-xs text-zinc-500 space-y-2">
        <p className="font-semibold text-zinc-400">
          This is a read-only public conversation share link.
        </p>
        <p>
          AI-POS is a premium, secure AI assistant. <Link href="/" className="text-indigo-400 hover:text-indigo-300 underline font-medium">Create your own workspace</Link>.
        </p>
      </footer>
    </div>
  );
}
