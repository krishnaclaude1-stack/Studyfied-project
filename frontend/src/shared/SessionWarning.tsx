/**
 * SessionWarning component - Displays multi-tab conflict warning
 * Reference: Tech Plan Section 3.2 - Single-tab enforcement
 */

import React from 'react';
import { Button } from './Button';

interface SessionWarningProps {
  isVisible: boolean;
  isStale: boolean;
  onClaim: () => void;
  onDismiss: () => void;
}

/**
 * Warning overlay shown when lesson is open in another tab.
 * Allows user to claim ownership or dismiss.
 */
export const SessionWarning: React.FC<SessionWarningProps> = ({
  isVisible,
  isStale,
  onClaim,
  onDismiss,
}) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <svg
              className="w-6 h-6 text-warning"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {isStale ? 'Session Available' : 'Lesson Open in Another Tab'}
            </h3>
            <p className="text-gray-600 mb-4">
              {isStale
                ? 'This lesson was previously open but appears to be closed now. You can continue working on it.'
                : 'This lesson is currently open in another tab. Opening it here may cause conflicts with your progress.'}
            </p>
            <div className="flex gap-3">
              <Button
                onClick={onClaim}
                className="flex-1"
              >
                {isStale ? 'Continue' : 'Open Here Anyway'}
              </Button>
              {!isStale && (
                <Button
                  onClick={onDismiss}
                  className="flex-1 bg-gray-200 text-gray-800 hover:bg-gray-300"
                >
                  Cancel
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
