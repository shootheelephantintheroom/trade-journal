import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-surface-0 text-primary gap-4">
          <h1 className="text-2xl font-semibold">Something went wrong</h1>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-brand rounded-lg hover:bg-brand/90 text-primary transition-colors"
          >
            Reload
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
