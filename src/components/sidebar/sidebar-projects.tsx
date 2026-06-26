"use client";

import { useEffect, useState } from "react";
import { 
  FolderKanban, 
  Plus, 
  ChevronRight, 
  ChevronDown, 
  MoreHorizontal, 
  Pencil, 
  Trash2, 
  MessageSquare,
  PlusCircle,
  FolderOpen,
  Check,
  X,
  Loader2
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useChatStore } from "@/store/use-chat-store";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface ProjectConversation {
  id: string;
  title: string;
  updatedAt: string;
}

interface Project {
  id: string;
  name: string;
  description: string | null;
  conversations: ProjectConversation[];
}

export function SidebarProjects() {
  const {
    activeConversationId,
    setActiveConversationId,
    activeProjectId,
    setActiveProjectId,
    refreshSidebarCounter,
    triggerSidebarRefresh,
  } = useChatStore();

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedProjectIds, setExpandedProjectIds] = useState<Record<string, boolean>>({});
  
  // Creation state
  const [isCreating, setIsCreating] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [isMutating, setIsMutating] = useState(false);

  // Renaming state
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameName, setRenameName] = useState("");

  // Fetch projects
  useEffect(() => {
    async function loadProjects() {
      try {
        const response = await fetch("/api/projects");
        if (response.ok) {
          const data = await response.json();
          setProjects(data);
        }
      } catch (err) {
        console.error("Failed to load projects:", err);
      } finally {
        setLoading(false);
      }
    }
    loadProjects();
  }, [refreshSidebarCounter]);

  // Expand project automatically if its conversation is active
  useEffect(() => {
    if (activeConversationId && projects.length > 0) {
      const activeProj = projects.find(p => 
        p.conversations.some(c => c.id === activeConversationId)
      );
      if (activeProj) {
        setExpandedProjectIds(prev => ({
          ...prev,
          [activeProj.id]: true
        }));
        setActiveProjectId(activeProj.id);
      }
    }
  }, [activeConversationId, projects, setActiveProjectId]);

  const toggleExpand = (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedProjectIds(prev => ({
      ...prev,
      [projectId]: !prev[projectId]
    }));
  };

  const handleProjectSelect = (projectId: string) => {
    setActiveProjectId(projectId === activeProjectId ? null : projectId);
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim() || isMutating) return;
    setIsMutating(true);

    try {
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: projectName.trim() }),
      });

      if (response.ok) {
        const newProj = await response.json();
        toast.success(`Project "${newProj.name}" created`);
        setProjectName("");
        setIsCreating(false);
        triggerSidebarRefresh();
      } else {
        toast.error("Failed to create project");
      }
    } catch (err) {
      toast.error("Error creating project");
    } finally {
      setIsMutating(false);
    }
  };

  const handleStartRename = (id: string, name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRenamingId(id);
    setRenameName(name);
  };

  const handleSaveRename = async (id: string) => {
    if (!renameName.trim() || isMutating) return;
    setIsMutating(true);

    try {
      const response = await fetch(`/api/projects/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: renameName.trim() }),
      });

      if (response.ok) {
        toast.success("Project renamed");
        setRenamingId(null);
        triggerSidebarRefresh();
      } else {
        toast.error("Failed to rename project");
      }
    } catch (err) {
      toast.error("Error renaming project");
    } finally {
      setIsMutating(false);
    }
  };

  const handleDeleteProject = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isMutating) return;
    setIsMutating(true);

    try {
      const response = await fetch(`/api/projects/${id}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("Project deleted");
        if (activeProjectId === id) {
          setActiveProjectId(null);
        }
        triggerSidebarRefresh();
      } else {
        toast.error("Failed to delete project");
      }
    } catch (err) {
      toast.error("Error deleting project");
    } finally {
      setIsMutating(false);
    }
  };

  const startNewChatInProject = (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveProjectId(projectId);
    setActiveConversationId(null);
    setExpandedProjectIds(prev => ({
      ...prev,
      [projectId]: true
    }));
    toast.success("Opened new conversation in project");
  };

  return (
    <div className="flex flex-col gap-2 mb-4">
      <div className="flex items-center justify-between px-2 py-1">
        <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
          Projects
        </span>
        <button
          onClick={() => setIsCreating(!isCreating)}
          className="text-zinc-500 hover:text-zinc-200 transition-colors p-0.5 bg-transparent border-none cursor-pointer"
        >
          <Plus size={14} />
        </button>
      </div>

      {/* Inline Create Input */}
      {isCreating && (
        <form onSubmit={handleCreateProject} className="flex items-center gap-1 px-2 mb-2">
          <input
            type="text"
            placeholder="New project name..."
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            className="bg-[#202020] border border-[#2c2c2c] text-zinc-100 text-xs px-2 py-1.5 rounded-lg w-full focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
            autoFocus
          />
          <button
            type="submit"
            disabled={isMutating}
            className="text-green-400 hover:text-green-300 p-1 bg-transparent border-none cursor-pointer"
          >
            <Check size={14} />
          </button>
          <button
            type="button"
            onClick={() => setIsCreating(false)}
            className="text-red-400 hover:text-red-300 p-1 bg-transparent border-none cursor-pointer"
          >
            <X size={14} />
          </button>
        </form>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-2 text-zinc-600 gap-1.5 text-xs">
          <Loader2 size={12} className="animate-spin text-indigo-500" />
          <span>Loading projects...</span>
        </div>
      ) : projects.length === 0 ? (
        <div className="px-2 text-zinc-600 text-xs py-1 italic">
          No projects created
        </div>
      ) : (
        <div className="space-y-1">
          {projects.map((project) => {
            const isExpanded = !!expandedProjectIds[project.id];
            const isProjectSelected = activeProjectId === project.id;
            const isRenaming = renamingId === project.id;

            return (
              <div key={project.id} className="space-y-1">
                {/* Project Row */}
                <div
                  onClick={() => handleProjectSelect(project.id)}
                  className={cn(
                    "group relative flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition-all duration-200 cursor-pointer border",
                    isProjectSelected
                      ? "bg-[#202020] border-[#2c2c2c]/80 text-zinc-100 font-medium"
                      : "bg-transparent border-transparent text-zinc-400 hover:bg-[#1a1a1a] hover:text-zinc-200"
                  )}
                >
                  <button
                    onClick={(e) => toggleExpand(project.id, e)}
                    className="text-zinc-500 hover:text-zinc-300 p-0.5 bg-transparent border-none cursor-pointer shrink-0"
                  >
                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </button>

                  <FolderKanban size={15} className={cn("shrink-0", isProjectSelected ? "text-indigo-400" : "text-zinc-500")} />

                  {isRenaming ? (
                    <div className="flex items-center gap-1 flex-1 min-w-0" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="text"
                        value={renameName}
                        onChange={(e) => setRenameName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleSaveRename(project.id);
                          if (e.key === "Escape") setRenamingId(null);
                        }}
                        autoFocus
                        className="bg-[#2c2c2c] border border-indigo-500 text-zinc-100 text-xs px-2 py-0.5 rounded-md w-full focus:outline-none"
                      />
                      <button
                        onClick={() => handleSaveRename(project.id)}
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
                    <span className="truncate flex-1 pr-8 text-xs">{project.name}</span>
                  )}

                  {/* Actions Dropdown on Hover */}
                  {!isRenaming && (
                    <div className="absolute right-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-0.5">
                      <button
                        onClick={(e) => startNewChatInProject(project.id, e)}
                        className="h-6 w-6 hover:bg-[#2a2a2a] flex items-center justify-center rounded-lg text-zinc-400 border-none bg-transparent outline-none cursor-pointer"
                        title="New chat in project"
                      >
                        <PlusCircle size={13} />
                      </button>
                      
                      <DropdownMenu>
                        <DropdownMenuTrigger
                          onClick={(e) => e.stopPropagation()}
                          className="h-6 w-6 hover:bg-[#2a2a2a] flex items-center justify-center rounded-lg text-zinc-400 border-none bg-transparent outline-none cursor-pointer"
                        >
                          <MoreHorizontal size={14} />
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-36 bg-[#1f1f1f] border-[#2c2c2c] text-zinc-300 rounded-xl shadow-xl">
                          <DropdownMenuItem
                            onClick={(e) => handleStartRename(project.id, project.name, e)}
                            className="gap-2 text-xs focus:bg-[#282828] focus:text-zinc-100 rounded-lg cursor-pointer"
                          >
                            <Pencil size={12} /> Rename
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => handleDeleteProject(project.id, e)}
                            className="gap-2 text-xs focus:bg-[#282828] text-red-400 focus:text-red-400 rounded-lg cursor-pointer"
                          >
                            <Trash2 size={12} /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )}
                </div>

                {/* Expanded Project Conversations */}
                {isExpanded && (
                  <div className="pl-6 space-y-0.5 border-l border-zinc-800 ml-5 mt-0.5 mb-1.5">
                    {project.conversations.length === 0 ? (
                      <div className="text-[10px] text-zinc-600 py-1 pl-2 italic">
                        No conversations
                      </div>
                    ) : (
                      project.conversations.map((chat) => {
                        const isChatActive = chat.id === activeConversationId;
                        return (
                          <div
                            key={chat.id}
                            onClick={() => setActiveConversationId(chat.id)}
                            className={cn(
                              "flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs transition-colors cursor-pointer border",
                              isChatActive
                                ? "bg-[#202020] border-[#2c2c2c] text-zinc-100 font-medium"
                                : "bg-transparent border-transparent text-zinc-500 hover:bg-[#1a1a1a] hover:text-zinc-300"
                            )}
                          >
                            <MessageSquare size={13} className="shrink-0 text-zinc-600" />
                            <span className="truncate flex-1">{chat.title || "New Chat"}</span>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
