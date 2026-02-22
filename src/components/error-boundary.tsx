"use client";

import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="flex min-h-[400px] flex-col items-center justify-center gap-4 text-center">
            <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-8">
              <h2 className="mb-2 text-xl font-bold text-white">Something went wrong</h2>
              <p className="mb-4 text-sm text-zinc-400">
                {this.state.error?.message ?? "An unexpected error occurred"}
              </p>
              <button
                onClick={() => this.setState({ hasError: false, error: null })}
                className="rounded bg-white px-4 py-2 text-sm font-medium text-black hover:bg-zinc-200"
              >
                Try Again
              </button>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
