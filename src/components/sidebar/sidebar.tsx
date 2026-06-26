"use client";

import { useState, useRef, useEffect } from "react";
import { useChatStore } from "@/store/use-chat-store";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  Plus, 
  Search, 
  PanelLeftClose, 
  PanelLeftOpen,
  Settings,
  LogOut,
  Sparkles
} from "lucide-react";
import { SidebarHistory } from "./sidebar-history";
import { SidebarProjects } from "./sidebar-projects";
import { Input } from "@/components/ui/input";
import { motion, AnimatePresence } from "framer-motion";
import { SettingsModal } from "@/components/layout/settings-modal";
import { useSession, signOut } from "next-auth/react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

export function Sidebar() {
  const { data: session } = useSession();
  const { 
    isSidebarOpen, 
    setSidebarOpen, 
    searchQuery, 
    setSearchQuery,
    setActiveConversationId,
    triggerSidebarRefresh
  } = useChatStore();

  const [sidebarWidth, setSidebarWidth] = useState(260);
  const isResizing = useRef(false);

  useEffect(() => {
    // Load saved width
    const savedWidth = localStorage.getItem("sidebarWidth");
    if (savedWidth) {
      setSidebarWidth(parseInt(savedWidth, 10));
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing.current) return;
      let newWidth = e.clientX;
      if (newWidth < 200) newWidth = 200; // Min width
      if (newWidth > 600) newWidth = 600; // Max width
      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      if (isResizing.current) {
        isResizing.current = false;
        document.body.style.cursor = 'default';
        // Save to local storage when done resizing
        localStorage.setItem("sidebarWidth", sidebarWidth.toString());
      }
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [sidebarWidth]);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isResizing.current = true;
    document.body.style.cursor = 'col-resize';
  };

  const handleNewChat = () => {
    setActiveConversationId(null);
    toast.success("Opened empty conversation");
  };

  const handleSignOut = async () => {
    try {
      await signOut({ callbackUrl: "/login" });
      toast.success("Signed out successfully");
    } catch (err) {
      toast.error("Failed to sign out");
    }
  };

  const userInitial = session?.user?.name
    ? session.user.name.charAt(0).toUpperCase()
    : session?.user?.email
    ? session.user.email.charAt(0).toUpperCase()
    : "U";

  return (
    <>
      <motion.aside
        initial={false}
        animate={{ 
          width: isSidebarOpen ? sidebarWidth : 0,
          opacity: isSidebarOpen ? 1 : 0
        }}
        transition={{ type: "tween", duration: isResizing.current ? 0 : 0.2 }}
        className={cn(
          "fixed inset-y-0 left-0 z-40 md:relative h-full bg-[#171717] border-r border-[#262626] flex flex-col overflow-hidden",
          !isSidebarOpen && "border-none w-0"
        )}
      >
        {/* Resize Handle */}
        <div 
          className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-indigo-500/50 active:bg-indigo-500/80 transition-colors z-50"
          onMouseDown={handleMouseDown}
        />
        <div className="p-3 flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between mb-2 gap-1">
            <Button 
              variant="ghost" 
              className="flex-1 justify-start gap-2 text-zinc-100 hover:bg-[#262626] font-medium rounded-xl h-10 px-2"
              onClick={handleNewChat}
            >
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-[10px] font-bold shadow-lg shadow-indigo-500/10">
                AI
              </div>
              <span className="font-semibold text-zinc-200 text-sm">AI-POS</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="text-zinc-400 hover:text-zinc-100 h-8 w-8 hover:bg-[#262626] rounded-lg shrink-0 cursor-pointer"
              onClick={() => setSidebarOpen(false)}
            >
              <PanelLeftClose size={18} />
            </Button>
          </div>

          <Button 
            onClick={handleNewChat}
            className="w-full mb-3 justify-start gap-2 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 hover:from-indigo-500/20 hover:to-purple-500/20 text-zinc-100 border border-indigo-500/20 hover:border-indigo-500/30 rounded-xl h-10 shadow-none font-medium cursor-pointer"
          >
            <Plus size={18} className="text-indigo-400" />
            New Chat
          </Button>

          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" size={14} />
            <Input 
              placeholder="Search chats..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-[#202020] border-[#2c2c2c] focus-visible:ring-indigo-500 text-xs h-9 rounded-xl focus:border-indigo-500"
            />
          </div>

          {/* Scrollable Middle Content Area */}
          <div className="flex-1 min-h-0 overflow-y-auto -mx-3 px-3 pr-2 space-y-4 scrollbar-thin">
            {/* Projects Area */}
            <SidebarProjects />

            {/* Chat History */}
            <SidebarHistory />
          </div>

          {/* Footer / Profile Section */}
          <div className="mt-auto pt-3 border-t border-[#262626] flex flex-col gap-1">
            <SettingsModal>
              <button className="w-full flex items-center gap-3 text-zinc-400 hover:text-zinc-200 hover:bg-[#262626] px-3 h-10 rounded-xl cursor-pointer transition-colors border-none bg-transparent outline-none text-left">
                <Settings size={16} />
                <span className="text-xs font-semibold">Settings</span>
              </button>
            </SettingsModal>

            {/* Profile Dropdown */}
            {session?.user && (
              <DropdownMenu>
                <DropdownMenuTrigger className="w-full flex items-center gap-3 text-zinc-400 hover:text-zinc-200 hover:bg-[#262626] px-3 py-2 rounded-xl cursor-pointer transition-all border-none bg-transparent outline-none text-left mt-1 hover:shadow-lg hover:shadow-indigo-500/5">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white shadow-md shadow-indigo-500/20">
                    {userInitial}
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <span className="text-xs font-bold text-zinc-200 truncate">{session.user.name || "User"}</span>
                    <span className="text-[10px] text-zinc-500 truncate">{session.user.email}</span>
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-52 bg-[#1f1f1f] border-[#2c2c2c] text-zinc-300 rounded-xl shadow-xl p-1 mb-2">
                  <div className="px-3 py-2 border-b border-[#2c2c2c] mb-1">
                    <p className="text-xs font-semibold text-zinc-400">Account</p>
                    <p className="text-[10px] text-zinc-500 truncate mt-0.5">{session.user.email}</p>
                  </div>
                  <DropdownMenuItem
                    onClick={handleSignOut}
                    className="gap-2 text-xs focus:bg-[#282828] text-red-400 focus:text-red-400 rounded-lg cursor-pointer py-2"
                  >
                    <LogOut size={14} /> Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </motion.aside>

      {/* Floating Toggle when sidebar is closed */}
      <AnimatePresence>
        {!isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="fixed left-4 top-4 z-50"
          >
            <Button
              variant="ghost"
              size="icon"
              className="text-zinc-400 hover:text-zinc-100 bg-[#171717]/80 backdrop-blur border border-[#262626] rounded-xl hover:bg-[#262626]"
              onClick={() => setSidebarOpen(true)}
            >
              <PanelLeftOpen size={18} />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </>
  );
}
