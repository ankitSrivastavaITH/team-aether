"use client";
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  MessageSquare, X, Send, Loader2, ChevronDown, ChevronUp,
  Sparkles, Minimize2, Maximize2,
} from "lucide-react";
import { postAPI } from "@/lib/api";
import { toast } from "sonner";

interface QueryResult {
  sql?: string;
  explanation?: string;
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
  "Departments with most contracts",
];

function formatValue(key: string, val: unknown): string {
  if (val === null || val === undefined) return "—";
  const s = String(val);
  // Format currency-like fields
  if (key === "value" || key === "total_value" || key.includes("value")) {
    const num = Number(val);
    if (!isNaN(num) && num > 0) {
      return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(num);
    }
  }
  // Format date fields
  if (key.includes("date") && s.match(/^\d{4}-\d{2}-\d{2}/)) {
    return new Date(s).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }
  return s;
}

function ResultCards({ results }: { results: Record<string, unknown>[] }) {
  const [expanded, setExpanded] = useState(false);
  if (!results.length) return null;

  const keys = Object.keys(results[0]);
  // Identify the "name" column (first string-like key)
  const nameKey = keys.find(k =>
    k === "supplier" || k === "department" || k === "title" || k === "name"
  ) || keys[0];
  const valueKey = keys.find(k => k === "value" || k === "total_value" || k.includes("value"));
  const otherKeys = keys.filter(k => k !== nameKey);

  const displayResults = expanded ? results.slice(0, 50) : results.slice(0, 5);

  return (
    <div className="space-y-1.5">
      {displayResults.map((row, i) => (
        <div key={i} className="bg-slate-50 rounded-lg px-3 py-2 text-xs space-y-1">
          <div className="flex items-start justify-between gap-2">
            <span className="font-semibold text-slate-800 text-sm leading-tight">
              {String(row[nameKey] ?? `Row ${i + 1}`)}
            </span>
            {valueKey && row[valueKey] != null && (
              <span className="font-bold text-blue-700 whitespace-nowrap">
                {formatValue(String(valueKey), row[valueKey])}
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-slate-500">
            {otherKeys.filter(k => k !== valueKey && row[k] != null && String(row[k]).trim() !== "").slice(0, 4).map(k => (
              <span key={k}>
                <span className="text-slate-400">{k.replace(/_/g, " ")}:</span>{" "}
                <span className="text-slate-600">{String(formatValue(k, row[k]))}</span>
              </span>
            ))}
          </div>
        </div>
      ))}
      {results.length > 5 && !expanded && (
        <button
          onClick={() => setExpanded(true)}
          className="w-full text-center text-xs text-blue-600 hover:text-blue-800 py-1"
        >
          Show all {results.length} results
        </button>
      )}
      {expanded && results.length > 5 && (
        <button
          onClick={() => setExpanded(false)}
          className="w-full text-center text-xs text-blue-600 hover:text-blue-800 py-1"
        >
          Show less
        </button>
      )}
    </div>
  );
}

function ChatBubble({ msg }: { msg: ChatMessage }) {
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
        <div className="bg-red-50 border border-red-200 px-3 py-2 rounded-2xl rounded-bl-sm max-w-[85%] text-sm text-red-700">
          {r.error}
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start">
      <div className="bg-white border border-slate-200 px-3 py-2.5 rounded-2xl rounded-bl-sm max-w-[90%] space-y-2">
        {r.explanation && (
          <p className="text-sm text-slate-700">{r.explanation}</p>
        )}
        {r.results && r.results.length > 0 && (
          <ResultCards results={r.results} />
        )}
        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-400">{r.total} result{r.total !== 1 ? "s" : ""}</span>
          {r.sql && (
            <button
              onClick={() => setShowSql(!showSql)}
              className="text-xs text-slate-400 hover:text-slate-600 flex items-center gap-1"
              aria-expanded={showSql}
            >
              {showSql ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              SQL
            </button>
          )}
        </div>
        {showSql && r.sql && (
          <pre className="text-xs bg-slate-50 rounded p-2 overflow-x-auto font-mono">{r.sql}</pre>
        )}
      </div>
    </div>
  );
}

export function AskRichmondPanel() {
  const [open, setOpen] = useState(false);
  const [minimized, setMinimized] = useState(false);
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
    if (open && !minimized) inputRef.current?.focus();
  }, [open, minimized]);

  async function handleQuery(q?: string) {
    const queryText = q || question;
    if (!queryText.trim() || loading) return;

    const now = Date.now();
    if (now - lastQueryTime < 2000) return;
    setLastQueryTime(now);

    const userMsg: ChatMessage = {
      id: nextId.current++,
      type: "user",
      question: queryText,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setQuestion("");
    setLoading(true);

    try {
      const data = await postAPI<QueryResult>("/api/nl-query", { question: queryText });
      const assistantMsg: ChatMessage = {
        id: nextId.current++,
        type: "assistant",
        result: data,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      const errorMsg: ChatMessage = {
        id: nextId.current++,
        type: "assistant",
        result: { error: "Could not connect. Please try again." },
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMsg]);
      toast.error("Query failed", { description: "Could not connect to the server." });
    } finally {
      setLoading(false);
    }
  }

  // Floating button when closed
  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-5 py-3 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 hover:shadow-xl transition-all focus:outline-none focus:ring-3 focus:ring-blue-400 focus:ring-offset-2"
        aria-label="Open Ask Richmond chat"
        style={{ minHeight: 48, minWidth: 48 }}
      >
        <MessageSquare className="h-5 w-5" aria-hidden="true" />
        <span className="text-sm font-medium hidden sm:inline">Ask Richmond</span>
      </button>
    );
  }

  // Minimized bar
  if (minimized) {
    return (
      <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 bg-white border border-slate-200 rounded-full shadow-lg px-4 py-2">
        <Sparkles className="h-4 w-4 text-blue-600" aria-hidden="true" />
        <span className="text-sm font-medium text-slate-700">Ask Richmond</span>
        {messages.length > 0 && (
          <Badge className="bg-blue-100 text-blue-700 text-xs">{messages.length}</Badge>
        )}
        <button
          onClick={() => setMinimized(false)}
          className="p-1 hover:bg-slate-100 rounded transition-colors"
          aria-label="Expand chat"
        >
          <Maximize2 className="h-4 w-4 text-slate-500" />
        </button>
        <button
          onClick={() => { setOpen(false); setMinimized(false); }}
          className="p-1 hover:bg-slate-100 rounded transition-colors"
          aria-label="Close chat"
        >
          <X className="h-4 w-4 text-slate-500" />
        </button>
      </div>
    );
  }

  // Full panel
  return (
    <div
      className="fixed bottom-6 right-6 z-50 w-[400px] max-w-[calc(100vw-48px)] h-[600px] max-h-[calc(100vh-100px)] bg-white border border-slate-200 rounded-2xl shadow-2xl flex flex-col overflow-hidden"
      role="dialog"
      aria-label="Ask Richmond — AI contract query assistant"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-slate-50 flex-shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-blue-600" aria-hidden="true" />
          <span className="font-semibold text-sm">Ask Richmond</span>
          <Badge variant="outline" className="text-xs">AI</Badge>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setMinimized(true)}
            className="p-1.5 hover:bg-slate-200 rounded transition-colors"
            aria-label="Minimize chat"
          >
            <Minimize2 className="h-4 w-4 text-slate-500" />
          </button>
          <button
            onClick={() => setOpen(false)}
            className="p-1.5 hover:bg-slate-200 rounded transition-colors"
            aria-label="Close chat"
          >
            <X className="h-4 w-4 text-slate-500" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-8 space-y-4">
            <Sparkles className="h-10 w-10 text-blue-200 mx-auto" aria-hidden="true" />
            <div>
              <p className="font-medium text-slate-700">Ask anything about Richmond contracts</p>
              <p className="text-sm text-slate-400 mt-1">I translate plain English into database queries</p>
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => handleQuery(s)}
                  className="text-xs px-3 py-1.5 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((msg) => (
          <ChatBubble key={msg.id} msg={msg} />
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-100 px-4 py-2 rounded-2xl rounded-bl-sm">
              <Loader2 className="h-4 w-4 animate-spin text-blue-600" aria-label="Thinking..." />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 px-3 py-3 border-t bg-white">
        <div className="flex gap-2">
          <Input
            ref={inputRef}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleQuery()}
            placeholder="Ask about contracts..."
            className="h-10 text-sm"
            maxLength={500}
            aria-label="Type your question"
          />
          <Button
            onClick={() => handleQuery()}
            disabled={loading || !question.trim()}
            size="icon"
            className="h-10 w-10 flex-shrink-0"
            aria-label="Send question"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-xs text-slate-400 mt-1.5 text-center">
          AI-powered · Results from City of Richmond Open Data
        </p>
      </div>
    </div>
  );
}
