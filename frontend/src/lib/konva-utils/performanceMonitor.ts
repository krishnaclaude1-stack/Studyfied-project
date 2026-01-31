/**
 * Performance monitoring utilities
 * Tracks FPS and logs warnings for performance issues
 */

import { useEffect, useState, useRef } from 'react';

/**
 * Custom hook to monitor FPS using requestAnimationFrame
 * @returns Current FPS value
 */
export function useFPSMonitor(): number {
  const [fps, setFps] = useState(60);
  const frameTimesRef = useRef<number[]>([]);
  const lastFrameTimeRef = useRef<number>(performance.now());
  const animationFrameRef = useRef<number | null>(null);
  const lowFpsStartRef = useRef<number | null>(null);

  useEffect(() => {
    const measureFPS = () => {
      const now = performance.now();
      const delta = now - lastFrameTimeRef.current;
      lastFrameTimeRef.current = now;

      // Store frame times for averaging (last 60 frames)
      frameTimesRef.current.push(delta);
      if (frameTimesRef.current.length > 60) {
        frameTimesRef.current.shift();
      }

      // Calculate average FPS
      if (frameTimesRef.current.length > 0) {
        const averageDelta =
          frameTimesRef.current.reduce((a, b) => a + b, 0) / frameTimesRef.current.length;
        const currentFps = Math.round(1000 / averageDelta);
        setFps(currentFps);

        // Log warning if FPS drops below 50 for more than 2 seconds
        if (currentFps < 50) {
          if (lowFpsStartRef.current === null) {
            lowFpsStartRef.current = now;
          } else if (now - lowFpsStartRef.current > 2000) {
            console.warn(`Performance warning: FPS has been below 50 for 2+ seconds (current: ${currentFps})`);
            lowFpsStartRef.current = now; // Reset timer to avoid spamming warnings
          }
        } else {
          lowFpsStartRef.current = null;
        }
      }

      animationFrameRef.current = requestAnimationFrame(measureFPS);
    };

    animationFrameRef.current = requestAnimationFrame(measureFPS);

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return fps;
}

/**
 * Log performance metrics to console
 * @param label - Label for the metric
 * @param startTime - Start time from performance.now()
 */
export function logPerformanceMetric(label: string, startTime: number): void {
  const duration = performance.now() - startTime;
  console.log(`[Performance] ${label}: ${duration.toFixed(2)}ms`);
}

/**
 * Create a performance marker
 * @param name - Name of the marker
 */
export function markPerformance(name: string): void {
  if (performance.mark) {
    performance.mark(name);
  }
}

/**
 * Measure performance between two markers
 * @param name - Name of the measurement
 * @param startMark - Start marker name
 * @param endMark - End marker name
 */
export function measurePerformance(name: string, startMark: string, endMark: string): void {
  if (performance.measure) {
    try {
      performance.measure(name, startMark, endMark);
      const measure = performance.getEntriesByName(name, 'measure')[0];
      if (measure) {
        console.log(`[Performance] ${name}: ${measure.duration.toFixed(2)}ms`);
      }
    } catch (error) {
      console.error('Error measuring performance:', error);
    }
  }
}

/**
 * Monitor memory usage (if available)
 * @returns Memory info or null if not available
 */
export function getMemoryInfo(): { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number } | null {
  if ('memory' in performance) {
    const memory = (performance as any).memory;
    return {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
    };
  }
  return null;
}

/**
 * Custom hook to monitor memory usage
 * @param intervalMs - Interval in milliseconds to check memory (default: 5000)
 */
export function useMemoryMonitor(intervalMs: number = 5000): void {
  useEffect(() => {
    let initialHeapSize: number | null = null;

    const checkMemory = () => {
      const memoryInfo = getMemoryInfo();
      if (memoryInfo) {
        if (initialHeapSize === null) {
          initialHeapSize = memoryInfo.usedJSHeapSize;
        } else {
          const heapGrowth = memoryInfo.usedJSHeapSize - initialHeapSize;
          const heapGrowthMB = heapGrowth / (1024 * 1024);

          // Warn if heap has grown by more than 50MB
          if (heapGrowthMB > 50) {
            console.warn(`Memory warning: Heap has grown by ${heapGrowthMB.toFixed(2)}MB`);
          }
        }
      }
    };

    const intervalId = setInterval(checkMemory, intervalMs);

    return () => {
      clearInterval(intervalId);
    };
  }, [intervalMs]);
}
