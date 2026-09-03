'use client';

import { Component, ReactNode } from 'react';

interface ErrorBoundaryProps {
  children: ReactNode;
  /** Custom fallback UI khi có lỗi */
  fallback?: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary — bắt mọi JS error trong tree con và hiển thị fallback UI
 * thay vì để cả app white-screen crash.
 *
 * Sử dụng:
 *   <ErrorBoundary>
 *     <App />
 *   </ErrorBoundary>
 *
 * Hoặc với custom fallback:
 *   <ErrorBoundary fallback={<MyErrorPage />}>
 *     <RiskyComponent />
 *   </ErrorBoundary>
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  /**
   * React gọi hàm này khi có error trong render/lifecycle.
   * Return state mới để hiển thị fallback UI.
   */
  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  /**
   * Nơi để log error lên service (Sentry, LogRocket, v.v.)
   * Chạy sau getDerivedStateFromError.
   */
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary] Caught error:', error);
    console.error('[ErrorBoundary] Component stack:', errorInfo.componentStack);

    // TODO: Gửi lên Sentry / LogRocket khi deploy production
    // Sentry.captureException(error, { contexts: { react: { componentStack } } });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      // Nếu có custom fallback → dùng nó
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Fallback mặc định
      return (
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '16px',
            padding: '24px',
            background: '#0a0a0f',
            color: '#e2e8f0',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: '64px' }}>😵</div>
          <h2 style={{ fontSize: '24px', fontWeight: 700, margin: 0 }}>
            Đã xảy ra lỗi không mong muốn
          </h2>
          <p style={{ color: '#94a3b8', fontSize: '14px', maxWidth: '400px' }}>
            Ứng dụng gặp sự cố. Bạn có thể thử lại hoặc quay về trang chủ.
          </p>

          {/* Hiển thị error message trong dev mode */}
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <pre
              style={{
                background: 'rgba(239, 68, 68, 0.1)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                borderRadius: '12px',
                padding: '16px',
                fontSize: '12px',
                color: '#f87171',
                maxWidth: '600px',
                overflow: 'auto',
                textAlign: 'left',
              }}
            >
              {this.state.error.message}
              {'\n\n'}
              {this.state.error.stack}
            </pre>
          )}

          <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
            <button
              onClick={this.handleRetry}
              style={{
                padding: '10px 24px',
                borderRadius: '12px',
                border: 'none',
                background: 'linear-gradient(to right, #6366f1, #a855f7)',
                color: 'white',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              Thử lại
            </button>
            <button
              onClick={() => (window.location.href = '/')}
              style={{
                padding: '10px 24px',
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(255,255,255,0.05)',
                color: '#94a3b8',
                fontWeight: 600,
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              Về trang chủ
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
