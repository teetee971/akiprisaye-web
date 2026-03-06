import React, { Component } from 'react';
import { safeToText } from '../utils/safeToText';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary]', error, errorInfo);

    this.setState({
      error: safeToText(error),
      errorInfo: errorInfo?.componentStack || null,
    });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-slate-900 border border-red-500/30 rounded-xl p-8 text-center">
            <img 
              src={`${import.meta.env.BASE_URL}logo-akiprisaye.svg`}
              alt="A KI PRI SA YÉ" 
              className="h-16 mx-auto mb-6"
            />
            
            <h1 className="text-3xl font-bold text-white mb-4">
              Une erreur est survenue
            </h1>

            <p className="text-slate-300 mb-6">
              Une erreur temporaire est survenue. Le service reste accessible.
            </p>

            <pre
              className="mt-4 text-red-400 bg-slate-950 p-3 rounded-lg text-xs text-left whitespace-pre-wrap overflow-x-auto"
            >
              {safeToText(this.state.error)}
              {"\n"}
              {safeToText(this.state.errorInfo)}
            </pre>

            <div className="flex gap-4 justify-center mt-6">
              <button
                onClick={this.handleReset}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
              >
                Réessayer
              </button>

              <button
                onClick={() => {
                  window.location.reload();
                }}
                className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-colors"
              >
                Recharger la page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
