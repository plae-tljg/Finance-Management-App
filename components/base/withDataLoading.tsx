import React from 'react';
import { LoadingView } from './LoadingView';
import { ErrorView } from './ErrorView';

export interface DataLoadingProps {
  isReady: boolean;
  error?: Error;
  retry?: () => void;
}

export function withDataLoading<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  options: {
    loadingMessage?: string;
    errorMessage?: string;
  }
) {
  return function WithDataLoadingComponent(props: P & DataLoadingProps) {
    const { isReady, error, retry, ...rest } = props;

    if (error) {
      return (
        <ErrorView 
          error={error} 
          onRetry={retry}
          message={options.errorMessage} 
        />
      );
    }

    if (!isReady) {
      return <LoadingView message={options.loadingMessage} />;
    }

    return <WrappedComponent {...(rest as P)} />;
  };
} 