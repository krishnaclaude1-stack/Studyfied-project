/**
 * Transcript Component
 * Displays lesson narration with timestamp navigation
 */

import { useEffect, useRef } from 'react';
import { useLessonStore } from '../../stores/lessonStore';
import { usePlayerStore } from '../../stores/playerStore';

interface TranscriptProps {
  isVisible: boolean;
  onClose: () => void;
}

export function Transcript({ isVisible, onClose }: TranscriptProps) {
  const { checkpoints, lessonManifest } = useLessonStore();
  const { currentTime, seek } = usePlayerStore();
  const highlightedRef = useRef<HTMLDivElement>(null);

  /**
   * Format time in MM:SS
   */
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  /**
   * Find current checkpoint index based on currentTime
   */
  const getCurrentCheckpointIndex = (): number => {
    if (!checkpoints || checkpoints.length === 0) return -1;
    
    for (let i = checkpoints.length - 1; i >= 0; i--) {
      if (currentTime >= checkpoints[i].timestamp) {
        return i;
      }
    }
    return 0;
  };

  const currentIndex = getCurrentCheckpointIndex();

  /**
   * Auto-scroll to highlighted segment
   */
  useEffect(() => {
    if (highlightedRef.current && isVisible) {
      highlightedRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [currentIndex, isVisible]);

  /**
   * Handle timestamp click
   */
  const handleTimestampClick = (timestamp: number) => {
    seek(timestamp);
    
    // Also update the audio element directly
    const audioElements = document.querySelectorAll('audio');
    if (audioElements.length > 0) {
      audioElements[0].currentTime = timestamp;
    }
  };

  if (!isVisible) return null;

  if (!checkpoints || checkpoints.length === 0) {
    return (
      <>
        {/* Mobile backdrop */}
        <div 
          className="md:hidden fixed inset-0 bg-black/50 z-30"
          onClick={onClose}
        />
        
        <div className="fixed md:relative right-0 top-0 bottom-0 w-full md:w-80 bg-white border-l border-gray-200 shadow-lg md:shadow-none z-40 flex flex-col shrink-0">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Transcript</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              aria-label="Close transcript"
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Empty state */}
          <div className="flex-1 flex items-center justify-center p-6 text-center">
            <p className="text-gray-500">No transcript available</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Mobile backdrop */}
      <div 
        className="md:hidden fixed inset-0 bg-black/50 z-30"
        onClick={onClose}
      />

      {/* Transcript sidebar */}
      <div className="fixed md:relative right-0 top-0 bottom-0 w-full md:w-80 bg-white border-l border-gray-200 shadow-lg md:shadow-none z-40 flex flex-col shrink-0">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Transcript</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Close transcript"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Transcript content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {checkpoints.map((checkpoint, index) => {
            const isActive = index === currentIndex;
            
            return (
              <div
                key={checkpoint.id}
                ref={isActive ? highlightedRef : null}
                className={`p-3 rounded-lg transition-all cursor-pointer ${
                  isActive
                    ? 'bg-primary/10 border-l-4 border-primary'
                    : 'hover:bg-gray-50 border-l-4 border-transparent'
                }`}
                onClick={() => handleTimestampClick(checkpoint.timestamp)}
              >
                {/* Timestamp */}
                <div className={`text-sm font-medium mb-1 ${
                  isActive ? 'text-primary' : 'text-gray-500 hover:text-primary'
                }`}>
                  {formatTime(checkpoint.timestamp)}
                </div>

                {/* Narration text */}
                <div className={`text-sm ${
                  isActive ? 'text-gray-900' : 'text-gray-700'
                }`}>
                  {checkpoint.text || 'No narration text'}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
