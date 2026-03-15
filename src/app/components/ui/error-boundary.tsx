import React, { Component, type ReactNode } from "react";
import { AlertTriangle, RotateCcw, Trash2 } from "lucide-react";

const bodyFont = { fontFamily: "'Inter', sans-serif" };
const headingFont = { fontFamily: "'Degular', 'Maragsa', 'Playfair Display', sans-serif" };

interface ErrorBoundaryProps {
  children: ReactNode;
  section?: string;
  fallbackMinHeight?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const timestamp = new Date().toISOString();
    const section = this.props.section || "Unknown";
    console.error(
      `[ErrorBoundary: ${section}] [${timestamp}] Unhandled render error:`,
      error,
      "\n\nComponent stack:",
      errorInfo.componentStack
    );
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  handleClearLocalData = () => {
    // Clear all ik26- prefixed keys from localStorage
    const allKeys = Object.keys(localStorage);
    let cleared = 0;
    allKeys.forEach((key) => {
      if (key.startsWith("ik26")) {
        localStorage.removeItem(key);
        cleared++;
      }
    });
    console.log(
      `[ErrorBoundary: ${this.props.section || "Unknown"}] Cleared ${cleared} localStorage keys at ${new Date().toISOString()}`
    );
    // Retry after clearing
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="flex flex-col items-center justify-center text-center px-6 py-10 rounded-xl"
          style={{
            minHeight: this.props.fallbackMinHeight || "200px",
            backgroundColor: "rgba(248,245,239,0.7)",
            border: "1px solid rgba(164,90,70,0.15)",
          }}
          role="alert"
        >
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
            style={{ backgroundColor: "rgba(164,90,70,0.08)" }}
          >
            <AlertTriangle className="w-5 h-5" style={{ color: "#A45A46" }} />
          </div>
          <h4
            className="text-foreground text-[0.9375rem] mb-1"
            style={headingFont}
          >
            Something went wrong
          </h4>
          <p
            className="text-muted-foreground text-[0.8125rem] max-w-sm leading-relaxed mb-1"
            style={bodyFont}
          >
            {this.props.section
              ? `The "${this.props.section}" section encountered an error.`
              : "This section encountered an unexpected error."}
          </p>
          <p
            className="text-muted-foreground/60 text-[0.6875rem] max-w-sm mb-4 font-mono"
            style={{ wordBreak: "break-word" }}
          >
            {this.state.error?.message?.slice(0, 120)}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={this.handleRetry}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-[0.8125rem] cursor-pointer transition-all hover:brightness-110 min-h-[44px]"
              style={{
                backgroundColor: "rgba(126,158,120,0.1)",
                color: "#7E9E78",
                border: "1px solid rgba(126,158,120,0.2)",
                ...bodyFont,
              }}
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Try Again
            </button>
            <button
              onClick={this.handleClearLocalData}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-[0.8125rem] cursor-pointer transition-all hover:brightness-110 min-h-[44px]"
              style={{
                backgroundColor: "rgba(164,90,70,0.06)",
                color: "#A45A46",
                border: "1px solid rgba(164,90,70,0.12)",
                ...bodyFont,
              }}
              title="Clear local data and retry — may fix data corruption issues"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear Data & Retry
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}