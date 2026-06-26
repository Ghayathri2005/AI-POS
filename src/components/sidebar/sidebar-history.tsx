"use client";

import { useEffect, useState } from "react";
import { MessageSquare, MoreHorizontal, Pencil, Trash2, Check, X, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useChatStore } from "@/store/use-chat-store";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Conversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  isPinned: boolean;
  isArchived: boolean;
}

export function SidebarHistory() {
  const {
    activeConversationId,
    setActiveConversationId,
    searchQuery,
    refreshSidebarCounter,
    triggerSidebarRefresh,
  } = useChatStore();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameTitle, setRenameTitle] = useState("");
  const [isMutating, setIsMutating] = useState(false);

  // Fetch conversations
  useEffect(() => {
    async function loadConversations() {
      try {
        const response = await fetch("/api/conversations");
        if (response.ok) {
          const data = await response.json();
          setConversations(data);
        }
      } catch (err) {
        console.error("Failed to load conversations:", err);
      } finally {
        setLoading(false);
      }
    }
    loadConversations();
  }, [refreshSidebarCounter]);

  // Handle click on chat
  const handleChatClick = (id: string) => {
    if (renamingId) return; // Ignore if renaming
    setActiveConversationId(id);
  };

  // Handle delete conversation
  const handleDelete = async (id: string) => {
    if (isMutating) return;
    setIsMutating(true);
    try {
      const response = await fetch(`/api/conversations/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Conversation deleted successfully");
        if (activeConversationId === id) {
          setActiveConversationId(null);
        }
        triggerSidebarRefresh();
      } else {
        toast.error("Failed to delete conversation");
      }
    } catch (err) {
      toast.error("Error deleting conversation");
    } finally {
      setIsMutating(false);
    }
  };

  // Handle start rename inline
  const startRename = (id: string, currentTitle: string) => {
    setRenamingId(id);
    setRenameTitle(currentTitle);
  };

  // Save renamed conversation
  const saveRename = async (id: string) => {
    if (!renameTitle.trim() || isMutating) return;
    setIsMutating(true);
    try {
      const response = await fetch(`/api/conversations/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: renameTitle.trim() }),
      });

      if (response.ok) {
        toast.success("Conversation renamed");
        setRenamingId(null);
        triggerSidebarRefresh();
      } else {
        toast.error("Failed to rename conversation");
      }
    } catch (err) {
      toast.error("Error renaming conversation");
    } finally {
      setIsMutating(false);
    }
  };

  // Grouping logic
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterdayStart = todayStart - 24 * 60 * 60 * 1000;
  const sevenDaysAgoStart = todayStart - 7 * 24 * 60 * 60 * 1000;

  const filteredConversations = conversations.filter((chat) =>
    !(chat as any).projectId &&
    (chat.title || "New Chat").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groups: { [key: string]: Conversation[] } = {
    Today: [],
    Yesterday: [],
    "Previous 7 Days": [],
    Older: [],
  };

  filteredConversations.forEach((chat) => {
    const time = new Date(chat.updatedAt).getTime();
    if (time >= todayStart) {
      groups["Today"].push(chat);
    } else if (time >= yesterdayStart) {
      groups["Yesterday"].push(chat);
    } else if (time >= sevenDaysAgoStart) {
      groups["Previous 7 Days"].push(chat);
    } else {
      groups["Older"].push(chat);
    }
  });

  return (
    <div className="flex-1">
      {loading ? (
        <div className="flex flex-col items-center justify-center py-8 text-zinc-500 gap-2">
          <Loader2 size={20} className="animate-spin text-indigo-500" />
          <span className="text-xs">Loading conversations...</span>
        </div>
      ) : filteredConversations.length === 0 ? (
        <div className="text-center py-8 text-zinc-600 text-xs">
          {searchQuery ? "No conversations found" : "No recent conversations"}
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groups).map(([groupName, groupChats]) => {
            if (groupChats.length === 0) return null;

            return (
              <div key={groupName} className="space-y-1">
                <h4 className="px-2 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider mb-2">
                  {groupName}
                </h4>
                {groupChats.map((chat) => {
                  const isActive = chat.id === activeConversationId;
                  const isRenaming = chat.id === renamingId;

                  return (
                    <div
                      key={chat.id}
                      onClick={() => handleChatClick(chat.id)}
                      className={cn(
                        "group relative flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition-all duration-200 cursor-pointer border",
                        isActive
                          ? "bg-[#202020] border-[#2c2c2c] text-zinc-100 font-medium"
                          : "bg-transparent border-transparent text-zinc-400 hover:bg-[#1a1a1a] hover:text-zinc-200"
                      )}
                    >
                      <MessageSquare size={16} className="shrink-0 text-zinc-500" />

                      {isRenaming ? (
                        <div className="flex items-center gap-1 flex-1 min-w-0" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="text"
                            value={renameTitle}
                            onChange={(e) => setRenameTitle(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") saveRename(chat.id);
                              if (e.key === "Escape") setRenamingId(null);
                            }}
                            autoFocus
                            className="bg-[#2c2c2c] border border-indigo-500 text-zinc-100 text-xs px-2 py-0.5 rounded-md w-full focus:outline-none"
                          />
                          <button
                            onClick={() => saveRename(chat.id)}
                            disabled={isMutating}
                            className="text-green-400 hover:text-green-300 p-0.5 bg-transparent border-none cursor-pointer"
                          >
                            <Check size={12} />
                          </button>
                          <button
                            onClick={() => setRenamingId(null)}
                            className="text-red-400 hover:text-red-300 p-0.5 bg-transparent border-none cursor-pointer"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ) : (
                        <span className="truncate flex-1 pr-8 text-xs">{chat.title || "New Chat"}</span>
                      )}

                      {!isRenaming && (
                        <div className="absolute right-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center">
                          <DropdownMenu>
                            <DropdownMenuTrigger
                              onClick={(e) => e.stopPropagation()}
                              className="h-6 w-6 hover:bg-[#2a2a2a] flex items-center justify-center rounded-lg text-zinc-400 border-none bg-transparent outline-none cursor-pointer"
                            >
                              <MoreHorizontal size={14} />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-36 bg-[#1f1f1f] border-[#2c2c2c] text-zinc-300 rounded-xl shadow-xl">
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  startRename(chat.id, chat.title || "New Chat");
                                }}
                                className="gap-2 text-xs focus:bg-[#282828] focus:text-zinc-100 rounded-lg cursor-pointer"
                              >
                                <Pencil size={12} /> Rename
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDelete(chat.id);
                                }}
                                className="gap-2 text-xs focus:bg-[#282828] text-red-400 focus:text-red-400 rounded-lg cursor-pointer"
                              >
                                <Trash2 size={12} /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
