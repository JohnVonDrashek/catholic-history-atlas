import { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    // Log error details
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Call optional error callback
    this.props.onError?.(error, errorInfo);

    // Update state with error info
    this.setState({
      errorInfo,
    });
  }

  handleReset = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <div
          style={{
            padding: '2rem',
            maxWidth: '800px',
            margin: '2rem auto',
            backgroundColor: '#1a1a1a',
            border: '2px solid #b91c1c',
            borderRadius: '8px',
            color: '#fff',
          }}
        >
          <h2 style={{ color: '#b91c1c', marginTop: 0 }}>Something went wrong</h2>
          <p style={{ marginBottom: '1.5rem' }}>
            An unexpected error occurred while rendering this component. Please try refreshing the
            page.
          </p>

          <details
            style={{
              marginBottom: '1.5rem',
              padding: '1rem',
              backgroundColor: '#2a2a2a',
              borderRadius: '4px',
            }}
          >
            <summary
              style={{
                cursor: 'pointer',
                fontWeight: 'bold',
                marginBottom: '0.5rem',
              }}
            >
              Error Details
            </summary>
            <pre
              style={{
                fontSize: '0.875rem',
                overflow: 'auto',
                color: '#ff6b6b',
                marginTop: '1rem',
              }}
            >
              {this.state.error?.toString()}
            </pre>
            {this.state.errorInfo && (
              <pre
                style={{
                  fontSize: '0.75rem',
                  overflow: 'auto',
                  color: '#aaa',
                  marginTop: '1rem',
                }}
              >
                {this.state.errorInfo.componentStack}
              </pre>
            )}
          </details>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              onClick={this.handleReset}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#4a9eff',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold',
              }}
            >
              Try Again
            </button>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '0.5rem 1rem',
                backgroundColor: '#2ecc71',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontWeight: 'bold',
              }}
            >
              Refresh Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
