"use client";

import { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  ArrowUp, 
  Paperclip, 
  Globe, 
  Mic, 
  Square,
  FileText,
  Trash2
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ChatInputProps {
  input: string;
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleSubmit: (customText?: string) => void;
  isLoading: boolean;
  stop: () => void;
}

export function ChatInput({ input, handleInputChange, handleSubmit, isLoading, stop }: ChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // File upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Web search toggle state
  const [webSearchEnabled, setWebSearchEnabled] = useState(false);

  // Speech Recognition state
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  // Auto-resize textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      triggerSubmit();
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = () => {
          setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setImagePreview(null);
      }
      toast.success(`Attached ${file.name}`);
    }
  };

  const removeAttachment = () => {
    setSelectedFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    toast.success("Attachment removed");
  };

  const toggleWebSearch = () => {
    setWebSearchEnabled(!webSearchEnabled);
    toast.success(`Web Search ${!webSearchEnabled ? "Enabled" : "Disabled"}`);
  };

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      toast.success("Voice recording completed");
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Voice Speech Recognition is not supported by your browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      setIsListening(true);
      toast.success("Listening... Speak into your mic now!");
    };

    recognition.onresult = (event: any) => {
      const transcript = event.results[event.results.length - 1][0].transcript;
      const textarea = textareaRef.current;
      if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const oldText = textarea.value;
        const newText = oldText.substring(0, start) + transcript + oldText.substring(end);
        
        // Emulate input change
        const changeEvent = {
          target: { value: newText }
        } as React.ChangeEvent<HTMLTextAreaElement>;
        handleInputChange(changeEvent);

        setTimeout(() => {
          textarea.focus();
          textarea.selectionStart = textarea.selectionEnd = start + transcript.length;
        }, 50);
      }
    };

    recognition.onerror = (err: any) => {
      console.error("Speech Recognition Error:", err);
      setIsListening(false);
      toast.error("Microphone error or permission denied.");
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  };

  const triggerSubmit = async () => {
    if (isLoading) return;
    
    // Check if input has text or file is attached
    if (!(input || "").trim() && !selectedFile) {
      return;
    }

    if (selectedFile) {
      const readFileAsText = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string || "");
          reader.onerror = (e) => reject(e);
          reader.readAsText(file);
        });
      };

      const loadPdfJs = (): Promise<any> => {
        return new Promise((resolve, reject) => {
          if ((window as any).pdfjsLib) {
            resolve((window as any).pdfjsLib);
            return;
          }
          const script = document.createElement("script");
          script.src = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js";
          script.onload = () => {
            const pdfjs = (window as any).pdfjsLib;
            pdfjs.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
            resolve(pdfjs);
          };
          script.onerror = (e) => reject(e);
          document.head.appendChild(script);
        });
      };

      const readPdfAsText = async (file: File): Promise<string> => {
        const pdfjs = await loadPdfJs();
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;
        let fullText = "";

        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items
            .map((item: any) => item.str)
            .join(" ");
          fullText += `--- Page ${i} ---\n${pageText}\n\n`;
        }
        return fullText;
      };

      try {
        let fileText = "";
        const isTextFile = selectedFile.type.startsWith("text/") || 
                           selectedFile.name.endsWith(".txt") ||
                           selectedFile.name.endsWith(".md") ||
                           selectedFile.name.endsWith(".json") ||
                           selectedFile.name.endsWith(".js") ||
                           selectedFile.name.endsWith(".jsx") ||
                           selectedFile.name.endsWith(".ts") ||
                           selectedFile.name.endsWith(".tsx") ||
                           selectedFile.name.endsWith(".py") ||
                           selectedFile.name.endsWith(".html") ||
                           selectedFile.name.endsWith(".css") ||
                           selectedFile.name.endsWith(".csv") ||
                           selectedFile.name.endsWith(".yaml") ||
                           selectedFile.name.endsWith(".yml");

        const isPdfFile = selectedFile.name.endsWith(".pdf");

        if (isTextFile) {
          fileText = await readFileAsText(selectedFile);
        } else if (isPdfFile) {
          toast.info("Extracting PDF contents...", { duration: 2500 });
          fileText = await readPdfAsText(selectedFile);
        }

        const attachmentText = (input || "").trim() 
          ? `${input}\n\n[Attached File: ${selectedFile.name}]\n\`\`\`\n${fileText}\n\`\`\`` 
          : `I've attached a file named "${selectedFile.name}".\n\`\`\`\n${fileText}\n\`\`\`\nCan you help me analyze this file?`;

        handleSubmit(attachmentText);
        
        // Reset input box
        const changeEvent = {
          target: { value: "" }
        } as React.ChangeEvent<HTMLTextAreaElement>;
        handleInputChange(changeEvent);

        // Clear attachments safely
        setSelectedFile(null);
        setImagePreview(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } catch (err) {
        console.error("Error reading file:", err);
        toast.error("Failed to read file content.");
      }
    } else {
      handleSubmit();
    }
  };

  const onSubmitHandler = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    triggerSubmit();
  };


  return (
    <form onSubmit={onSubmitHandler} className="relative">
      {/* Hidden File Input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
        accept="image/*,text/*,application/pdf"
      />

      <div className="bg-[#171717] border border-[#262626] rounded-2xl p-1.5 focus-within:border-[#333333] transition-all shadow-2xl shadow-black/50 flex flex-col gap-1.5">
        
        {/* Attachment Preview Card */}
        {selectedFile && (
          <div className="flex items-center gap-2 px-4 pt-2.5">
            {imagePreview ? (
              <div className="relative group w-14 h-14 rounded-xl overflow-hidden border border-[#262626] bg-[#0d0d0d] shadow-lg shadow-black/40">
                <img src={imagePreview} className="w-full h-full object-cover" alt="Attached Preview" />
                <button 
                  type="button"
                  onClick={removeAttachment}
                  className="absolute inset-0 bg-black/75 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-red-400 font-bold text-xs cursor-pointer"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 bg-[#202020] border border-[#2c2c2c] px-3.5 py-2 rounded-xl text-xs text-zinc-300 shadow-md">
                <FileText size={15} className="text-indigo-400 shrink-0" />
                <div className="flex flex-col">
                  <span className="max-w-[180px] truncate font-semibold">{selectedFile.name}</span>
                  <span className="text-[10px] text-zinc-500 font-mono">{(selectedFile.size / 1024).toFixed(1)} KB</span>
                </div>
                <button 
                  type="button"
                  onClick={removeAttachment}
                  className="text-zinc-500 hover:text-zinc-300 ml-1 font-bold text-base cursor-pointer px-1"
                >
                  ×
                </button>
              </div>
            )}
          </div>
        )}

        <textarea
          ref={textareaRef}
          id="chat-textarea"
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Message AI-POS..."
          className="w-full bg-transparent border-none focus:ring-0 resize-none py-3 px-4 text-zinc-100 placeholder:text-zinc-500 max-h-[200px] min-h-[52px] outline-none text-[15px]"
          rows={1}
        />
        
        <div className="flex items-center justify-between px-2 pb-1">
          <div className="flex items-center gap-1.5">
            {/* Paperclip (File Upload) */}
            <Button
              type="button"
              onClick={handleUploadClick}
              variant="ghost"
              size="icon"
              className={cn(
                "h-9 w-9 rounded-xl text-zinc-500 hover:text-zinc-100 hover:bg-[#262626] transition-all cursor-pointer",
                selectedFile && "text-indigo-400 bg-indigo-500/10 border border-indigo-500/20"
              )}
            >
              <Paperclip size={18} />
            </Button>
            
            {/* Globe (Web Search Toggle) */}
            <Button
              type="button"
              onClick={toggleWebSearch}
              variant="ghost"
              size="icon"
              className={cn(
                "h-9 w-9 rounded-xl transition-all cursor-pointer",
                webSearchEnabled 
                  ? "text-indigo-400 bg-indigo-500/15 border border-indigo-500/30" 
                  : "text-zinc-500 hover:text-zinc-100 hover:bg-[#262626]"
              )}
            >
              <Globe size={18} />
            </Button>
            
            {/* Mic (Voice Speech Recording) */}
            <Button
              type="button"
              onClick={toggleListening}
              variant="ghost"
              size="icon"
              className={cn(
                "h-9 w-9 rounded-xl transition-all cursor-pointer",
                isListening 
                  ? "text-red-400 bg-red-500/15 border border-red-500/30 animate-pulse" 
                  : "text-zinc-500 hover:text-zinc-100 hover:bg-[#262626]"
              )}
            >
              <Mic size={18} />
            </Button>
          </div>

          {isLoading ? (
            <Button
              type="button"
              onClick={stop}
              size="icon"
              className="h-9 w-9 rounded-xl bg-white text-black hover:bg-zinc-200 transition-all duration-200 cursor-pointer"
            >
              <Square size={16} fill="black" />
            </Button>
          ) : (
            <Button
              type="submit"
              disabled={!(input || "").trim() && !selectedFile}
              size="icon"
              className={cn(
                "h-9 w-9 rounded-xl transition-all duration-200 cursor-pointer",
                ((input || "").trim() || selectedFile) 
                  ? "bg-white text-black hover:bg-zinc-200" 
                  : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
              )}
            >
              <ArrowUp size={20} />
            </Button>
          )}
        </div>
      </div>
    </form>
  );
}
