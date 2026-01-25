/**
 * Main Lesson Player Container
 * Orchestrates asset loading and rendering
 */

import { useEffect, useState } from 'react';
import { useLessonStore } from '../../stores/lessonStore';
import { usePlayerStore } from '../../stores/playerStore';
import { preloadAssets } from '../../lib/assetLoader';
import { calculateCheckpoints } from '../../lib/checkpointCalculator';
import { WhiteboardStage } from './WhiteboardStage';
import { AudioPlayer } from './AudioPlayer';
import { PlaybackControls } from './PlaybackControls';
import { Transcript } from './Transcript';
import type { Asset } from '../../types/lesson';

export function LessonPlayer() {
  const [isTranscriptVisible, setIsTranscriptVisible] = useState(false);
  const {
    lessonManifest,
    audioUrl,
    isLoading,
    error,
    setLoadedAssets,
    setCheckpoints,
    setLoading,
    setError,
  } = useLessonStore();
  const { setCurrentScene } = usePlayerStore();

  /**
   * Pre-load assets when lesson loads
   */
  useEffect(() => {
    if (!lessonManifest || !audioUrl) return;

    const loadAssets = async () => {
      try {
        setLoading(true);
        setError(null);

        // Extract assets from manifest
        // TODO: In real implementation, fetch blob URLs from IndexedDB based on asset IDs
        const assets: Asset[] = [];
        
        // Collect all unique asset IDs from all scenes
        const assetIds = new Set<string>();
        lessonManifest.scenes.forEach((scene) => {
          scene.assetsUsed.forEach((assetId) => assetIds.add(assetId));
        });

        // TODO: Replace with actual IndexedDB lookup
        // For now, create mock Asset objects with placeholder blob URLs
        assetIds.forEach((id) => {
          assets.push({
            id: id,
            url: '', // Would be blob URL from IndexedDB: e.g., 'blob:http://localhost:5173/...'
            type: 'image',
          });
        });

        // Filter assets with valid URLs and pre-load them
        const assetsWithUrls = assets.filter((asset) => asset.url && asset.url.trim() !== '');
        
        if (assetsWithUrls.length > 0) {
          const loadedAssets = await preloadAssets(assetsWithUrls);
          setLoadedAssets(loadedAssets);
        } else {
          // No assets to load, set empty Map
          setLoadedAssets(new Map());
        }

        // Calculate audio checkpoints
        const checkpoints = calculateCheckpoints(lessonManifest);
        setCheckpoints(checkpoints);

        // Set initial scene
        if (lessonManifest.scenes.length > 0) {
          setCurrentScene(lessonManifest.scenes[0].sceneId);
        }

        setLoading(false);
      } catch (err) {
        console.error('Error loading lesson assets:', err);
        setError(err instanceof Error ? err.message : 'Failed to load lesson assets');
        setLoading(false);
      }
    };

    loadAssets();
  }, [lessonManifest, audioUrl, setLoadedAssets, setCheckpoints, setLoading, setError, setCurrentScene]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <p className="text-gray-600">Loading lesson...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="max-w-md p-6 bg-white border border-danger/20 rounded-lg">
          <div className="flex items-center mb-4">
            <svg
              className="w-6 h-6 text-danger mr-2"
              fill="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-2h2v2zm0-4h-2V7h2v6z" />
            </svg>
            <h2 className="text-lg font-semibold text-danger">Error Loading Lesson</h2>
          </div>
          <p className="text-danger/80">{error}</p>
        </div>
      </div>
    );
  }

  if (!lessonManifest || !audioUrl) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <svg
            className="w-16 h-16 text-gray-400 mx-auto mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <p className="text-gray-600">No lesson loaded</p>
          <p className="text-sm text-gray-500 mt-2">Please load a lesson to begin playback</p>
        </div>
      </div>
    );
  }

  /**
   * Set default transcript visibility based on screen size
   */
  useEffect(() => {
    const checkScreenSize = () => {
      setIsTranscriptVisible(window.innerWidth >= 768); // Show on desktop by default
    };
    
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  return (
    <div className="lesson-player min-h-screen bg-gray-50 flex flex-col">
      {/* Main content area with canvas and transcript */}
      <div className="flex-1 flex">
        {/* Canvas area */}
        <div className="flex-1 flex items-center justify-center p-4">
          <WhiteboardStage />
        </div>

        {/* Transcript sidebar */}
        <Transcript 
          isVisible={isTranscriptVisible} 
          onClose={() => setIsTranscriptVisible(false)} 
        />
      </div>

      {/* Audio player (hidden) */}
      <AudioPlayer />

      {/* Playback controls */}
      <PlaybackControls 
        transcriptVisible={isTranscriptVisible}
        onTranscriptToggle={() => setIsTranscriptVisible(!isTranscriptVisible)}
      />
    </div>
  );
}
