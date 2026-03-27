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

function ResultTable({ results }: { results: Record<string, unknown>[] }) {
  if (!results.length) return null;
  const keys = Object.keys(results[0]);

  return (
    <div className="overflow-auto max-h-[200px] border rounded-md text-xs">
      <table className="w-full">
        <thead className="bg-slate-50 sticky top-0">
          <tr>
            {keys.map((k) => (
              <th key={k} className="px-2 py-1.5 text-left font-medium text-slate-600 whitespace-nowrap">
                {k.replace(/_/g, " ")}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {results.slice(0, 20).map((row, i) => (
            <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-slate-50/50"}>
              {keys.map((k) => (
                <td key={k} className="px-2 py-1 whitespace-nowrap max-w-[150px] truncate">
                  {String(row[k] ?? "")}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {results.length > 20 && (
        <div className="px-2 py-1 text-center text-slate-400 bg-slate-50 border-t">
          +{results.length - 20} more rows
        </div>
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
          <ResultTable results={r.results} />
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
