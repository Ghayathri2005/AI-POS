"use client";

import { useEffect, useState } from "react";
import { useChatStore } from "@/store/use-chat-store";
import { ChatInput } from "./chat-input";
import { ChatMessages } from "./chat-messages";
import { ModelSelector } from "./model-selector";
import { Button } from "@/components/ui/button";
import { 
  Share2, 
  MoreVertical, 
  Menu, 
  FolderKanban, 
  Trash2, 
  Check, 
  Copy, 
  FolderMinus,
  Sparkles,
  Plus
} from "lucide-react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, UIMessage } from "ai";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

export function ChatWindow() {
  const { 
    currentModel, 
    isSidebarOpen, 
    setSidebarOpen,
    activeConversationId,
    setActiveConversationId,
    activeProjectId,
    setActiveProjectId,
    refreshSidebarCounter,
    triggerSidebarRefresh
  } = useChatStore();

  // Local input state (no longer provided by useChat in v7)
  const [input, setInput] = useState("");
  
  const { 
    messages, 
    sendMessage,
    status,
    setMessages,
    regenerate, 
    stop,
  } = useChat({
    transport: new DefaultChatTransport({
      api: "/api/chat",
      body: {
        model: currentModel,
        conversationId: activeConversationId
      },
    }),
    onFinish: () => {
      triggerSidebarRefresh();
    }
  });

  // Derived loading state from status
  const isLoading = status === "submitted" || status === "streaming";

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  const handleSelectSuggestion = (text: string) => {
    if (isLoading) return;

    setInput(text);

    // Focus the textarea and position the cursor at the end
    setTimeout(() => {
      const textarea = document.getElementById("chat-textarea") as HTMLTextAreaElement | null;
      if (textarea) {
        textarea.focus();
        textarea.selectionStart = textarea.selectionEnd = textarea.value.length;
      }
    }, 50);
  };

  const [projects, setProjects] = useState<any[]>([]);
  const [activeConversation, setActiveConversation] = useState<any>(null);
  
  // Share modal state
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  // Fetch projects list
  useEffect(() => {
    async function loadProjects() {
      try {
        const response = await fetch("/api/projects");
        if (response.ok) {
          const data = await response.json();
          setProjects(data);
        }
      } catch (err) {
        console.error("Failed to load projects inside ChatWindow:", err);
      }
    }
    loadProjects();
  }, [refreshSidebarCounter, activeConversationId]);

  // Fetch active conversation details
  useEffect(() => {
    async function loadActiveChatDetails() {
      if (activeConversationId) {
        try {
          const response = await fetch(`/api/conversations`);
          if (response.ok) {
            const data = await response.json();
            const current = data.find((c: any) => c.id === activeConversationId);
            setActiveConversation(current || null);
            if (current?.projectId) {
              setActiveProjectId(current.projectId);
            }
          }
        } catch (err) {
          console.error("Failed to fetch conversation details:", err);
        }
      } else {
        setActiveConversation(null);
      }
    }
    loadActiveChatDetails();
  }, [activeConversationId, refreshSidebarCounter, setActiveProjectId]);

  // Fetch and load conversation history when activeConversationId changes
  useEffect(() => {
    async function loadHistory() {
      if (activeConversationId) {
        try {
          const response = await fetch(`/api/conversations/${activeConversationId}/messages`);
          if (response.ok) {
            const data = await response.json();
            // Convert DB messages to UIMessage format (v7)
            const formatted: UIMessage[] = data.map((m: any) => ({
              id: m.id,
              role: m.role as "user" | "assistant" | "system",
              parts: [{ type: "text" as const, text: m.content ?? "" }],
              content: m.content ?? "",
              metadata: undefined,
            }));
            setMessages(formatted);
          }
        } catch (err) {
          console.error("Failed to load messages:", err);
        }
      } else {
        setMessages([]);
      }
    }
    loadHistory();
  }, [activeConversationId, setMessages]);

  // Submit handler: auto-create conversation on first user message
  const handleFormSubmit = async (customText?: string) => {
    const textToSend = customText !== undefined ? customText : input;
    if (!textToSend.trim() || isLoading) return;

    // Clear input field immediately for crisp UX
    setInput("");

    let conversationId = activeConversationId;
    if (!conversationId) {
      try {
        const response = await fetch("/api/conversations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ 
            title: textToSend.substring(0, 30),
            projectId: activeProjectId // Bind active project context automatically!
          }),
        });
        if (response.ok) {
          const newChat = await response.json();
          conversationId = newChat.id;
          setActiveConversationId(conversationId);
          triggerSidebarRefresh();
        }
      } catch (err) {
        console.error("Failed to create conversation:", err);
      }
    }

    // Send message using AI SDK v7 API
    sendMessage(
      {
        role: "user",
        parts: [{ type: "text", text: textToSend }],
      },
      {
        body: {
          model: currentModel,
          conversationId: conversationId
        }
      }
    );
  };

  const handleCopyLink = () => {
    if (!activeConversationId) return;
    const url = `${window.location.origin}/share/${activeConversationId}`;
    navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Public share link copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddToProject = async (projectId: string) => {
    if (!activeConversationId) return;
    try {
      const response = await fetch(`/api/conversations/${activeConversationId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId }),
      });
      if (response.ok) {
        toast.success("Conversation added to project");
        triggerSidebarRefresh();
      } else {
        toast.error("Failed to link to project");
      }
    } catch (err) {
      toast.error("Error adding to project");
    }
  };

  const handleRemoveFromProject = async () => {
    if (!activeConversationId) return;
    try {
      const response = await fetch(`/api/conversations/${activeConversationId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId: null }),
      });
      if (response.ok) {
        toast.success("Removed from project");
        triggerSidebarRefresh();
      } else {
        toast.error("Failed to remove from project");
      }
    } catch (err) {
      toast.error("Error removing from project");
    }
  };

  const handleDeleteChat = async () => {
    if (!activeConversationId) return;
    try {
      const response = await fetch(`/api/conversations/${activeConversationId}`, {
        method: "DELETE"
      });
      if (response.ok) {
        toast.success("Conversation deleted");
        setActiveConversationId(null);
        triggerSidebarRefresh();
      } else {
        toast.error("Failed to delete conversation");
      }
    } catch (err) {
      toast.error("Error deleting conversation");
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a] text-zinc-100">
      {/* Header */}
      <header className="h-14 border-b border-[#262626] flex items-center justify-between px-4 sticky top-0 bg-[#0a0a0a]/80 backdrop-blur-md z-10">
        <div className="flex items-center gap-2">
          {!isSidebarOpen && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-zinc-400 hover:text-zinc-100 hover:bg-[#262626]"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={18} />
            </Button>
          )}
          <ModelSelector />
          
          {activeConversation && activeConversation.projectId && (
            <span className="hidden md:flex items-center gap-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-bold px-2.5 py-0.5 rounded-full select-none">
              <FolderKanban size={10} />
              {projects.find(p => p.id === activeConversation.projectId)?.name || "Project"}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {activeConversationId && (
            <>
              <Button 
                onClick={() => setIsShareOpen(true)}
                variant="ghost" 
                size="sm" 
                className="gap-2 text-zinc-400 hover:text-zinc-100 hover:bg-[#262626] rounded-lg cursor-pointer h-8"
              >
                <Share2 size={15} />
                <span className="hidden sm:inline text-xs font-semibold">Share</span>
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger
                  className="h-8 w-8 text-zinc-400 hover:text-zinc-100 hover:bg-[#262626] rounded-lg flex items-center justify-center border-none bg-transparent outline-none cursor-pointer"
                >
                  <MoreVertical size={18} />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52 bg-[#1f1f1f] border-[#2c2c2c] text-zinc-300 rounded-xl shadow-xl p-1">
                  
                  {/* Project Linking Submenu */}
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger className="gap-2 text-xs focus:bg-[#282828] focus:text-zinc-100 rounded-lg cursor-pointer">
                      <FolderKanban size={14} className="text-zinc-500" /> Add to Project
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent className="w-48 bg-[#1f1f1f] border-[#2c2c2c] text-zinc-300 rounded-xl p-1">
                      {projects.length === 0 ? (
                        <div className="px-3 py-2 text-[10px] text-zinc-500 italic">
                          No projects created.
                        </div>
                      ) : (
                        projects.map((p) => (
                          <DropdownMenuItem
                            key={p.id}
                            onClick={() => handleAddToProject(p.id)}
                            className="gap-2 text-xs focus:bg-[#282828] focus:text-zinc-100 rounded-lg cursor-pointer py-1.5"
                          >
                            <FolderKanban size={12} className="text-indigo-400" />
                            <span className="truncate">{p.name}</span>
                          </DropdownMenuItem>
                        ))
                      )}
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>

                  {activeConversation?.projectId && (
                    <DropdownMenuItem
                      onClick={handleRemoveFromProject}
                      className="gap-2 text-xs focus:bg-[#282828] focus:text-zinc-100 rounded-lg cursor-pointer"
                    >
                      <FolderMinus size={14} className="text-zinc-500" /> Remove from Project
                    </DropdownMenuItem>
                  )}

                  <DropdownMenuSeparator className="bg-[#2c2c2c]" />
                  
                  <DropdownMenuItem
                    onClick={handleDeleteChat}
                    className="gap-2 text-xs focus:bg-[#282828] text-red-400 focus:text-red-400 rounded-lg cursor-pointer"
                  >
                    <Trash2 size={14} /> Delete Chat
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-hidden relative">
        <ChatMessages 
          messages={messages} 
          isLoading={isLoading} 
          reload={regenerate} 
          onSelectSuggestion={handleSelectSuggestion} 
        />
      </div>

      {/* Input */}
      <div className="p-4 md:p-6 lg:p-8 max-w-4xl mx-auto w-full">
        <ChatInput 
          input={input} 
          handleInputChange={handleInputChange} 
          handleSubmit={handleFormSubmit} 
          isLoading={isLoading}
          stop={stop}
        />
        <p className="text-[10px] text-zinc-500 text-center mt-3">
          AI-POS can make mistakes. Check important info.
        </p>
      </div>

      {/* Share Modal Dialog */}
      <Dialog open={isShareOpen} onOpenChange={setIsShareOpen}>
        <DialogContent className="max-w-md bg-[#171717] border-[#262626] text-zinc-100 p-6 rounded-2xl">
          <DialogHeader className="mb-4">
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Share2 size={18} className="text-indigo-400" />
              Share public link
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <p className="text-xs text-zinc-400 leading-relaxed">
              Anyone with this link will be able to view this conversation's message history. Only standard messages are shared.
            </p>
            
            <div className="flex items-center gap-2 bg-[#0d0d0d] border border-[#262626] rounded-xl p-1.5 pl-3">
              <span className="text-xs text-zinc-500 select-all truncate flex-1 font-mono">
                {typeof window !== "undefined" ? `${window.location.origin}/share/${activeConversationId}` : ""}
              </span>
              <Button
                onClick={handleCopyLink}
                className="bg-white hover:bg-zinc-200 text-black text-xs font-semibold px-3 py-1.5 h-8 rounded-lg cursor-pointer transition-colors duration-200"
              >
                {copied ? <Check size={14} className="text-green-600" /> : <Copy size={14} />}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
