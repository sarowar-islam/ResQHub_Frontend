import { useState, useRef, useEffect } from "react";
import { X, Send, Bot, User, Loader2, Zap } from "lucide-react";
import { db } from "../context/DataContext";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const SUGGESTED_PROMPTS = [
  { label: "Summarize field report", key: "summarize" },
  { label: "Prioritize requests", key: "prioritize" },
  { label: "Recommend nearby shelter", key: "shelter" },
  { label: "Generate relief summary", key: "generate" },
];

interface AIChatProps {
  isOpen: boolean;
  onClose: () => void;
}

function formatContent(text: string) {
  const lines = text.split("\n");
  return lines.map((line, i) => {
    if (line.startsWith("**") && line.endsWith("**")) {
      return <p key={i} className="font-bold text-[#0f1b2d] mb-1">{line.slice(2, -2)}</p>;
    }
    if (line.startsWith("1.") || line.startsWith("2.") || line.startsWith("3.") || line.startsWith("4.") || line.startsWith("5.")) {
      const parts = line.replace(/\*\*/g, "").split(" — ");
      return (
        <p key={i} className="mb-0.5 text-xs">
          <span className="font-semibold">{parts[0]}</span>
          {parts[1] ? <span className="text-[#5a7190]"> — {parts[1]}</span> : null}
        </p>
      );
    }
    if (line.trim() === "") return <div key={i} className="h-1" />;
    const escaped = line.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    const boldReplaced = escaped.replace(/\*\*(.+?)\*\*/g, (_, p1) => `<strong>${p1}</strong>`);
    return <p key={i} className="text-xs leading-relaxed mb-0.5" dangerouslySetInnerHTML={{ __html: boldReplaced }} />;
  });
}

// Answers are built from the live records the signed-in user can see (no canned text).
function answer(text: string): string {
  const lower = text.toLowerCase();
  const reqs = db.helpRequests;
  const open = reqs.filter(r => ["pending", "accepted", "assigned"].includes(r.status));
  const byType = (list: typeof reqs) => {
    const c: Record<string, number> = {};
    list.forEach(r => { c[r.type] = (c[r.type] ?? 0) + 1; });
    return Object.entries(c).sort((a, b) => b[1] - a[1]).map(([k, v]) => `${k}: ${v}`).join(", ") || "none";
  };

  if (lower.includes("summar")) {
    if (!reqs.length) return "There are no help requests visible to you yet.";
    const done = reqs.filter(r => r.status === "completed").length;
    return `Right now there are ${reqs.length} requests: ${open.length} open (${db.stats.criticalRequests} critical) and ${done} completed. Open requests by type - ${byType(open)}. ${db.volunteers.filter(v => v.isAvailable).length} volunteers are marked available.`;
  }
  if (lower.includes("prior")) {
    const rank = { critical: 0, high: 1, medium: 2, low: 3 } as Record<string, number>;
    const top = open.filter(r => r.status !== "assigned").sort((a, b) => rank[a.priority] - rank[b.priority] || a.createdAt.localeCompare(b.createdAt)).slice(0, 5);
    if (!top.length) return "No unassigned open requests need prioritising right now.";
    return "Suggested order of response:\n" + top.map((r, i) => `${i + 1}. ${r.priority.toUpperCase()} - ${r.type} for ${r.victimName} at ${r.location.label}`).join("\n");
  }
  if (lower.includes("shelter")) {
    const shelters = db.shelters.filter(s => s.status !== "closed").sort((a, b) => (b.capacity - b.currentOccupancy) - (a.capacity - a.currentOccupancy));
    if (!shelters.length) return "No open shelters are registered yet.";
    return "Shelters with the most free space:\n" + shelters.slice(0, 5).map(s => `- ${s.name} (${s.location.label}): ${s.capacity - s.currentOccupancy} places free of ${s.capacity}`).join("\n");
  }
  if (lower.includes("relief") || lower.includes("generat") || lower.includes("report")) {
    const done = reqs.filter(r => r.status === "completed");
    return `Relief report - ${new Date().toLocaleDateString()}\nTotal requests: ${reqs.length}\nCompleted: ${done.length}\nOpen: ${open.length}\nRequests by type: ${byType(reqs)}\nVolunteers registered: ${db.volunteers.length}\nOpen shelters: ${db.shelters.filter(s => s.status !== "closed").length}`;
  }
  return "I can summarise current requests, suggest which to prioritise, list shelters with free space, or generate a relief report. Try asking for one of those.";
}

export default function AIChat({ isOpen, onClose }: AIChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "init",
      role: "assistant",
      content: "Hello! I'm ResQHub AI, your coordination assistant. I can help you summarize field reports, prioritize requests, find shelters, and generate relief summaries. How can I assist?",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: Message = { id: Date.now().toString(), role: "user", content: text, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    setTimeout(() => {
      const response = answer(text);

      const aiMsg: Message = { id: (Date.now() + 1).toString(), role: "assistant", content: response, timestamp: new Date() };
      setMessages(prev => [...prev, aiMsg]);
      setLoading(false);
    }, 500);
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
            <p className="text-[10px] text-blue-200">Emergency Response Assistant</p>
          </div>
          <div className="flex items-center gap-1.5 mr-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] text-blue-200">Online</span>
          </div>
          <button onClick={onClose} className="text-white/60 hover:text-white transition-colors">
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
              placeholder="Ask about emergency response..."
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
