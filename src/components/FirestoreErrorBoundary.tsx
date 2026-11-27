import React from 'react';
import { FirestoreErrorInfo } from '../services/firebaseClient';

interface FirestoreErrorBoundaryProps {
  children: React.ReactNode;
}

interface FirestoreErrorBoundaryState {
  hasError: boolean;
  errorInfo: FirestoreErrorInfo | null;
  rawMessage: string;
}

export class FirestoreErrorBoundary extends React.Component<
  FirestoreErrorBoundaryProps,
  FirestoreErrorBoundaryState
> {
  constructor(props: FirestoreErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      errorInfo: null,
      rawMessage: '',
    };
  }

  static getDerivedStateFromError(error: Error): FirestoreErrorBoundaryState {
    const msg = error?.message || String(error);
    try {
      const parsed = JSON.parse(msg) as FirestoreErrorInfo;
      if (parsed && typeof parsed.error === 'string' && parsed.operationType) {
        return {
          hasError: true,
          errorInfo: parsed,
          rawMessage: parsed.error,
        };
      }
    } catch {
      // Not a JSON FirestoreErrorInfo payload
    }
    return {
      hasError: true,
      errorInfo: null,
      rawMessage: msg,
    };
  }

  handleDismiss = () => {
    this.setState({
      hasError: false,
      errorInfo: null,
      rawMessage: '',
    });
  };

  render() {
    if (this.state.hasError) {
      const { errorInfo, rawMessage } = this.state;
      const isQuotaExceeded =
        rawMessage.toLowerCase().includes('quota exceeded') ||
        rawMessage.toLowerCase().includes('resource-exhausted');

      return (
        <div className="min-h-screen bg-surface text-on-surface flex items-center justify-center p-6">
          <div className="max-w-lg w-full rounded-lg bg-surface-container-low border border-outline-variant/40 p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3">
              <div className="flex items-center gap-2 text-error">
                <span className="material-symbols-outlined text-[20px]">
                  error
                </span>
                <h2 className="font-headline-sm text-headline-sm font-semibold">
                  {isQuotaExceeded
                    ? 'Firebase Firestore Quota Exceeded'
                    : 'Database Operation Error'}
                </h2>
              </div>
              {errorInfo && (
                <span className="font-code-inline text-xs text-outline uppercase">
                  {errorInfo.operationType}
                </span>
              )}
            </div>

            <p className="text-xs text-on-surface-variant leading-relaxed">
              {isQuotaExceeded
                ? 'Your Firebase Firestore daily free-tier quota has been reached. Quota resets automatically the next day. Your local IndexedDB vault remains completely intact.'
                : rawMessage}
            </p>

            {errorInfo && (
              <div className="p-3 rounded bg-surface-container-lowest border border-outline-variant/20 font-code-block text-[11px] text-outline space-y-1">
                <div>
                  <span className="text-on-surface-variant">Path:</span>{' '}
                  {errorInfo.path || 'N/A'}
                </div>
                <div>
                  <span className="text-on-surface-variant">User UID:</span>{' '}
                  {errorInfo.authInfo.userId || 'Signed Out'}
                </div>
                <div>
                  <span className="text-on-surface-variant">Email Verified:</span>{' '}
                  {String(Boolean(errorInfo.authInfo.emailVerified))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={this.handleDismiss}
                className="px-4 py-1.5 rounded bg-primary text-on-primary text-xs font-medium cursor-pointer"
              >
                Continue in Local-First Vault
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
