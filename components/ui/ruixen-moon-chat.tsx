"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ImageIcon,
  FileUp,
  MonitorIcon,
  CircleUserRound,
  ArrowUpIcon,
  Paperclip,
  Code2,
  Palette,
  Layers,
  Rocket,
} from "lucide-react";

interface AutoResizeProps {
  minHeight: number;
  maxHeight?: number;
}

function useAutoResizeTextarea({ minHeight, maxHeight }: AutoResizeProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const adjustHeight = useCallback(
    (reset?: boolean) => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      if (reset) {
        textarea.style.height = `${minHeight}px`;
        return;
      }

      textarea.style.height = `${minHeight}px`; // reset first
      const newHeight = Math.max(
        minHeight,
        Math.min(textarea.scrollHeight, maxHeight ?? Infinity)
      );
      textarea.style.height = `${newHeight}px`;
    },
    [minHeight, maxHeight]
  );

  useEffect(() => {
    if (textareaRef.current) textareaRef.current.style.height = `${minHeight}px`;
  }, [minHeight]);

  return { textareaRef, adjustHeight };
}

export default function RuixenMoonChat() {
  const [message, setMessage] = useState("");
  const { textareaRef, adjustHeight } = useAutoResizeTextarea({
    minHeight: 48,
    maxHeight: 150,
  });

  return (
    <div
      className="relative w-full h-screen bg-cover bg-center flex flex-col items-center"
      style={{
        backgroundImage:
          "url('https://cdn.21st.dev/assets/mirror/c3/c333918af688a4a8a3d004652e6c0ee219457a9d84d380eeb31f513d4b59a09f.png')",
        backgroundAttachment: "fixed",
      }}
    >
      {/* Centered AI Title */}
      <div className="flex-1 w-full flex flex-col items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-semibold text-white drop-shadow-sm">
            Ruixen AI
          </h1>
          <p className="mt-2 text-neutral-200">
            Build something amazing — just start typing below.
          </p>
        </div>
      </div>

      {/* Input Box Section */}
      <div className="w-full max-w-3xl mb-[20vh]">
        <div className="relative bg-black/60 backdrop-blur-md rounded-xl border border-neutral-700">
          <Textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => {
              setMessage(e.target.value);
              adjustHeight();
            }}
            placeholder="Type your request..."
            className={cn(
              "w-full px-4 py-3 resize-none border-none",
              "bg-transparent text-white text-sm",
              "focus-visible:ring-0 focus-visible:ring-offset-0",
              "placeholder:text-neutral-400 min-h-[48px]"
            )}
            style={{ overflow: "hidden" }}
          />

          {/* Footer Buttons */}
          <div className="flex items-center justify-between p-3">
            <Button
              variant="ghost"
              size="icon"
              className="text-white hover:bg-neutral-700"
            >
              <Paperclip className="w-4 h-4" />
            </Button>

            <div className="flex items-center gap-2">
              <Button
                disabled={!message.trim()}
                className={cn(
                  "flex items-center gap-1 px-3 py-2 rounded-lg transition-colors",
                  message.trim()
                    ? "bg-violet-600 text-white cursor-pointer hover:bg-violet-500"
                    : "bg-neutral-700 text-neutral-400 cursor-not-allowed"
                )}
              >
                <ArrowUpIcon className="w-4 h-4" />
                <span className="sr-only">Send</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex items-center justify-center flex-wrap gap-3 mt-6">
          <QuickAction
            icon={<Code2 className="w-4 h-4" />}
            label="Generate Code"
            onClick={() => setMessage("Generate a full-stack responsive web application with authentication and dashboard")}
          />
          <QuickAction
            icon={<Rocket className="w-4 h-4" />}
            label="Launch App"
            onClick={() => setMessage("Create a modern SaaS landing page with animated hero, features grid, pricing, and waitlist form")}
          />
          <QuickAction
            icon={<Layers className="w-4 h-4" />}
            label="UI Components"
            onClick={() => setMessage("Build a sleek interactive component library with dark mode, glowing accents, and smooth transitions")}
          />
          <QuickAction
            icon={<Palette className="w-4 h-4" />}
            label="Theme Ideas"
            onClick={() => setMessage("Create a bespoke design system with cosmic dark mode, glassmorphism cards, and violet neon glows")}
          />
          <QuickAction
            icon={<CircleUserRound className="w-4 h-4" />}
            label="User Dashboard"
            onClick={() => setMessage("Build a responsive analytics user dashboard with metric cards, chart visualizations, and recent activity")}
          />
          <QuickAction
            icon={<MonitorIcon className="w-4 h-4" />}
            label="Landing Page"
            onClick={() => setMessage("Create a high-converting startup landing page with social proof, interactive demo, and lead capture")}
          />
          <QuickAction
            icon={<FileUp className="w-4 h-4" />}
            label="Upload Docs"
            onClick={() => setMessage("Create an interactive developer documentation portal with search, code snippets, and sidebar navigation")}
          />
          <QuickAction
            icon={<ImageIcon className="w-4 h-4" />}
            label="Image Assets"
            onClick={() => setMessage("Build an image gallery showcase with lightbox viewer, filters, and masonry layout")}
          />
        </div>
      </div>
    </div>
  );
}

interface QuickActionProps {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}

function QuickAction({ icon, label, onClick }: QuickActionProps) {
  return (
    <Button
      variant="outline"
      onClick={onClick}
      className="flex items-center gap-2 rounded-full border-neutral-700 bg-black/50 text-neutral-300 hover:text-white hover:bg-neutral-700 transition-all cursor-pointer"
    >
      {icon}
      <span className="text-xs">{label}</span>
    </Button>
  );
}
