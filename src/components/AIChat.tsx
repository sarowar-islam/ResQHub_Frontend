import { useState, useRef, useEffect } from "react";
import { X, Send, Bot, User, Loader2, Zap, RotateCcw } from "lucide-react";
import { sendAiChat } from "../lib/api";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const SUGGESTED_PROMPTS = [
  { label: "Current operations", key: "operations" },
  { label: "Prioritize open requests", key: "prioritize" },
  { label: "Shelter capacity", key: "shelters" },
  { label: "Low relief supplies", key: "supplies" },
];

interface AIChatProps {
  isOpen: boolean;
  onClose: () => void;
}

const createWelcomeMessage = (): Message => ({
  id: "init",
  role: "assistant",
  content: "Hi! I can check the latest information saved in ResQHub, including requests, shelters, volunteers, campaigns, supplies, and alerts. What would you like to know?",
  timestamp: new Date(),
});

function formatContent(text: string) {
  const lines = text.split("\n");
  return lines.map((line, i) => {
    if (line.startsWith("**") && line.endsWith("**")) {
      return <p key={i} className="font-bold text-[#0f1b2d] mb-1">{line.slice(2, -2)}</p>;
    }
    const numbered = line.match(/^(\d+)[.)]\s+(.+)$/);
    if (numbered) {
      const parts = numbered[2].replace(/\*\*/g, "").split(" — ");
      return (
        <p key={i} className="mb-0.5 text-xs">
          <span className="font-semibold">{numbered[1]}. {parts[0]}</span>
          {parts[1] ? <span className="text-[#5a7190]"> — {parts[1]}</span> : null}
        </p>
      );
    }
    if (/^[-*]\s+/.test(line)) {
      return <p key={i} className="mb-0.5 pl-2 text-xs">• {line.slice(2)}</p>;
    }
    if (line.trim() === "") return <div key={i} className="h-1" />;
    const escaped = line.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const boldReplaced = escaped.replace(/\*\*(.+?)\*\*/g, (_, p1) => `<strong>${p1}</strong>`);
    return <p key={i} className="text-xs leading-relaxed mb-0.5" dangerouslySetInnerHTML={{ __html: boldReplaced }} />;
  });
}

export default function AIChat({ isOpen, onClose }: AIChatProps) {
  const [messages, setMessages] = useState<Message[]>(() => [createWelcomeMessage()]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: Message = { id: Date.now().toString(), role: "user", content: text, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const history = [...messages.filter(message => message.id !== "init"), userMsg]
        .map(({ role, content }) => ({ role, content }))
        .slice(-12);
      if (history[0]?.role === "assistant") history.shift();
      const { reply } = await sendAiChat(history);
      const aiMsg: Message = { id: (Date.now() + 1).toString(), role: "assistant", content: reply, timestamp: new Date() };
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `I couldn't reach the AI assistant: ${message}`,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiMsg]);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end p-4 pointer-events-none">
      <div className="pointer-events-auto w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-gray-100 flex flex-col overflow-hidden" style={{ height: "520px" }}>
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100" style={{ background: "#1e3a5f" }}>
          <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-white">ResQHub AI</p>
            <p className="text-[10px] text-blue-200">Supabase project data · Gemini AI</p>
          </div>
          <button
            onClick={() => setMessages([createWelcomeMessage()])}
            disabled={loading}
            title="Start a new chat"
            aria-label="Start a new chat"
            className="text-white/60 hover:text-white transition-colors disabled:opacity-40"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button onClick={onClose} title="Close chat" aria-label="Close chat" className="text-white/60 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ background: "#f8fafc" }}>
          {messages.map(msg => (
            <div key={msg.id} className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
              <div className={`w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center mt-0.5 ${msg.role === "assistant" ? "bg-[#1e3a5f]" : "bg-[#0d9488]"}`}>
                {msg.role === "assistant" ? <Bot className="w-3 h-3 text-white" /> : <User className="w-3 h-3 text-white" />}
              </div>
              <div className={`max-w-[85%] rounded-xl px-3 py-2 ${msg.role === "assistant" ? "bg-white border border-gray-100 shadow-sm" : "bg-[#0d9488] text-white"}`}>
                {msg.role === "assistant"
                  ? <div className="text-xs text-[#0f1b2d]">{formatContent(msg.content)}</div>
                  : <p className="text-xs text-white">{msg.content}</p>
                }
                <p className={`text-[9px] mt-1 ${msg.role === "assistant" ? "text-gray-400" : "text-teal-100"}`}>
                  {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-2">
              <div className="w-6 h-6 rounded-full bg-[#1e3a5f] flex items-center justify-center flex-shrink-0">
                <Bot className="w-3 h-3 text-white" />
              </div>
              <div className="bg-white border border-gray-100 shadow-sm rounded-xl px-3 py-2.5 flex gap-1 items-center">
                <div className="w-1.5 h-1.5 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-1.5 h-1.5 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-1.5 h-1.5 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Suggested prompts */}
        <div className="px-3 py-2 border-t border-gray-100 bg-white">
          <p className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Suggested</p>
          <div className="flex flex-wrap gap-1">
            {SUGGESTED_PROMPTS.map(p => (
              <button
                key={p.key}
                onClick={() => sendMessage(p.label)}
                disabled={loading}
                className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-full border border-gray-200 text-[#1e3a5f] hover:border-[#1e3a5f] hover:bg-blue-50 transition-colors disabled:opacity-50"
              >
                <Zap className="w-2.5 h-2.5" />
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Input */}
        <div className="px-3 pb-3 bg-white">
          <div className="flex gap-2 items-end">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(input); } }}
              maxLength={4000}
              aria-label="Message ResQHub AI"
              placeholder="Ask about current requests, shelters, or supplies..."
              rows={1}
              className="flex-1 resize-none text-xs bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-[#1e3a5f] focus:ring-2 focus:ring-[#1e3a5f]/10 transition-all"
              style={{ minHeight: "36px", maxHeight: "80px" }}
            />
            <button
              onClick={() => sendMessage(input)}
              disabled={loading || !input.trim()}
              className="w-9 h-9 flex-shrink-0 rounded-xl flex items-center justify-center text-white transition-all disabled:opacity-40"
              style={{ background: "#1e3a5f" }}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
