import React, { Component, type ReactNode } from "react";
import { AlertTriangle, RotateCcw, Home, Trash2 } from "lucide-react";

import { bodyFont, headingFont } from "../../lib/fonts";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

/**
 * Top-level error boundary that wraps the entire application.
 * Shows a full-screen recovery card instead of a blank white page.
 */
export class AppErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const timestamp = new Date().toISOString();
    console.error(
      `[AppErrorBoundary] [${timestamp}] Unhandled render error:`,
      error,
      "\n\nComponent stack:",
      errorInfo.componentStack
    );
    this.setState({ errorInfo });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  handleGoHome = () => {
    // Clear state and reload from root
    window.location.hash = "";
    window.location.reload();
  };

  handleClearDataAndReload = () => {
    // Clear all ik26- prefixed keys
    const allKeys = Object.keys(localStorage);
    allKeys.forEach((key) => {
      if (key.startsWith("ik26")) localStorage.removeItem(key);
    });
    console.log(`[AppErrorBoundary] Cleared localStorage at ${new Date().toISOString()}`);
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="fixed inset-0 flex items-center justify-center p-6"
          style={{
            background:
              "linear-gradient(160deg, #F9F5EE 0%, #F4EDE4 50%, #EDE7DB 100%)",
          }}
        >
          <div
            className="w-full max-w-md rounded-2xl p-8 text-center"
            style={{
              backgroundColor: "rgba(255,255,255,0.85)",
              border: "1px solid rgba(164,90,70,0.12)",
              boxShadow:
                "0 8px 32px rgba(126,158,120,0.08), 0 2px 8px rgba(0,0,0,0.04)",
              backdropFilter: "blur(12px)",
            }}
          >
            {/* Icon */}
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-5"
              style={{
                background:
                  "linear-gradient(135deg, rgba(164,90,70,0.08), rgba(199,91,63,0.12))",
                border: "1px solid rgba(164,90,70,0.15)",
              }}
            >
              <AlertTriangle className="w-7 h-7" style={{ color: "#A45A46" }} />
            </div>

            {/* Title */}
            <h1
              className="text-[1.375rem] mb-2"
              style={{ ...headingFont, color: "#2E4F52" }}
            >
              Something went wrong
            </h1>

            {/* Description */}
            <p
              className="text-[0.875rem] leading-relaxed mb-2 max-w-sm mx-auto"
              style={{ ...bodyFont, color: "#6B7F6B" }}
            >
              The application encountered an unexpected error. Your data is safe
              — try refreshing to get back on track.
            </p>

            {/* Error details (collapsed) */}
            {this.state.error && (
              <details className="mb-6 text-left">
                <summary
                  className="text-[0.6875rem] cursor-pointer select-none text-center"
                  style={{ ...bodyFont, color: "#9CA897" }}
                >
                  Show error details
                </summary>
                <pre
                  className="mt-2 p-3 rounded-lg text-[0.625rem] leading-relaxed overflow-auto max-h-32"
                  style={{
                    backgroundColor: "rgba(61,82,77,0.04)",
                    border: "1px solid rgba(61,82,77,0.08)",
                    color: "#7E9E78",
                    fontFamily: "monospace",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}
                >
                  {this.state.error.message}
                  {this.state.errorInfo?.componentStack && (
                    <>
                      {"\n\nComponent Stack:"}
                      {this.state.errorInfo.componentStack}
                    </>
                  )}
                </pre>
              </details>
            )}

            {/* Action buttons */}
            <div className="flex items-center gap-3 justify-center flex-wrap">
              <button
                onClick={this.handleRetry}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[0.8125rem] cursor-pointer transition-all hover:brightness-110 min-h-[44px]"
                style={{
                  background: "linear-gradient(135deg, #7E9E78, #5a7d54)",
                  color: "#F5F0E8",
                  ...bodyFont,
                  fontWeight: 600,
                  border: "1px solid rgba(126,158,120,0.3)",
                }}
              >
                <RotateCcw className="w-4 h-4" />
                Try Again
              </button>

              <button
                onClick={this.handleClearDataAndReload}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[0.8125rem] cursor-pointer transition-all hover:brightness-110 min-h-[44px]"
                style={{
                  backgroundColor: "rgba(126,158,120,0.08)",
                  color: "#7E9E78",
                  border: "1px solid rgba(126,158,120,0.15)",
                  ...bodyFont,
                  fontWeight: 500,
                }}
              >
                <Trash2 className="w-4 h-4" />
                Clear Data & Reload
              </button>

              <button
                onClick={this.handleGoHome}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[0.8125rem] cursor-pointer transition-all hover:bg-secondary/80 min-h-[44px]"
                style={{
                  backgroundColor: "rgba(126,158,120,0.08)",
                  color: "#7E9E78",
                  border: "1px solid rgba(126,158,120,0.15)",
                  ...bodyFont,
                  fontWeight: 500,
                }}
              >
                <Home className="w-4 h-4" />
                Reload App
              </button>
            </div>

            {/* Version footer */}
            <p
              className="mt-6 text-[0.625rem]"
              style={{ ...bodyFont, color: "rgba(107,127,107,0.5)" }}
            >
              Isang Kusina 2026 — If this keeps happening, try clearing your
              browser data.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}