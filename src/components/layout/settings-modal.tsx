"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { 
  Settings as SettingsIcon, 
  User, 
  Brain, 
  Shield, 
  Bell,
  Moon,
  Sun,
  Monitor,
  Loader2,
  Lock,
  ChevronRight,
  Eye,
  EyeOff
} from "lucide-react";
import { useTheme } from "@/providers/theme-provider";
import { toast } from "sonner";
import { useChatStore } from "@/store/use-chat-store";
import { cn } from "@/lib/utils";

type TabType = "general" | "ai" | "security" | "notifications";

export function SettingsModal({ children }: { children: React.ReactNode }) {
  const { setTheme, theme } = useTheme();
  const { currentModel, setCurrentModel } = useChatStore();
  
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("general");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // General States
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [tempTheme, setTempTheme] = useState<"light" | "dark" | "system">("dark");

  // AI States
  const [aiModel, setAiModel] = useState("gemini-1-5-pro");
  const [temperature, setTemperature] = useState(0.7);
  const [systemInstruction, setSystemInstruction] = useState("You are AI-POS, a premium AI assistant.");

  // Security States
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPass, setShowPass] = useState(false);

  // Notification States
  const [desktopAlerts, setDesktopAlerts] = useState(true);
  const [emailDigests, setEmailDigests] = useState(false);
  const [soundFx, setSoundFx] = useState(true);

  // Load current settings from backend when dialog opens
  useEffect(() => {
    if (!isOpen) return;

    async function loadSettings() {
      setIsLoading(true);
      try {
        const response = await fetch("/api/user/settings");
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setUsername(data.profile.name);
            setEmail(data.profile.email);
            if (data.settings) {
              setAiModel(data.settings.defaultModel);
              setTemperature(data.settings.temperature);
              if (data.settings.theme) {
                setTempTheme(data.settings.theme as any);
              }
            }
          }
        } else {
          toast.error("Failed to load your account settings.");
        }
      } catch (err) {
        console.error("Error loading settings:", err);
      } finally {
        setIsLoading(false);
      }
    }

    loadSettings();
  }, [isOpen]);

  const handleSaveChanges = async () => {
    setIsSaving(true);
    try {
      // Validate passwords if user fills them
      if (newPassword || confirmPassword || currentPassword) {
        if (!currentPassword) {
          toast.error("Please enter your current password to make security changes.");
          setIsSaving(false);
          return;
        }
        if (newPassword !== confirmPassword) {
          toast.error("New passwords do not match.");
          setIsSaving(false);
          return;
        }
        if (newPassword.length < 6) {
          toast.error("New password must be at least 6 characters.");
          setIsSaving(false);
          return;
        }
      }

      const response = await fetch("/api/user/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: username,
          theme: tempTheme,
          defaultModel: aiModel,
          temperature: temperature,
          currentPassword: currentPassword || undefined,
          newPassword: newPassword || undefined
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        setTheme(tempTheme);
        toast.success("Settings updated successfully!");
        
        // Update global store model as well
        setCurrentModel(aiModel);
        
        // Clear passwords fields
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        
        // Close modal
        setIsOpen(false);
      } else {
        toast.error(data.error || "Failed to update settings.");
      }
    } catch (err) {
      console.error("Error saving settings:", err);
      toast.error("An error occurred while saving your settings.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    const savedTheme = (localStorage.getItem("theme") as any) || "dark";
    setTheme(savedTheme);
    setIsOpen(false);
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      const savedTheme = (localStorage.getItem("theme") as any) || "dark";
      setTheme(savedTheme);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger render={children as any}>
      </DialogTrigger>
      <DialogContent className="max-w-2xl sm:max-w-2xl bg-[#171717] border-[#262626] text-zinc-100 p-0 overflow-hidden rounded-2xl shadow-2xl">
        <DialogHeader className="p-5 border-b border-[#262626] bg-[#1a1a1a]">
          <DialogTitle className="text-xl font-bold flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <SettingsIcon size={18} />
            </div>
            Settings Workspace
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex h-[450px]">
          {/* Navigation Sidebar */}
          <div className="w-48 border-r border-[#262626] bg-[#141414] p-3 flex flex-col gap-1 shrink-0">
            <Button 
              variant="ghost" 
              onClick={() => setActiveTab("general")}
              className={cn(
                "justify-start gap-2.5 h-10 px-3 rounded-xl text-xs font-semibold cursor-pointer transition-all",
                activeTab === "general" 
                  ? "bg-[#262626] text-zinc-100 shadow-md" 
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-[#202020]"
              )}
            >
              <User size={15} /> General Details
            </Button>
            
            <Button 
              variant="ghost" 
              onClick={() => setActiveTab("ai")}
              className={cn(
                "justify-start gap-2.5 h-10 px-3 rounded-xl text-xs font-semibold cursor-pointer transition-all",
                activeTab === "ai" 
                  ? "bg-[#262626] text-zinc-100 shadow-md" 
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-[#202020]"
              )}
            >
              <Brain size={15} /> AI Configuration
            </Button>
            
            <Button 
              variant="ghost" 
              onClick={() => setActiveTab("security")}
              className={cn(
                "justify-start gap-2.5 h-10 px-3 rounded-xl text-xs font-semibold cursor-pointer transition-all",
                activeTab === "security" 
                  ? "bg-[#262626] text-zinc-100 shadow-md" 
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-[#202020]"
              )}
            >
              <Shield size={15} /> Security & Key
            </Button>
            
            <Button 
              variant="ghost" 
              onClick={() => setActiveTab("notifications")}
              className={cn(
                "justify-start gap-2.5 h-10 px-3 rounded-xl text-xs font-semibold cursor-pointer transition-all",
                activeTab === "notifications" 
                  ? "bg-[#262626] text-zinc-100 shadow-md" 
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-[#202020]"
              )}
            >
              <Bell size={15} /> Alerts & Audio
            </Button>
          </div>
          
          {/* Main Settings Content Area */}
          <div className="flex-1 p-6 overflow-y-auto bg-[#171717]">
            {isLoading ? (
              <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                <Loader2 className="h-7 w-7 text-indigo-500 animate-spin" />
                <span className="text-xs text-zinc-500">Loading settings...</span>
              </div>
            ) : (
              <div className="space-y-6">
                
                {/* 1. GENERAL TAB */}
                {activeTab === "general" && (
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <h4 className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Theme Palette</h4>
                      <div className="flex items-center justify-between bg-[#1e1e1e] p-3 rounded-xl border border-[#262626]">
                        <div className="space-y-0.5">
                          <Label className="text-xs font-bold text-zinc-200">System Theme</Label>
                          <p className="text-[10px] text-zinc-500">Choose your workspace light/dark vibe</p>
                        </div>
                        <div className="flex bg-[#0a0a0a] p-1 rounded-lg border border-[#262626]">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className={cn("h-7 w-8 rounded-md cursor-pointer", tempTheme === "light" ? "bg-[#262626] text-white" : "text-zinc-500 hover:text-zinc-300")}
                            onClick={() => {
                              setTempTheme("light");
                              setTheme("light");
                            }}
                          >
                            <Sun size={13} />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className={cn("h-7 w-8 rounded-md cursor-pointer", tempTheme === "dark" ? "bg-[#262626] text-white" : "text-zinc-500 hover:text-zinc-300")}
                            onClick={() => {
                              setTempTheme("dark");
                              setTheme("dark");
                            }}
                          >
                            <Moon size={13} />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className={cn("h-7 w-8 rounded-md cursor-pointer", tempTheme === "system" ? "bg-[#262626] text-white" : "text-zinc-500 hover:text-zinc-300")}
                            onClick={() => {
                              setTempTheme("system");
                              setTheme("system");
                            }}
                          >
                            <Monitor size={13} />
                          </Button>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Profile details</h4>
                      
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold text-zinc-300">Display Username</Label>
                        <Input 
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          placeholder="Your display name" 
                          className="bg-[#0a0a0a] border-[#262626] focus-visible:ring-indigo-500 text-xs rounded-xl h-9" 
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-xs font-semibold text-zinc-500">Email Address (Locked)</Label>
                        <Input 
                          value={email}
                          disabled 
                          className="bg-[#0a0a0a] border-[#262626] opacity-40 text-xs rounded-xl h-9 select-none" 
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. AI CONFIGURATION TAB */}
                {activeTab === "ai" && (
                  <div className="space-y-5">
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-zinc-300">Default Chat Assistant Model</Label>
                      <select 
                        value={aiModel}
                        onChange={(e) => setAiModel(e.target.value)}
                        className="w-full bg-[#0a0a0a] border border-[#262626] focus:border-indigo-500 rounded-xl h-9 px-3 text-xs text-zinc-300 outline-none"
                      >
                        <option value="gemini-1-5-pro">Gemini (100% Free Tier)</option>
                        <option value="gpt-4o">GPT-4o (Elite Code & Logic)</option>
                        <option value="gpt-4o-mini">GPT-4o Mini (Cost-efficient)</option>
                        <option value="claude-3-5-sonnet">Claude 3.5 Sonnet (Advanced Logic)</option>
                      </select>
                    </div>

                    <div className="space-y-2.5">
                      <div className="flex justify-between items-center">
                        <Label className="text-xs font-semibold text-zinc-300">Creativity Temperature</Label>
                        <span className="text-[10px] bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold px-2 py-0.5 rounded-md">{temperature}</span>
                      </div>
                      <input 
                        type="range"
                        min="0"
                        max="1.5"
                        step="0.1"
                        value={temperature}
                        onChange={(e) => setTemperature(parseFloat(e.target.value))}
                        className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 my-4 outline-none"
                      />
                      <p className="text-[10px] text-zinc-500 leading-relaxed">Higher creativity makes responses more imaginative and fluid; lower values make it precise and factual.</p>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs font-semibold text-zinc-300">Custom System Prompt Persona</Label>
                      <textarea
                        value={systemInstruction}
                        onChange={(e) => setSystemInstruction(e.target.value)}
                        placeholder="Customize how the AI acts and speaks..."
                        className="w-full bg-[#0a0a0a] border border-[#262626] focus:border-indigo-500 rounded-xl p-3 text-xs text-zinc-300 outline-none h-24 resize-none leading-relaxed"
                      />
                    </div>
                  </div>
                )}

                {/* 3. SECURITY TAB */}
                {activeTab === "security" && (
                  <div className="space-y-4">
                    <h4 className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1.5"><Lock size={12} /> Change Account Password</h4>
                    
                    <div className="space-y-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-zinc-300">Current Password</Label>
                        <div className="relative">
                          <Input 
                            type={showPass ? "text" : "password"} 
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            placeholder="Enter current password" 
                            className="bg-[#0a0a0a] border-[#262626] focus-visible:ring-indigo-500 text-xs rounded-xl h-9 pr-9" 
                          />
                          <button 
                            type="button" 
                            onClick={() => setShowPass(!showPass)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300"
                          >
                            {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-zinc-300">New Password</Label>
                        <Input 
                          type="password" 
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="At least 6 characters" 
                          className="bg-[#0a0a0a] border-[#262626] focus-visible:ring-indigo-500 text-xs rounded-xl h-9" 
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label className="text-xs font-semibold text-zinc-300">Confirm New Password</Label>
                        <Input 
                          type="password" 
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="Re-type new password" 
                          className="bg-[#0a0a0a] border-[#262626] focus-visible:ring-indigo-500 text-xs rounded-xl h-9" 
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. NOTIFICATIONS TAB */}
                {activeTab === "notifications" && (
                  <div className="space-y-4">
                    <h4 className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest">Alert Preferences</h4>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between bg-[#1e1e1e] p-3 rounded-xl border border-[#262626]">
                        <div className="space-y-0.5">
                          <Label className="text-xs font-bold text-zinc-200">Realtime Desktop Alerts</Label>
                          <p className="text-[10px] text-zinc-500">Show notification banners for AI alerts</p>
                        </div>
                        <Switch 
                          checked={desktopAlerts}
                          onCheckedChange={(checked) => {
                            setDesktopAlerts(checked);
                            toast.success(`Desktop alerts ${checked ? "enabled" : "disabled"}`);
                          }}
                        />
                      </div>

                      <div className="flex items-center justify-between bg-[#1e1e1e] p-3 rounded-xl border border-[#262626]">
                        <div className="space-y-0.5">
                          <Label className="text-xs font-bold text-zinc-200">Weekly Email Digest</Label>
                          <p className="text-[10px] text-zinc-500">Get summary of your AI conversations weekly</p>
                        </div>
                        <Switch 
                          checked={emailDigests}
                          onCheckedChange={(checked) => {
                            setEmailDigests(checked);
                            toast.success(`Email digests ${checked ? "enabled" : "disabled"}`);
                          }}
                        />
                      </div>

                      <div className="flex items-center justify-between bg-[#1e1e1e] p-3 rounded-xl border border-[#262626]">
                        <div className="space-y-0.5">
                          <Label className="text-xs font-bold text-zinc-200">Workspace Sound FX</Label>
                          <p className="text-[10px] text-zinc-500">Play delicate audio click events on interaction</p>
                        </div>
                        <Switch 
                          checked={soundFx}
                          onCheckedChange={(checked) => {
                            setSoundFx(checked);
                            toast.success(`Interface sound effects ${checked ? "enabled" : "disabled"}`);
                          }}
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Footer Save Changes Row */}
                <div className="pt-4 border-t border-[#262626] flex items-center justify-end gap-3 mt-6">
                  <Button 
                    type="button" 
                    variant="ghost" 
                    onClick={handleCancel}
                    className="text-xs text-zinc-400 hover:text-zinc-100 hover:bg-[#262626] rounded-xl cursor-pointer"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSaveChanges}
                    disabled={isSaving}
                    className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs rounded-xl px-4 py-2 cursor-pointer shadow-lg shadow-indigo-600/10 flex items-center gap-1.5"
                  >
                    {isSaving && <Loader2 size={13} className="animate-spin" />}
                    Save Settings
                  </Button>
                </div>

              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
