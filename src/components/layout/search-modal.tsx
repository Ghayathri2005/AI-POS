"use client";

import { useEffect, useState } from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { MessageSquare, Settings, User, Plus, Search } from "lucide-react";
import { useRouter } from "next/navigation";

export function SearchModal() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Type a command or search chats..." />
      <CommandList className="bg-[#171717] text-zinc-100">
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Suggestions">
          <CommandItem className="gap-2 p-3 focus:bg-[#262626] cursor-pointer">
            <Plus size={16} />
            <span>New Chat</span>
          </CommandItem>
          <CommandItem className="gap-2 p-3 focus:bg-[#262626] cursor-pointer">
            <Search size={16} />
            <span>Search Messages</span>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator className="bg-[#262626]" />
        <CommandGroup heading="Recent Chats">
          <CommandItem className="gap-2 p-3 focus:bg-[#262626] cursor-pointer">
            <MessageSquare size={16} />
            <span>Project Brainstorming</span>
          </CommandItem>
          <CommandItem className="gap-2 p-3 focus:bg-[#262626] cursor-pointer">
            <MessageSquare size={16} />
            <span>React Performance Tips</span>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator className="bg-[#262626]" />
        <CommandGroup heading="Settings">
          <CommandItem className="gap-2 p-3 focus:bg-[#262626] cursor-pointer">
            <User size={16} />
            <span>Profile</span>
          </CommandItem>
          <CommandItem className="gap-2 p-3 focus:bg-[#262626] cursor-pointer">
            <Settings size={16} />
            <span>Settings</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
