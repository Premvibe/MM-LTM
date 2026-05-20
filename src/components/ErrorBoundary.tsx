import React from "react";

type Props = {
  children: React.ReactNode;
  fallback?: React.ReactNode;
};

type State = {
  error: Error | null;
};

export class ErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // Keep console signal for debugging.
    console.error("UI crashed:", error, info);
  }

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    if (this.props.fallback) return this.props.fallback;

    return (
      <div className="min-h-screen w-full flex items-center justify-center p-6 bg-background text-foreground">
        <div className="max-w-2xl w-full rounded-2xl border bg-card p-6 shadow-sm">
          <h1 className="text-lg font-extrabold tracking-tight">Something went wrong</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            The app hit a runtime error. The details below should help pinpoint the exact file and line.
          </p>
          <pre className="mt-4 max-h-[50vh] overflow-auto rounded-xl bg-muted p-4 text-xs whitespace-pre-wrap">
            {String(error.stack || error.message || error)}
          </pre>
          <button
            className="mt-4 inline-flex h-10 items-center justify-center rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground"
            onClick={() => window.location.reload()}
          >
            Reload
          </button>
        </div>
      </div>
    );
  }
}

