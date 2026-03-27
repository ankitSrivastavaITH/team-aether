"use client";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  MessageSquare, X, Send, Loader2, ChevronDown, ChevronUp,
  Sparkles, Trash2, ArrowRight,
} from "lucide-react";
import { postAPI } from "@/lib/api";
import { toast } from "sonner";

interface QueryResult {
  sql?: string;
  explanation?: string;
  analysis?: string;
  followups?: string[];
  results?: Record<string, unknown>[];
  total?: number;
  error?: string;
}

interface ChatMessage {
  id: number;
  type: "user" | "assistant";
  question?: string;
  result?: QueryResult;
  timestamp: Date;
}

const SUGGESTIONS = [
  "Contracts expiring this month",
  "Top 5 vendors by value",
  "Public Works contracts over $1M",
];

function formatVal(key: string, val: unknown): string {
  if (val === null || val === undefined) return "—";
  const s = String(val);
  if ((key === "value" || key.includes("value")) && !isNaN(Number(val)) && Number(val) > 0) {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(Number(val));
  }
  if (key.includes("date") && s.match(/^\d{4}-\d{2}-\d{2}/)) {
    return new Date(s).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }
  return s;
}

function ResultCards({ results }: { results: Record<string, unknown>[] }) {
  const [expanded, setExpanded] = useState(false);
  if (!results.length) return null;
  const keys = Object.keys(results[0]);
  const nameKey = keys.find(k => k === "supplier" || k === "department" || k === "title") || keys[0];
  const valueKey = keys.find(k => k === "value" || k === "total_value" || k.includes("value"));
  const visible = expanded ? results.slice(0, 50) : results.slice(0, 5);

  return (
    <div className="space-y-1.5">
      {visible.map((row, i) => (
        <div key={i} className="bg-white dark:bg-slate-800 rounded-lg px-3 py-2 text-xs border border-slate-100 dark:border-slate-700">
          <div className="flex items-start justify-between gap-2">
            <span className="font-semibold text-slate-800 dark:text-slate-200 text-sm leading-tight">
              {String(row[nameKey] ?? `Row ${i + 1}`)}
            </span>
            {valueKey && row[valueKey] != null && (
              <span className="font-bold text-blue-600 dark:text-blue-400 whitespace-nowrap text-sm">
                {formatVal(String(valueKey), row[valueKey])}
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-slate-500 dark:text-slate-400 mt-1">
            {keys.filter(k => k !== nameKey && k !== valueKey && row[k] != null && String(row[k]).trim()).slice(0, 3).map(k => (
              <span key={k}>
                <span className="text-slate-400">{k.replace(/_/g, " ")}:</span>{" "}
                <span className="text-slate-600 dark:text-slate-300">{formatVal(k, row[k])}</span>
              </span>
            ))}
          </div>
        </div>
      ))}
      {results.length > 5 && (
        <button onClick={() => setExpanded(!expanded)} className="w-full text-center text-xs text-blue-600 py-1">
          {expanded ? "Show less" : `Show all ${results.length}`}
        </button>
      )}
    </div>
  );
}

function ChatBubble({ msg, onFollowUp }: { msg: ChatMessage; onFollowUp?: (q: string) => void }) {
  const [showSql, setShowSql] = useState(false);

  if (msg.type === "user") {
    return (
      <div className="flex justify-end">
        <div className="bg-blue-600 text-white px-3 py-2 rounded-2xl rounded-br-sm max-w-[85%] text-sm">
          {msg.question}
        </div>
      </div>
    );
  }

  const r = msg.result;
  if (!r) return null;

  if (r.error) {
    return (
      <div className="flex justify-start">
        <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 px-3 py-2 rounded-2xl rounded-bl-sm max-w-[90%] text-sm text-red-700 dark:text-red-400">
          {r.error}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start w-full">
      <div className="bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 px-3 py-2.5 rounded-2xl rounded-bl-sm w-full space-y-2">
        {r.explanation && <p className="text-sm text-slate-700 dark:text-slate-300">{r.explanation}</p>}
        {r.analysis && (
          <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-2.5 text-xs text-blue-900 dark:text-blue-200">
            <div className="flex items-center gap-1 mb-1">
              <Sparkles className="h-3 w-3 text-blue-600" aria-hidden="true" />
              <span className="font-semibold text-blue-700 dark:text-blue-400">Analysis</span>
            </div>
            <p>
              {r.analysis.split(/(\*\*[^*]+\*\*)/).map((part, i) =>
                part.startsWith("**") && part.endsWith("**")
                  ? <strong key={i}>{part.slice(2, -2)}</strong>
                  : part
              )}
            </p>
          </div>
        )}
        {r.results && r.results.length > 0 && <ResultCards results={r.results} />}
        {r.followups && r.followups.length > 0 && (
          <div className="flex flex-col gap-1.5 pt-1">
            <span className="text-xs text-slate-400">Follow up:</span>
            {r.followups.map((fq, i) => (
              <button key={i} onClick={() => onFollowUp?.(fq)} className="text-left text-xs px-3 py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-blue-300 dark:hover:border-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-all flex items-center gap-2 text-slate-600 dark:text-slate-300">
                <ArrowRight className="h-3 w-3 text-blue-500 flex-shrink-0" aria-hidden="true" />
                {fq}
              </button>
            ))}
          </div>
        )}
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-400">{r.total} result{r.total !== 1 ? "s" : ""}</span>
          {r.sql && (
            <button onClick={() => setShowSql(!showSql)} className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1">
              {showSql ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              SQL
            </button>
          )}
        </div>
        {showSql && r.sql && (
          <pre className="text-xs bg-slate-100 dark:bg-slate-900 rounded p-2 overflow-x-auto font-mono">{r.sql}</pre>
        )}
      </div>
    </div>
  );
}

export function AskRichmondPanel() {
  const [open, setOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [lastQueryTime, setLastQueryTime] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const nextId = useRef(1);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  async function handleQuery(q?: string) {
    const queryText = q || question;
    if (!queryText.trim() || loading) return;
    const now = Date.now();
    if (now - lastQueryTime < 2000) return;
    setLastQueryTime(now);

    const userMsg: ChatMessage = { id: nextId.current++, type: "user", question: queryText, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    setQuestion("");
    setLoading(true);

    try {
      const data = await postAPI<QueryResult>("/api/nl-query", { question: queryText });
      setMessages(prev => [...prev, { id: nextId.current++, type: "assistant", result: data, timestamp: new Date() }]);
    } catch {
      setMessages(prev => [...prev, { id: nextId.current++, type: "assistant", result: { error: "Could not connect. Please try again." }, timestamp: new Date() }]);
      toast.error("Query failed");
    } finally {
      setLoading(false);
    }
  }

  function clearChat() {
    setMessages([]);
    toast.success("Chat cleared");
  }

  // Toggle button when closed
  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 hover:shadow-xl transition-all focus:outline-none focus:ring-3 focus:ring-blue-400 focus:ring-offset-2"
        aria-label="Open Ask Richmond"
        style={{ minHeight: 48 }}
      >
        <MessageSquare className="h-5 w-5" aria-hidden="true" />
        <span className="text-sm font-medium">Ask Richmond</span>
      </button>
    );
  }

  // Docked right sidebar panel (like Aether)
  return (
    <div
      className="fixed top-0 right-0 z-50 h-full w-[420px] max-w-[90vw] bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-700 shadow-2xl flex flex-col"
      role="complementary"
      aria-label="Ask Richmond AI assistant"
    >
      {/* Branded header bar */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <Sparkles className="h-5 w-5" aria-hidden="true" />
          <span className="font-bold text-base">Ask Richmond</span>
          <Badge className="bg-white/20 text-white border-0 text-xs">AI</Badge>
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" aria-label="Online" />
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={clearChat}
            className="p-1.5 hover:bg-white/20 rounded transition-colors"
            aria-label="Clear chat history"
          >
            <Trash2 className="h-4 w-4" />
          </button>
          <button
            onClick={() => setOpen(false)}
            className="p-1.5 hover:bg-white/20 rounded transition-colors"
            aria-label="Close Ask Richmond"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Chat messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-6 py-12">
            <Sparkles className="h-16 w-16 text-blue-200 dark:text-blue-800" aria-hidden="true" />
            <div>
              <p className="text-lg font-semibold text-slate-700 dark:text-slate-300">Hi, I&apos;m Ask Richmond</p>
              <p className="text-sm text-slate-400 dark:text-slate-500 mt-1 max-w-xs mx-auto">
                Your AI assistant. Ask me about contracts, vendors, spending, or anything in the system
              </p>
            </div>
            <div className="flex flex-col gap-2 w-full max-w-sm">
              {SUGGESTIONS.map(s => (
                <button
                  key={s}
                  onClick={() => handleQuery(s)}
                  className="w-full text-sm px-4 py-3 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-300 dark:hover:border-blue-700 text-slate-600 dark:text-slate-400 transition-all text-center"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map(msg => (
          <ChatBubble key={msg.id} msg={msg} onFollowUp={handleQuery} />
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-100 dark:bg-slate-800 px-4 py-3 rounded-2xl rounded-bl-sm flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
              <span className="text-sm text-slate-500">Thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input bar — fixed at bottom */}
      <div className="flex-shrink-0 px-4 py-3 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={question}
            onChange={e => setQuestion(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleQuery()}
            placeholder="Ask Richmond..."
            className="h-11 text-sm dark:bg-slate-800 dark:border-slate-700"
            maxLength={500}
            aria-label="Type your question"
          />
          <Button
            onClick={() => handleQuery()}
            disabled={loading || !question.trim()}
            className="h-11 w-11 flex-shrink-0 bg-blue-600 hover:bg-blue-700"
            aria-label="Send"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-slate-400 mt-1.5 text-center">
          AI-powered · Data from City of Richmond Open Data
        </p>
      </div>
    </div>
  );
}
