/**
 * Checkpoint calculation utilities
 * Calculates audio checkpoints from lesson manifest for synchronization
 */

import type { LessonManifest, AudioCheckpoint } from '../types/lesson';

// Average speaking rate: ~150 words per minute = 2.5 words per second
const WORDS_PER_SECOND = 2.5;

/**
 * Estimate duration in seconds based on text length
 * @param text - Text to estimate duration for
 * @returns Estimated duration in seconds
 */
function estimateTextDuration(text: string): number {
  const wordCount = text.trim().split(/\s+/).length;
  return wordCount / WORDS_PER_SECOND;
}

/**
 * Calculate audio checkpoints from lesson manifest
 * @param manifest - Lesson manifest with scenes and voiceover segments
 * @returns Array of AudioCheckpoint with cumulative timestamps
 */
export function calculateCheckpoints(manifest: LessonManifest): AudioCheckpoint[] {
  const checkpoints: AudioCheckpoint[] = [];
  let cumulativeTime = 0;

  for (const scene of manifest.scenes) {
    for (const segment of scene.voiceover) {
      checkpoints.push({
        id: segment.checkpointId,
        timestamp: cumulativeTime,
        text: segment.text,
      });

      // Add duration of this segment plus a small pause
      const segmentDuration = estimateTextDuration(segment.text);
      cumulativeTime += segmentDuration + 0.3; // 300ms pause between segments
    }
  }

  return checkpoints;
}

/**
 * Find checkpoint at or near current time
 * @param checkpoints - Array of audio checkpoints
 * @param currentTime - Current audio playback time in seconds
 * @param tolerance - Time tolerance window in seconds (default: 0.5)
 * @returns AudioCheckpoint if found within tolerance, null otherwise
 */
export function findCheckpointAtTime(
  checkpoints: AudioCheckpoint[],
  currentTime: number,
  tolerance: number = 0.5
): AudioCheckpoint | null {
  for (const checkpoint of checkpoints) {
    const timeDiff = Math.abs(currentTime - checkpoint.timestamp);
    if (timeDiff <= tolerance) {
      return checkpoint;
    }
  }
  return null;
}

/**
 * Get the next checkpoint after current time
 * @param checkpoints - Array of audio checkpoints
 * @param currentTime - Current audio playback time in seconds
 * @returns Next AudioCheckpoint or null if no more checkpoints
 */
export function getNextCheckpoint(checkpoints: AudioCheckpoint[], currentTime: number): AudioCheckpoint | null {
  for (const checkpoint of checkpoints) {
    if (checkpoint.timestamp > currentTime) {
      return checkpoint;
    }
  }
  return null;
}

/**
 * Get all checkpoints within a time range
 * @param checkpoints - Array of audio checkpoints
 * @param startTime - Start time in seconds
 * @param endTime - End time in seconds
 * @returns Array of checkpoints within range
 */
export function getCheckpointsInRange(
  checkpoints: AudioCheckpoint[],
  startTime: number,
  endTime: number
): AudioCheckpoint[] {
  return checkpoints.filter((cp) => cp.timestamp >= startTime && cp.timestamp <= endTime);
}
