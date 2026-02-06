import { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary]', error, errorInfo);

    this.setState({
      error: error?.message || String(error),
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
            <h1 className="text-3xl font-bold text-white mb-4">
              Une erreur est survenue
            </h1>

            <p className="text-slate-300 mb-6">
              Une erreur temporaire est survenue. Le service reste accessible.
            </p>

            <pre
              style={{
                marginTop: '16px',
                color: '#ff6b6b',
                background: '#020617',
                padding: '12px',
                borderRadius: '8px',
                fontSize: '12px',
                textAlign: 'left',
                whiteSpace: 'pre-wrap',
                overflowX: 'auto',
              }}
            >
              {this.state.error}
              {"\n"}
              {this.state.errorInfo}
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
                  window.location.href = '/';
                }}
                className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-lg transition-colors"
              >
                Retour à l’accueil
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
