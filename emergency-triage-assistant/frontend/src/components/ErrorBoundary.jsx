import React from 'react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('❌ React Error:', error);
    console.error('Error info:', errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="dash-card border-l-4 border-rose-500">
          <h3 className="text-lg font-bold text-rose-400 mb-3">⚠️ Rendering Error</h3>
          <p className="text-sm text-slate-300 mb-3">The analysis results had an issue while rendering.</p>
          <details className="text-xs text-slate-400 bg-slate-900/50 p-3 rounded border border-slate-700">
            <summary className="cursor-pointer font-semibold text-slate-300">Error Details</summary>
            <pre className="mt-2 overflow-auto max-h-40">{this.state.error?.toString()}</pre>
          </details>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-3 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-sm"
          >
            Dismiss
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
