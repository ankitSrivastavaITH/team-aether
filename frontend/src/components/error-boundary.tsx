"use client";
import { Component, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4 text-center p-8" role="alert">
          <AlertTriangle className="h-12 w-12 text-amber-500" aria-hidden="true" />
          <h2 className="text-xl font-semibold">Something went wrong</h2>
          <p className="text-base text-slate-500 max-w-md">
            {this.props.fallbackMessage || "We had trouble loading this page. This usually resolves on its own."}
          </p>
          <Button
            onClick={() => { this.setState({ hasError: false }); window.location.reload(); }}
            className="gap-2 h-11"
          >
            <RefreshCw className="h-4 w-4" aria-hidden="true" />
            Reload page
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}
