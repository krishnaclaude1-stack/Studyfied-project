/**
 * Zone positioning utilities for canvas layout
 * Maps zones to coordinates and calculates scaling
 */

import { Zone, ScaleHint } from '../../types/lesson';

export interface Position {
  x: number;
  y: number;
}

/**
 * Calculate position coordinates for a zone
 * @param zone - Zone enum value
 * @param stageWidth - Width of the stage
 * @param stageHeight - Height of the stage
 * @param scaleHint - Scale hint for the asset
 * @returns Position object with x, y coordinates (center point)
 */
export function calculateZonePosition(
  zone: Zone,
  stageWidth: number,
  stageHeight: number,
  scaleHint: ScaleHint
): Position {
  // Zone mappings (percentages of stage dimensions)
  const zoneMap: Record<Zone, { xPercent: number; yPercent: number }> = {
    [Zone.CENTER_MAIN]: { xPercent: 0.5, yPercent: 0.5 },
    [Zone.LEFT_SUPPORT]: { xPercent: 0.25, yPercent: 0.5 },
    [Zone.RIGHT_NOTES]: { xPercent: 0.75, yPercent: 0.5 },
    [Zone.TOP_HEADER]: { xPercent: 0.5, yPercent: 0.15 },
    [Zone.BOTTOM_CONTEXT]: { xPercent: 0.5, yPercent: 0.85 },
  };

  const coords = zoneMap[zone] || zoneMap[Zone.CENTER_MAIN];

  return {
    x: stageWidth * coords.xPercent,
    y: stageHeight * coords.yPercent,
  };
}

/**
 * Calculate scale factor for an image based on scale hint
 * @param scaleHint - Scale hint enum value
 * @param stageWidth - Width of the stage
 * @param imageWidth - Original width of the image
 * @returns Scale factor to apply to image
 */
export function calculateScale(scaleHint: ScaleHint, stageWidth: number, imageWidth: number): number {
  if (imageWidth === 0) return 1;

  // Scale hint mappings (percentage of stage width)
  const scaleMap: Record<ScaleHint, number> = {
    [ScaleHint.LARGE]: 0.8,
    [ScaleHint.MEDIUM]: 0.5,
    [ScaleHint.SMALL]: 0.3,
  };

  const targetWidthPercent = scaleMap[scaleHint] || scaleMap[ScaleHint.MEDIUM];
  const targetWidth = stageWidth * targetWidthPercent;

  return targetWidth / imageWidth;
}

/**
 * Calculate offset to center an image at a position
 * @param imageWidth - Width of the scaled image
 * @param imageHeight - Height of the scaled image
 * @returns Offset object with x, y values to center the image
 */
export function calculateCenterOffset(imageWidth: number, imageHeight: number): Position {
  return {
    x: -imageWidth / 2,
    y: -imageHeight / 2,
  };
}

/**
 * Calculate complete positioning for an asset
 * @param zone - Zone for the asset
 * @param scaleHint - Scale hint for the asset
 * @param stageWidth - Width of the stage
 * @param stageHeight - Height of the stage
 * @param imageWidth - Original width of the image
 * @param imageHeight - Original height of the image
 * @returns Object with position, scale, and offset
 */
export function calculateAssetLayout(
  zone: Zone,
  scaleHint: ScaleHint,
  stageWidth: number,
  stageHeight: number,
  imageWidth: number,
  imageHeight: number
) {
  const position = calculateZonePosition(zone, stageWidth, stageHeight, scaleHint);
  const scale = calculateScale(scaleHint, stageWidth, imageWidth);
  const scaledWidth = imageWidth * scale;
  const scaledHeight = imageHeight * scale;
  const offset = calculateCenterOffset(scaledWidth, scaledHeight);

  return {
    x: position.x + offset.x,
    y: position.y + offset.y,
    scaleX: scale,
    scaleY: scale,
    width: imageWidth,
    height: imageHeight,
  };
}
