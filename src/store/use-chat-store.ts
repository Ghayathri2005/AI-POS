import { create } from "zustand";

interface ChatState {
  isSidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
  currentModel: string;
  setCurrentModel: (model: string) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  activeConversationId: string | null;
  setActiveConversationId: (id: string | null) => void;
  activeProjectId: string | null;
  setActiveProjectId: (id: string | null) => void;
  refreshSidebarCounter: number;
  triggerSidebarRefresh: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  isSidebarOpen: true,
  setSidebarOpen: (open) => set({ isSidebarOpen: open }),
  currentModel: "gemini-1-5-pro",
  setCurrentModel: (model) => set({ currentModel: model }),
  searchQuery: "",
  setSearchQuery: (query) => set({ searchQuery: query }),
  activeConversationId: null,
  setActiveConversationId: (id) => set({ activeConversationId: id }),
  activeProjectId: null,
  setActiveProjectId: (id) => set({ activeProjectId: id }),
  refreshSidebarCounter: 0,
  triggerSidebarRefresh: () => set((state) => ({ refreshSidebarCounter: state.refreshSidebarCounter + 1 })),
}));

