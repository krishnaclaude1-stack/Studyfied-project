/**
 * Whiteboard Stage Component
 * Main canvas component using React-Konva with layer management
 */

import { useEffect, useState, useRef } from 'react';
import { Stage, Layer, Line } from 'react-konva';
import { useLessonStore } from '../../stores/lessonStore';
import { usePlayerStore } from '../../stores/playerStore';
import { useAnnotationStore } from '../../stores/annotationStore';
import { CanvasRenderer } from './CanvasRenderer';
import { useFPSMonitor, useMemoryMonitor } from '../../lib/konva-utils/performanceMonitor';
import type Konva from 'konva';

interface LinePoint {
  x: number;
  y: number;
}

export function WhiteboardStage() {
  const stageRef = useRef<Konva.Stage>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { lessonManifest } = useLessonStore();
  const { currentSceneId, isPlaying } = usePlayerStore();
  const { layerVisibility, isScribbleMode, lines, addLine } = useAnnotationStore();

  // Drawing state
  const [currentLine, setCurrentLine] = useState<LinePoint[] | null>(null);
  const isDrawingRef = useRef(false);
  const lastPointerPositionRef = useRef<{ x: number; y: number } | null>(null);
  const rafIdRef = useRef<number | null>(null);

  // Performance monitoring
  const fps = useFPSMonitor();
  useMemoryMonitor(5000); // Check memory every 5 seconds

  // Stage dimensions based on container size
  const [dimensions, setDimensions] = useState({
    width: 800,
    height: 600,
  });

  // Show FPS in development mode
  const [showDebugHUD, setShowDebugHUD] = useState(false);

  /**
   * Measure container size and update stage dimensions
   */
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const { clientWidth, clientHeight } = containerRef.current;
        setDimensions({
          width: clientWidth,
          height: clientHeight,
        });
      }
    };

    // Initial measurement
    updateDimensions();

    // Use ResizeObserver to detect container size changes
    const resizeObserver = new ResizeObserver(() => {
      updateDimensions();
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

  /**
   * Cleanup RAF on unmount
   */
  useEffect(() => {
    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
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

  /**
   * Get pointer position from event
   */
  const getPointerPosition = (e: any): { x: number; y: number } | null => {
    const stage = stageRef.current;
    if (!stage) return null;
    return stage.getPointerPosition();
  };

  /**
   * Handle mouse/touch down - start drawing
   */
  const handlePointerDown = (e: any) => {
    if (!isScribbleMode || isPlaying) return;

    isDrawingRef.current = true;
    const pos = getPointerPosition(e);
    if (pos) {
      lastPointerPositionRef.current = pos;
      setCurrentLine([pos]);
    }

    // Prevent default touch behavior
    if (e.evt && e.evt.preventDefault) {
      e.evt.preventDefault();
    }
  };

  /**
   * Handle mouse/touch move - continue drawing
   */
  const handlePointerMove = (e: any) => {
    if (!isDrawingRef.current || !isScribbleMode || isPlaying) return;

    // Prevent default touch behavior
    if (e.evt && e.evt.preventDefault) {
      e.evt.preventDefault();
    }

    // Use requestAnimationFrame for touch optimization
    if (rafIdRef.current) {
      cancelAnimationFrame(rafIdRef.current);
    }

    rafIdRef.current = requestAnimationFrame(() => {
      const pos = getPointerPosition(e);
      if (pos && currentLine) {
        lastPointerPositionRef.current = pos;
        setCurrentLine([...currentLine, pos]);
      }
    });
  };

  /**
   * Handle mouse/touch up - finish drawing
   */
  const handlePointerUp = () => {
    if (!isDrawingRef.current) return;

    isDrawingRef.current = false;
    if (currentLine && currentLine.length > 0) {
      addLine(currentLine);
      setCurrentLine(null);
    }
    lastPointerPositionRef.current = null;
  };

  /**
   * Handle mouse leave - finish drawing if in progress
   */
  const handleMouseLeave = () => {
    if (isDrawingRef.current) {
      handlePointerUp();
    }
  };

  if (!lessonManifest) {
    return (
      <div className="flex items-center justify-center w-full h-[70vh] bg-gray-100">
        <p className="text-gray-500">No lesson loaded</p>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full bg-white border border-gray-200 rounded-lg overflow-hidden"
      style={{ 
        cursor: isScribbleMode ? 'crosshair' : 'default',
        touchAction: isScribbleMode ? 'none' : 'auto'
      }}
    >
      <Stage 
        width={dimensions.width} 
        height={dimensions.height} 
        ref={stageRef}
        onMouseDown={handlePointerDown}
        onMouseMove={handlePointerMove}
        onMouseUp={handlePointerUp}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handlePointerDown}
        onTouchMove={handlePointerMove}
        onTouchEnd={handlePointerUp}
      >
        {/* AI-generated content layer */}
        <Layer 
          name="ai-layer" 
          listening={false}
          opacity={layerVisibility.aiDrawings ? 1 : 0.1}
        >
          <CanvasRenderer stageWidth={dimensions.width} stageHeight={dimensions.height} />
        </Layer>

        {/* User annotations layer */}
        <Layer 
          name="annotation-layer"
          opacity={layerVisibility.myNotes ? 1 : 0.1}
        >
          {/* Render saved lines */}
          {lines.map((line, i) => (
            <Line
              key={i}
              points={line.flatMap((p) => [p.x, p.y])}
              stroke="#FF6B35"
              strokeWidth={3}
              tension={0.5}
              lineCap="round"
              lineJoin="round"
              globalCompositeOperation="source-over"
            />
          ))}

          {/* Render current line being drawn */}
          {currentLine && (
            <Line
              points={currentLine.flatMap((p) => [p.x, p.y])}
              stroke="#FF6B35"
              strokeWidth={3}
              tension={0.5}
              lineCap="round"
              lineJoin="round"
              globalCompositeOperation="source-over"
            />
          )}
        </Layer>
      </Stage>

      {/* Debug HUD (toggle with Ctrl+Shift+D) */}
      {showDebugHUD && (
        <div className="absolute top-2 right-2 z-50 bg-black/75 text-white px-3 py-2 rounded-md text-xs font-mono pointer-events-none">
          <div className="flex items-center space-x-2">
            <span className={fps >= 55 ? 'text-success' : fps >= 45 ? 'text-warning' : 'text-danger'}>
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
