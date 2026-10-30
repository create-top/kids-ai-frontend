import { getIntl } from '@umijs/max';
import { Button, Card, Result } from 'antd';
import React from 'react';

function isChunkLoadError(error: Error): boolean {
  return (
    error.name === 'ChunkLoadError' ||
    /(?:loading|failed to load) (?:css )?chunk/i.test(error.message) ||
    /Failed to fetch dynamically imported module/i.test(error.message)
  );
}

function renderErrorFallback(
  error: Error,
  isOnline: boolean,
  onRetry: () => void,
  onReload: () => void,
) {
  const isOffline = !isOnline;
  const isChunkError = isChunkLoadError(error);

  // WHY：页面脚本加载失败多半是网络或刚发布过新版本，提示要和普通渲染错误区分开。
  const t = (id: string) => getIntl().formatMessage({ id });
  const title = isChunkError
    ? t('pages.error.loadFailed')
    : t('pages.error.crashed');
  const subTitle = !isChunkError
    ? t('pages.error.crashedHint')
    : isOffline
      ? t('pages.error.offlineHint')
      : t('pages.error.chunkHint');

  return (
    <Card variant="borderless" style={{ margin: 24 }}>
      <Result
        status="error"
        title={title}
        subTitle={subTitle}
        extra={[
          isChunkError && (
            <Button type="primary" key="retry" onClick={onRetry}>
              {t('pages.error.retry')}
            </Button>
          ),
          <Button
            type={isChunkError ? 'default' : 'primary'}
            key="reload"
            onClick={onReload}
          >
            {t('pages.error.reload')}
          </Button>,
          <Button href="/" key="home">
            {t('pages.404.home')}
          </Button>,
        ].filter(Boolean)}
      />
    </Card>
  );
}
interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  isOnline: boolean;
  retryCount: number;
}

export default class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = {
    hasError: false,
    error: null,
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    retryCount: 0,
  };

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidMount() {
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
  }

  componentWillUnmount() {
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
  }

  handleOnline = () => {
    this.setState({ isOnline: true });
    if (
      this.state.hasError &&
      this.state.error &&
      isChunkLoadError(this.state.error)
    ) {
      window.location.reload();
    }
  };

  handleOffline = () => {
    this.setState({ isOnline: false });
  };

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  handleRetry = () => {
    // Incrementing retryCount changes the key on the children fragment,
    // forcing React to unmount and remount all lazy components.
    // This causes React.lazy to re-execute import() for the failed chunk.
    this.setState((prev) => ({
      hasError: false,
      error: null,
      retryCount: prev.retryCount + 1,
    }));
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError || !this.state.error) {
      return (
        <React.Fragment key={this.state.retryCount}>
          {this.props.children}
        </React.Fragment>
      );
    }
    return renderErrorFallback(
      this.state.error,
      this.state.isOnline,
      this.handleRetry,
      this.handleReload,
    );
  }
}
