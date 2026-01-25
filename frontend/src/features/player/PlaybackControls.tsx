/**
 * Playback Controls Component
 * UI controls for play/pause, seek, and volume
 */

import { useState } from 'react';
import { usePlayerStore } from '../../stores/playerStore';
import { useAnnotationStore } from '../../stores/annotationStore';

interface PlaybackControlsProps {
  transcriptVisible: boolean;
  onTranscriptToggle: () => void;
}

export function PlaybackControls({ transcriptVisible, onTranscriptToggle }: PlaybackControlsProps) {
  const { isPlaying, currentTime, duration, volume, play, pause, seek, skipForward, skipBackward, setVolume } = usePlayerStore();
  const { isScribbleMode, toggleScribbleMode, layerVisibility, toggleLayerVisibility } = useAnnotationStore();
  const [showLayerMenu, setShowLayerMenu] = useState(false);

  /**
   * Format time in MM:SS
   */
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  /**
   * Handle seek bar change
   */
  const handleSeek = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(event.target.value);
    seek(newTime);

    // Also update the audio element directly for immediate feedback
    const audioElements = document.querySelectorAll('audio');
    if (audioElements.length > 0) {
      audioElements[0].currentTime = newTime;
    }
  };

  /**
   * Handle volume change
   */
  const handleVolumeChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(event.target.value);
    setVolume(newVolume);
  };

  /**
   * Handle skip forward
   */
  const handleSkipForward = () => {
    skipForward();
    const audioElements = document.querySelectorAll('audio');
    if (audioElements.length > 0) {
      audioElements[0].currentTime = Math.min(currentTime + 10, duration);
    }
  };

  /**
   * Handle skip backward
   */
  const handleSkipBackward = () => {
    skipBackward();
    const audioElements = document.querySelectorAll('audio');
    if (audioElements.length > 0) {
      audioElements[0].currentTime = Math.max(currentTime - 10, 0);
    }
  };

  /**
   * Handle scribble mode toggle
   */
  const handleScribbleToggle = () => {
    if (isPlaying) {
      pause();
    }
    toggleScribbleMode();
  };

  return (
    <div className="w-full bg-gray-50 border-t border-gray-200 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Seek bar */}
        <div className="mb-4">
          <input
            type="range"
            min="0"
            max={duration || 0}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
            disabled={!duration}
          />
          <div className="flex justify-between mt-1 text-sm text-gray-600">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Control buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {/* Skip backward button */}
            <button
              onClick={handleSkipBackward}
              disabled={!duration}
              className="flex items-center justify-center w-10 h-10 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              aria-label="Skip backward 10 seconds"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M11.99 5V1l-5 5 5 5V7c3.31 0 6 2.69 6 6s-2.69 6-6 6-6-2.69-6-6h-2c0 4.42 3.58 8 8 8s8-3.58 8-8-3.58-8-8-8z" />
                <path d="M10.89 16h-.85v-3.26l-1.01.31v-.69l1.77-.63h.09V16z" />
              </svg>
            </button>

            {/* Play/Pause button */}
            <button
              onClick={isPlaying ? pause : play}
              disabled={!duration}
              className="flex items-center justify-center w-12 h-12 bg-primary text-white rounded-full hover:bg-primary/90 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              {isPlaying ? (
                // Pause icon
                <svg
                  className="w-6 h-6"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                </svg>
              ) : (
                // Play icon
                <svg
                  className="w-6 h-6 ml-1"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>

            {/* Skip forward button */}
            <button
              onClick={handleSkipForward}
              disabled={!duration}
              className="flex items-center justify-center w-10 h-10 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              aria-label="Skip forward 10 seconds"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 5V1l5 5-5 5V7c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6h2c0 4.42-3.58 8-8 8s-8-3.58-8-8 3.58-8 8-8z" />
                <path d="M13.1 16h-.85v-3.26l-1.01.31v-.69l1.77-.63h.09V16z" />
              </svg>
            </button>

            {/* Time display */}
            <div className="text-sm text-gray-700 font-medium">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>

            {/* Scribble mode toggle (hidden during playback) */}
            {!isPlaying && (
              <button
                onClick={handleScribbleToggle}
                disabled={!duration}
                className={`flex items-center justify-center w-10 h-10 rounded-full transition-all ${
                  isScribbleMode
                    ? 'bg-[#FF6B35] text-white hover:bg-[#FF6B35]/90'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                } disabled:bg-gray-300 disabled:cursor-not-allowed`}
                aria-label="Toggle scribble mode"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </button>
            )}

            {/* Layer controls dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowLayerMenu(!showLayerMenu)}
                disabled={!duration}
                className="flex items-center justify-center w-10 h-10 bg-gray-100 text-gray-700 rounded-full hover:bg-gray-200 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                aria-label="Layer controls"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </button>

              {/* Layer menu dropdown */}
              {showLayerMenu && (
                <div className="absolute bottom-full mb-2 left-0 bg-white border border-gray-200 rounded-lg shadow-lg p-2 min-w-[180px] z-50">
                  <button
                    onClick={() => toggleLayerVisibility('aiDrawings')}
                    className="w-full flex items-center justify-between px-3 py-2 hover:bg-gray-50 rounded transition-colors"
                  >
                    <span className="text-sm text-gray-700">AI Drawings</span>
                    {layerVisibility.aiDrawings ? (
                      <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    )}
                  </button>
                  <button
                    onClick={() => toggleLayerVisibility('myNotes')}
                    className="w-full flex items-center justify-between px-3 py-2 hover:bg-gray-50 rounded transition-colors"
                  >
                    <span className="text-sm text-gray-700">My Notes</span>
                    {layerVisibility.myNotes ? (
                      <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                      </svg>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Transcript toggle */}
            <button
              onClick={onTranscriptToggle}
              disabled={!duration}
              className={`flex items-center justify-center w-10 h-10 rounded-full transition-colors ${
                transcriptVisible
                  ? 'bg-primary text-white hover:bg-primary/90'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              } disabled:bg-gray-300 disabled:cursor-not-allowed`}
              aria-label="Toggle transcript"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </button>
          </div>

          {/* Volume control */}
          <div className="flex items-center space-x-2">
            <svg
              className="w-5 h-5 text-gray-600"
              fill="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z" />
            </svg>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={volume}
              onChange={handleVolumeChange}
              className="w-24 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
            />
            <span className="text-sm text-gray-600 w-8">{Math.round(volume * 100)}%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
