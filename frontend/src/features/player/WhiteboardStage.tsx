/**
 * Whiteboard Stage Component
 * Main canvas component using React-Konva with layer management
 */

import { useEffect, useState, useRef } from 'react';
import { Stage, Layer } from 'react-konva';
import { useLessonStore } from '../../stores/lessonStore';
import { usePlayerStore } from '../../stores/playerStore';
import { useAnnotationStore } from '../../stores/annotationStore';
import { CanvasRenderer } from './CanvasRenderer';
import { useFPSMonitor, useMemoryMonitor } from '../../lib/konva-utils/performanceMonitor';

export function WhiteboardStage() {
  const stageRef = useRef<any>(null);
  const { lessonManifest } = useLessonStore();
  const { currentSceneId } = usePlayerStore();
  const { layerVisibility } = useAnnotationStore();

  // Performance monitoring
  const fps = useFPSMonitor();
  useMemoryMonitor(5000); // Check memory every 5 seconds

  // Responsive stage dimensions
  const [dimensions, setDimensions] = useState({
    width: window.innerWidth,
    height: window.innerHeight * 0.7, // 70% of viewport height
  });

  // Show FPS in development mode
  const [showDebugHUD, setShowDebugHUD] = useState(false);

  /**
   * Handle window resize
   */
  useEffect(() => {
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight * 0.7,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  /**
   * Toggle debug HUD with keyboard shortcut (Ctrl+Shift+D)
   */
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey && event.shiftKey && event.key === 'D') {
        setShowDebugHUD((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (!lessonManifest) {
    return (
      <div className="flex items-center justify-center w-full h-[70vh] bg-gray-100">
        <p className="text-gray-500">No lesson loaded</p>
      </div>
    );
  }

  return (
    <div className="relative w-full bg-white border border-gray-200 rounded-lg overflow-hidden">
      <Stage width={dimensions.width} height={dimensions.height} ref={stageRef}>
        {/* AI-generated content layer */}
        {layerVisibility.aiDrawings && (
          <Layer name="ai-layer" listening={false}>
            <CanvasRenderer stageWidth={dimensions.width} stageHeight={dimensions.height} />
          </Layer>
        )}

        {/* User annotations layer (future implementation) */}
        {layerVisibility.myNotes && (
          <Layer name="annotation-layer">
            {/* Future: User annotation components will go here */}
          </Layer>
        )}
      </Stage>

      {/* Debug HUD (toggle with Ctrl+Shift+D) */}
      {showDebugHUD && (
        <div className="absolute top-2 right-2 z-50 bg-black/75 text-white px-3 py-2 rounded-md text-xs font-mono pointer-events-none">
          <div className="flex items-center space-x-2">
            <span className={fps >= 55 ? 'text-green-400' : fps >= 45 ? 'text-yellow-400' : 'text-red-400'}>
              FPS: {fps}
            </span>
            <span className="text-gray-400">|</span>
            <span className="text-gray-300">
              {dimensions.width}x{dimensions.height}
            </span>
          </div>
          <div className="text-gray-400 text-[10px] mt-1">
            Press Ctrl+Shift+D to hide
          </div>
        </div>
      )}
    </div>
  );
}
