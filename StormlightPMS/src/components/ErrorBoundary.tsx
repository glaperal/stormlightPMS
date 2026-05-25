import { Component, type ErrorInfo, type ReactNode } from 'react';

interface State {
  error: Error | null;
}

interface Props {
  children: ReactNode;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // eslint-disable-next-line no-console
    console.error('Unhandled render error:', error, info.componentStack);
  }

  private handleReload = () => {
    this.setState({ error: null });
    window.location.reload();
  };

  render() {
    if (this.state.error) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
          <div className="card max-w-md w-full p-6 text-center" role="alert">
            <h1 className="text-lg font-semibold text-slate-900">Something went wrong</h1>
            <p className="mt-2 text-sm text-slate-600">
              StormlightPMS hit an unexpected error. Reload the page to recover. If the problem
              persists, copy the message below and send it to support.
            </p>
            <pre className="mt-3 max-h-40 overflow-auto rounded bg-slate-100 p-2 text-left text-xs text-slate-800">
              {this.state.error.message}
            </pre>
            <button type="button" className="btn-primary mt-4" onClick={this.handleReload}>
              Reload
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
