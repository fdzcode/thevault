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
            <div className="glass-card rounded-2xl border-red-500/20 p-8">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-500/10">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="h-6 w-6 text-red-400">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126ZM12 15.75h.007v.008H12v-.008Z" />
                </svg>
              </div>
              <h2 className="mb-2 font-display text-xl font-bold text-[var(--text-heading)]">Something went wrong</h2>
              <p className="mb-6 text-sm text-muted">
                {this.state.error?.message ?? "An unexpected error occurred"}
              </p>
              <button
                onClick={() => this.setState({ hasError: false, error: null })}
                className="rounded-xl bg-gradient-to-r from-[#D4AF37] to-[#F4E5C3] px-6 py-2.5 text-sm font-semibold tracking-widest text-black transition hover:shadow-lg hover:shadow-[#D4AF37]/20"
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
