/**
 * Individual asset renderer with Konva animations
 * Handles rendering and animating individual visual events
 */

import { useEffect, useRef } from 'react';
import { Image } from 'react-konva';
import Konva from 'konva';
import type { VisualEvent } from '../../types/lesson';
import { VisualEventType } from '../../types/lesson';
import { calculateAssetLayout } from '../../lib/konva-utils/zoneCalculator';

interface AssetRendererProps {
  event: VisualEvent;
  image: HTMLImageElement | undefined;
  stageWidth: number;
  stageHeight: number;
}

export function AssetRenderer({ event, image, stageWidth, stageHeight }: AssetRendererProps) {
  const imageRef = useRef<Konva.Image>(null);
  const tweenRef = useRef<Konva.Tween | null>(null);

  if (!image) {
    return null;
  }

  const layout = calculateAssetLayout(
    event.zone,
    event.scaleHint,
    stageWidth,
    stageHeight,
    image.width,
    image.height
  );

  /**
   * Apply animations based on event type
   */
  useEffect(() => {
    const node = imageRef.current;
    if (!node) return;

    // Clean up previous tween
    if (tweenRef.current) {
      tweenRef.current.destroy();
      tweenRef.current = null;
    }

    const duration = event.params.duration || 0.5;

    switch (event.type) {
      case VisualEventType.FADE_IN:
        // Start with opacity 0, animate to 1
        node.opacity(0);
        tweenRef.current = new Konva.Tween({
          node: node,
          duration: duration,
          opacity: 1,
          easing: Konva.Easings.EaseInOut,
        });
        tweenRef.current.play();
        break;

      case VisualEventType.HIGHLIGHT:
        // Pulsing effect with scale animation
        tweenRef.current = new Konva.Tween({
          node: node,
          duration: duration / 2,
          scaleX: layout.scaleX * 1.1,
          scaleY: layout.scaleY * 1.1,
          easing: Konva.Easings.EaseInOut,
          yoyo: true,
          repeat: 1,
        });
        tweenRef.current.play();
        break;

      case VisualEventType.MOVE:
        // Animate position change (if target position in params)
        if (event.params.targetX !== undefined && event.params.targetY !== undefined) {
          tweenRef.current = new Konva.Tween({
            node: node,
            duration: duration,
            x: event.params.targetX,
            y: event.params.targetY,
            easing: Konva.Easings.EaseInOut,
          });
          tweenRef.current.play();
        }
        break;

      case VisualEventType.DRAW:
        // Draw animation - fade in with slight scale
        node.opacity(0);
        node.scaleX(layout.scaleX * 0.9);
        node.scaleY(layout.scaleY * 0.9);
        tweenRef.current = new Konva.Tween({
          node: node,
          duration: duration,
          opacity: 1,
          scaleX: layout.scaleX,
          scaleY: layout.scaleY,
          easing: Konva.Easings.EaseInOut,
        });
        tweenRef.current.play();
        break;

      case VisualEventType.PAUSE:
        // Pause - no animation, just show
        node.opacity(1);
        break;

      case VisualEventType.QUIZ:
        // Quiz - fade in for quiz elements
        node.opacity(0);
        tweenRef.current = new Konva.Tween({
          node: node,
          duration: duration,
          opacity: 1,
          easing: Konva.Easings.EaseInOut,
        });
        tweenRef.current.play();
        break;

      default:
        // No animation, just show
        node.opacity(1);
        break;
    }

    // Cleanup on unmount
    return () => {
      if (tweenRef.current) {
        tweenRef.current.destroy();
        tweenRef.current = null;
      }
    };
  }, [event, layout.scaleX, layout.scaleY]);

  return (
    <Image
      ref={imageRef}
      image={image}
      x={layout.x}
      y={layout.y}
      width={layout.width}
      height={layout.height}
      scaleX={layout.scaleX}
      scaleY={layout.scaleY}
      opacity={1}
    />
  );
}
