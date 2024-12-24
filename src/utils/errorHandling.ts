import React from 'react';

export enum ErrorType {
  VALIDATION = 'VALIDATION',
  NETWORK = 'NETWORK',
  SERVER = 'SERVER',
  AUTH = 'AUTH',
  UNKNOWN = 'UNKNOWN',
  API = 'API'
}

export enum ErrorCode {
  INVALID_INPUT = 'INVALID_INPUT',
  NETWORK_ERROR = 'NETWORK_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  UNAUTHORIZED = 'UNAUTHORIZED',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  NO_PENDING_RIDES = 'NO_PENDING_RIDES',
  INVALID_TOKEN = 'INVALID_TOKEN',
  NOT_FOUND = 'NOT_FOUND',
  MISSING_FIELD = 'MISSING_FIELD'
}

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render(): React.ReactNode {
    if (this.state.hasError) {
      return React.createElement('div', {
        style: {
          padding: '20px',
          margin: '20px',
          border: '1px solid #ff0000',
          borderRadius: '4px',
          backgroundColor: '#fff5f5'
        }
      }, [
        React.createElement('h2', { key: 'title' }, 'Something went wrong'),
        React.createElement('p', { key: 'message' }, this.state.error?.message)
      ]);
    }

    return this.props.children;
  }
}

export class AppError extends Error {
  constructor(
    message: string,
    public type: ErrorType = ErrorType.UNKNOWN,
    public code: ErrorCode = ErrorCode.UNKNOWN_ERROR,
    public details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function handleError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Error) {
    return new AppError(error.message, ErrorType.UNKNOWN, ErrorCode.UNKNOWN_ERROR, error);
  }

  return new AppError('An unknown error occurred', ErrorType.UNKNOWN, ErrorCode.UNKNOWN_ERROR, error);
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
} 