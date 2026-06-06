import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * React class-based error boundary.
 * Catches render errors in the subtree and shows a fallback UI.
 * Works alongside React Router's errorElement for route-level errors.
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ECGenius] Uncaught render error:', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;
      return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-6 py-16">
          <h1 className="text-3xl font-bold text-red-400 mb-3">Something went wrong</h1>
          <p className="text-gray-400 mb-6 text-sm max-w-sm text-center">
            An unexpected error occurred. Please reload the page or return to the dashboard.
          </p>
          <p className="text-xs text-gray-600 mb-8 font-mono max-w-lg text-center break-all">
            {this.state.error?.message}
          </p>
          <div className="flex gap-4">
            <button
              onClick={() => window.location.reload()}
              className="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-sm font-semibold transition"
            >
              Reload page
            </button>
            <button
              onClick={() => { window.location.href = '/'; }}
              className="px-5 py-2 rounded-lg border border-gray-600 hover:bg-gray-800 text-sm font-semibold transition"
            >
              Go home
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
