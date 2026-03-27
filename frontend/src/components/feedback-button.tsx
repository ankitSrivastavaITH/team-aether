"use client";
import { useState } from "react";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { toast } from "sonner";

export function FeedbackButton({ context }: { context: string }) {
  const [voted, setVoted] = useState<"up" | "down" | null>(null);

  function handleVote(vote: "up" | "down") {
    setVoted(vote);
    toast.success(vote === "up" ? "Thanks for the feedback!" : "We'll improve this. Thanks!", {
      duration: 2000,
    });
    // In production, this would send to an analytics endpoint
    console.log(`Feedback: ${vote} for ${context}`);
  }

  if (voted) {
    return (
      <span className="text-xs text-slate-400">
        {voted === "up" ? "Helpful" : "Noted — we'll improve"}
      </span>
    );
  }

  return (
    <div className="flex items-center gap-1">
      <span className="text-xs text-slate-400 mr-1">Was this helpful?</span>
      <button
        onClick={() => handleVote("up")}
        className="p-1.5 rounded hover:bg-green-50 dark:hover:bg-green-900/30 transition-colors focus:outline-none focus:ring-2 focus:ring-green-500"
        aria-label="This was helpful"
      >
        <ThumbsUp className="h-3.5 w-3.5 text-slate-400 hover:text-green-600" />
      </button>
      <button
        onClick={() => handleVote("down")}
        className="p-1.5 rounded hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500"
        aria-label="This was not helpful"
      >
        <ThumbsDown className="h-3.5 w-3.5 text-slate-400 hover:text-red-600" />
      </button>
    </div>
  );
}
