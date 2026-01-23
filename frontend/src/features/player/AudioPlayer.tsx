/**
 * Audio Player Component with Checkpoint Synchronization
 * Implements Checkpoint Sync pattern using HTML5 Audio API
 */

import { useEffect, useRef, useCallback } from 'react';
import { usePlayerStore } from '../../stores/playerStore';
import { useLessonStore } from '../../stores/lessonStore';
import { findCheckpointAtTime } from '../../lib/checkpointCalculator';
import type { AudioCheckpoint } from '../../types/lesson';

export function AudioPlayer() {
  const audioRef = useRef<HTMLAudioElement>(null);
  const lastCheckpointRef = useRef<string | null>(null);

  // Subscribe to player store
  const { isPlaying, volume, setCurrentTime, setDuration, pause } = usePlayerStore();

  // Subscribe to lesson store
  const { audioUrl, checkpoints } = useLessonStore();

  /**
   * Dispatch checkpoint reached event
   */
  const dispatchCheckpointEvent = useCallback((checkpoint: AudioCheckpoint) => {
    window.dispatchEvent(
      new CustomEvent('checkpoint-reached', {
        detail: checkpoint,
      })
    );
  }, []);

  /**
   * Handle play/pause based on store state
   */
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.play().catch((error) => {
        console.error('Error playing audio:', error);
        pause();
      });
    } else {
      audio.pause();
    }
  }, [isPlaying, pause]);

  /**
   * Handle volume changes
   */
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = volume;
  }, [volume]);

  /**
   * Attach audio event listeners
   */
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    /**
     * Handle time updates - Check for checkpoint matches
     */
    const handleTimeUpdate = () => {
      const currentTime = audio.currentTime;
      setCurrentTime(currentTime);

      // Find checkpoint at current time (500ms tolerance)
      const checkpoint = findCheckpointAtTime(checkpoints, currentTime, 0.5);

      if (checkpoint && checkpoint.id !== lastCheckpointRef.current) {
        // New checkpoint reached
        lastCheckpointRef.current = checkpoint.id;
        dispatchCheckpointEvent(checkpoint);
      }
    };

    /**
     * Handle metadata loaded - Set duration
     */
    const handleLoadedMetadata = () => {
      setDuration(audio.duration);
    };

    /**
     * Handle playback ended
     */
    const handleEnded = () => {
      pause();
      audio.currentTime = 0;
      setCurrentTime(0);
      lastCheckpointRef.current = null;
      // Dispatch seek event to clear active events
      window.dispatchEvent(new CustomEvent('audio-seek'));
    };

    /**
     * Handle seeking - Reset checkpoint tracking and clear active events
     */
    const handleSeeking = () => {
      lastCheckpointRef.current = null;
      // Dispatch seek event to clear active events in CanvasRenderer
      window.dispatchEvent(new CustomEvent('audio-seek'));
    };

    // Attach event listeners
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('seeking', handleSeeking);

    // Cleanup
    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('seeking', handleSeeking);
    };
  }, [checkpoints, setCurrentTime, setDuration, pause, dispatchCheckpointEvent]);

  if (!audioUrl) {
    return null;
  }

  return (
    <audio
      ref={audioRef}
      src={audioUrl}
      preload="auto"
      style={{ display: 'none' }}
    />
  );
}
