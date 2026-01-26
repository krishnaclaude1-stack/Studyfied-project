/**
 * Canvas Renderer Component
 * Executes visual events triggered by audio checkpoints
 */

import { useEffect, useState, useCallback } from 'react';
import { useLessonStore } from '../../stores/lessonStore';
import { usePlayerStore } from '../../stores/playerStore';
import { AssetRenderer } from './AssetRenderer';
import type { VisualEvent, AudioCheckpoint } from '../../types/lesson';

interface CanvasRendererProps {
  stageWidth: number;
  stageHeight: number;
}

export function CanvasRenderer({ stageWidth, stageHeight }: CanvasRendererProps) {
  const { lessonManifest, loadedAssets } = useLessonStore();
  const { currentSceneId } = usePlayerStore();
  const [activeEvents, setActiveEvents] = useState<VisualEvent[]>([]);

  /**
   * Handle checkpoint reached events
   */
  const handleCheckpointReached = useCallback(
    (event: Event) => {
      const customEvent = event as CustomEvent<AudioCheckpoint>;
      const checkpoint = customEvent.detail;

      if (!lessonManifest || !currentSceneId) return;

      // Find current scene
      const currentScene = lessonManifest.scenes.find((scene) => scene.sceneId === currentSceneId);
      if (!currentScene) return;

      // Filter events matching this checkpoint
      const newEvents = currentScene.events.filter((evt) => evt.checkpointId === checkpoint.id);

      if (newEvents.length > 0) {
        setActiveEvents((prev) => {
          // Deduplicate by assetId + checkpointId to prevent duplicate renders
          const existingKeys = new Set(prev.map((e) => `${e.assetId}-${e.checkpointId}`));
          const uniqueNewEvents = newEvents.filter(
            (evt) => !existingKeys.has(`${evt.assetId}-${evt.checkpointId}`)
          );
          return [...prev, ...uniqueNewEvents];
        });
      }
    },
    [lessonManifest, currentSceneId]
  );

  /**
   * Handle seek/clear events to reset active events
   */
  const handleSeekClear = useCallback(() => {
    setActiveEvents([]);
  }, []);

  /**
   * Listen for checkpoint and seek events
   */
  useEffect(() => {
    window.addEventListener('checkpoint-reached', handleCheckpointReached);
    window.addEventListener('audio-seek', handleSeekClear);

    return () => {
      window.removeEventListener('checkpoint-reached', handleCheckpointReached);
      window.removeEventListener('audio-seek', handleSeekClear);
    };
  }, [handleCheckpointReached, handleSeekClear]);

  /**
   * Clear active events when scene changes
   */
  useEffect(() => {
    setActiveEvents([]);
  }, [currentSceneId]);

  /**
   * Clear active events when lesson changes
   */
  useEffect(() => {
    setActiveEvents([]);
  }, [lessonManifest]);

  return (
    <>
      {activeEvents.map((event, index) => (
        <AssetRenderer
          key={`${event.assetId}-${event.checkpointId}-${index}`}
          event={event}
          image={loadedAssets.get(event.assetId)}
          stageWidth={stageWidth}
          stageHeight={stageHeight}
        />
      ))}
    </>
  );
}
