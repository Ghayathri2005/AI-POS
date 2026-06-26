"use client";

import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { 
  Copy, 
  RotateCcw, 
  ThumbsUp, 
  ThumbsDown,
  Code,
  Globe,
  MessageSquare,
  Sparkles,
  User,
  Brain,
  Image as ImageIcon,
  Download,
  ZoomIn,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { UIMessage } from "ai";
import { useEffect, useRef, useState } from "react";

const SUGGESTIONS = [
  { title: "Write code", text: "Explain how to use React hooks", icon: Code, color: "text-blue-400" },
  { title: "Plan a trip", text: "Top 5 hidden gems in Japan", icon: Globe, color: "text-green-400" },
  { title: "Summarize", text: "Summarize the latest AI trends in 2025", icon: MessageSquare, color: "text-purple-400" },
  { title: "Create Image", text: "Generate a futuristic cityscape at night", icon: ImageIcon, color: "text-pink-400" },
];

interface ChatMessagesProps {
  messages: UIMessage[];
  isLoading: boolean;
  reload: () => void;
  onSelectSuggestion?: (text: string) => void;
}

/**
 * Extract the plain text content from a UIMessage (AI SDK v7).
 * Falls back to legacy `content` string if present.
 */
function getMessageText(message: UIMessage): string {
  // v7: parts array with type "text"
  if (Array.isArray(message.parts) && message.parts.length > 0) {
    return message.parts
      .filter((p) => p.type === "text")
      .map((p) => (p as { type: "text"; text: string }).text)
      .join("");
  }
  // Legacy fallback
  if (typeof (message as any).content === "string") {
    return (message as any).content;
  }
  return "";
}

// Parse [IMAGE_GEN|url|prompt] or older [IMAGE_GEN:url:prompt] token from assistant message
function parseImageGen(content: string): { url: string; prompt: string } | null {
  // 1. Try the robust pipe format first
  const pipeMatch = content.match(/^\[IMAGE_GEN\|([\s\S]+?)\|([\s\S]+)\]$/);
  if (pipeMatch) {
    return { url: pipeMatch[1], prompt: pipeMatch[2] };
  }

  // 2. Fallback to older colon format (fixes historical broken images in DB)
  const colonMatch = content.match(/^\[IMAGE_GEN:([\s\S]+?):([\s\S]+)\]$/);
  if (colonMatch) {
    let url = colonMatch[1];
    let prompt = colonMatch[2];

    // If the colon format broke the 'https://' protocol into pieces
    if (url === "https" && prompt.startsWith("//")) {
      const reconstructed = "https:" + prompt;
      // The prompt is everything after the LAST colon in the string
      const lastColonIdx = reconstructed.lastIndexOf(":");
      if (lastColonIdx !== -1 && lastColonIdx > 5) { // Ensure it's not the 'https:' colon
        url = reconstructed.substring(0, lastColonIdx);
        prompt = reconstructed.substring(lastColonIdx + 1);
      } else {
        url = reconstructed;
        prompt = "AI Generated Image";
      }
    }
    return { url, prompt };
  }

  return null;
}

// Beautiful generated image card
function GeneratedImageCard({ url, prompt }: { url: string; prompt: string }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [zoomed, setZoomed] = useState(false);

  const proxiedUrl = `/api/proxy-image?url=${encodeURIComponent(url)}`;

  const handleDownload = async () => {
    try {
      const response = await fetch(proxiedUrl);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `ai-pos-${Date.now()}.png`;
      a.click();
      URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(proxiedUrl, "_blank");
    }
  };

  return (
    <div className="my-2 space-y-3">
      <div className="flex items-center gap-2 text-xs text-zinc-400">
        <Sparkles size={12} className="text-indigo-400" />
        <span>Generated image for: <span className="text-zinc-200 font-medium italic">"{prompt}"</span></span>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: loaded ? 1 : 0.5, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="relative group rounded-2xl overflow-hidden border border-[#2c2c2c] bg-[#111111] max-w-[480px] shadow-xl shadow-black/50"
      >
        {/* Loading skeleton */}
        {!loaded && !error && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-[#111111] min-h-[300px]">
            <div className="w-10 h-10 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
            <p className="text-xs text-zinc-500 animate-pulse">Generating your image...</p>
          </div>
        )}

        {error ? (
          <div className="flex flex-col items-center justify-center gap-3 p-10 text-zinc-500 min-h-[300px]">
            <ImageIcon size={32} className="text-zinc-600" />
            <p className="text-xs text-center">Image generation failed.<br />Try again with a different prompt.</p>
          </div>
        ) : (
          <img
            src={proxiedUrl}
            alt={prompt}
            className={`w-full object-cover transition-all duration-500 cursor-zoom-in min-h-[300px] ${loaded ? "opacity-100" : "opacity-0"}`}
            style={{ maxHeight: "480px" }}
            onLoad={() => setLoaded(true)}
            onError={() => { setLoaded(true); setError(true); }}
            onClick={() => setZoomed(true)}
          />
        )}

        {/* Hover action overlay */}
        {loaded && !error && (
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-300 flex items-end justify-end p-3 gap-2 opacity-0 group-hover:opacity-100">
            <Button
              type="button"
              size="icon"
              onClick={() => setZoomed(true)}
              className="h-8 w-8 bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 rounded-xl"
            >
              <ZoomIn size={14} />
            </Button>
            <Button
              type="button"
              size="icon"
              onClick={handleDownload}
              className="h-8 w-8 bg-indigo-500/80 backdrop-blur-sm border border-indigo-400/30 text-white hover:bg-indigo-500 rounded-xl"
            >
              <Download size={14} />
            </Button>
          </div>
        )}
      </motion.div>

      {/* Lightbox zoom modal */}
      <AnimatePresence>
        {zoomed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4"
            onClick={() => setZoomed(false)}
          >
            <motion.img
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              src={proxiedUrl}
              alt={prompt}
              className="max-w-full max-h-full rounded-2xl shadow-2xl object-contain"
              onClick={(e) => e.stopPropagation()}
            />
            <button
              className="absolute top-4 right-4 text-white/60 hover:text-white text-2xl font-bold bg-transparent border-none cursor-pointer"
              onClick={() => setZoomed(false)}
            >✕</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function ChatMessages({ messages, isLoading, reload, onSelectSuggestion }: ChatMessagesProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="h-full w-full flex flex-col items-center overflow-y-auto p-4 md:p-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-2xl my-auto w-full py-8"
        >
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-indigo-500/20 shrink-0">
            <Sparkles size={32} className="text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-4 tracking-tight">How can I help you today?</h1>
          <p className="text-zinc-500 mb-12">
            Ask me anything about coding, writing, planning, or just chat with me.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {SUGGESTIONS.map((suggestion, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <Button
                  onClick={() => onSelectSuggestion?.(suggestion.text)}
                  variant="outline"
                  className="w-full h-auto flex flex-col items-start gap-1 p-4 bg-[#171717] border-[#262626] hover:bg-[#262626] hover:border-[#333333] group text-left cursor-pointer"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <suggestion.icon size={16} className={suggestion.color} />
                    <span className="text-sm font-semibold text-zinc-100">{suggestion.title}</span>
                  </div>
                  <span className="text-xs text-zinc-500 group-hover:text-zinc-400">{suggestion.text}</span>
                </Button>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <ScrollArea ref={scrollRef} className="h-full">
      <div className="max-w-3xl mx-auto py-8 px-4 space-y-12">
        {messages.map((message, i) => {
          const messageText = getMessageText(message);
          const imageGen = message.role === "assistant" ? parseImageGen(messageText) : null;

          return (
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
                  {imageGen ? (
                    <GeneratedImageCard url={imageGen.url} prompt={imageGen.prompt} />
                  ) : (
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm]}
                      components={{
                        code({ node, inline, className, children, ...props }: any) {
                          const match = /language-(\w+)/.exec(className || "");
                          return !inline && match ? (
                            <div className="relative group/code my-4 rounded-xl overflow-hidden border border-[#262626]">
                              <div className="flex items-center justify-between px-4 py-2 bg-[#1c1c1c] border-b border-[#262626]">
                                <span className="text-xs font-mono text-zinc-500">{match[1]}</span>
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-zinc-500 hover:text-zinc-100">
                                  <Copy size={12} />
                                </Button>
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
                      {messageText}
                    </ReactMarkdown>
                  )}
                </div>

                {message.role === "assistant" && !imageGen && (
                  <div className="flex items-center gap-1 mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-zinc-100">
                      <Copy size={14} />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-zinc-500 hover:text-zinc-100"
                      onClick={() => reload()}
                    >
                      <RotateCcw size={14} />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-zinc-100">
                      <ThumbsUp size={14} />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500 hover:text-zinc-100">
                      <ThumbsDown size={14} />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {isLoading && messages[messages.length - 1]?.role === "user" && (
          <div className="flex gap-4">
             <Avatar className="h-8 w-8 rounded-lg shrink-0">
                <AvatarFallback className="bg-zinc-800 text-zinc-400">
                  <Brain size={16} className="text-indigo-400 animate-pulse" />
                </AvatarFallback>
             </Avatar>
             <div className="flex items-center gap-1 pl-1">
                <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <div className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce" />
             </div>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
