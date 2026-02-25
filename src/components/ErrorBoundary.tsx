import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <div className="flex min-h-screen items-center justify-center bg-background p-8">
            <div className="glass-card max-w-md p-8 text-center">
              <h2 className="mb-3 text-xl font-bold text-foreground">
                Something went wrong
              </h2>
              <p className="mb-6 text-sm text-muted-foreground">
                {this.state.error?.message || "An unexpected error occurred."}
              </p>
              <button
                onClick={() => window.location.reload()}
                className="rounded-2xl px-6 py-3 text-sm font-bold text-primary-foreground"
                style={{ background: "var(--gradient-primary)" }}
              >
                Reload App
              </button>
            </div>
          </div>
        )
      );
    }
    return this.props.children;
  }
}
