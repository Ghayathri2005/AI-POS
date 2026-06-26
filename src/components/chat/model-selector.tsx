"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown, Sparkles, Zap, Brain, Globe } from "lucide-react";
import { useChatStore } from "@/store/use-chat-store";
import { cn } from "@/lib/utils";

const MODELS = [
  { id: "gpt-4o", name: "GPT-4o", description: "Our most capable model", icon: Sparkles, color: "text-purple-400" },
  { id: "gpt-4-turbo", name: "GPT-4 Turbo", description: "Fast and reliable", icon: Zap, color: "text-yellow-400" },
  { id: "claude-3-5-sonnet", name: "Claude 3.5 Sonnet", description: "Excellent reasoning", icon: Brain, color: "text-orange-400" },
  { id: "gemini-1-5-pro", name: "Gemini (100% Free)", description: "Unlimited Free Assistant", icon: Globe, color: "text-blue-400" },
];

export function ModelSelector() {
  const { currentModel, setCurrentModel } = useChatStore();
  const selectedModel = MODELS.find(m => m.id === currentModel) || MODELS[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <button className="gap-2 px-3 hover:bg-[#262626] text-zinc-100 font-semibold text-lg inline-flex items-center rounded-lg h-9 transition-colors border-none bg-transparent outline-none cursor-pointer" />
        }
      >
        {selectedModel.name}
        <ChevronDown size={16} className="text-zinc-500" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-72 bg-[#1f1f1f] border-[#333333] p-2">
        {MODELS.map((model) => (
          <DropdownMenuItem
            key={model.id}
            onClick={() => setCurrentModel(model.id)}
            className={cn(
              "flex flex-col items-start gap-1 p-3 rounded-lg focus:bg-[#262626] cursor-pointer",
              currentModel === model.id ? "bg-[#262626]" : "bg-transparent"
            )}
          >
            <div className="flex items-center gap-2 w-full">
              <model.icon size={16} className={model.color} />
              <span className="font-medium text-zinc-100">{model.name}</span>
              {currentModel === model.id && (
                <div className="ml-auto w-2 h-2 rounded-full bg-indigo-500" />
              )}
            </div>
            <span className="text-xs text-zinc-500">{model.description}</span>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator className="bg-[#333333]" />
        <DropdownMenuItem className="p-3 focus:bg-[#262626] text-xs text-indigo-400 font-medium">
          Manage Models
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
