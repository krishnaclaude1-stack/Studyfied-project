/**
 * Asset pre-loading utilities
 * Handles loading images and audio from blob URLs with retry logic
 */

import type { Asset } from '../types/lesson';

/**
 * Load an image from a blob URL
 * @param blobUrl - Blob URL of the image
 * @returns Promise that resolves with HTMLImageElement
 */
export async function loadImageFromBlob(blobUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load image from ${blobUrl}`));

    img.src = blobUrl;
  });
}

/**
 * Load an image with retry logic
 * @param blobUrl - Blob URL of the image
 * @param maxRetries - Maximum number of retry attempts (default: 1)
 * @returns Promise that resolves with HTMLImageElement
 */
async function loadImageWithRetry(blobUrl: string, maxRetries: number = 1): Promise<HTMLImageElement> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await loadImageFromBlob(blobUrl);
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxRetries) {
        // Wait 500ms before retry
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }
  }

  throw lastError || new Error('Failed to load image');
}

/**
 * Pre-load all assets in parallel
 * @param assets - Array of Asset objects with blob URLs
 * @returns Promise that resolves with Map of assetId to HTMLImageElement
 */
export async function preloadAssets(assets: Asset[]): Promise<Map<string, HTMLImageElement>> {
  const imageAssets = assets.filter((asset) => asset.type === 'image');

  const loadPromises = imageAssets.map(async (asset) => {
    try {
      const img = await loadImageWithRetry(asset.url);
      return { id: asset.id, img };
    } catch (error) {
      console.error(`Failed to load asset ${asset.id}:`, error);
      throw error;
    }
  });

  const results = await Promise.all(loadPromises);

  const assetMap = new Map<string, HTMLImageElement>();
  results.forEach(({ id, img }) => {
    assetMap.set(id, img);
  });

  return assetMap;
}

/**
 * Load audio from a blob URL
 * @param blobUrl - Blob URL of the audio file
 * @returns Promise that resolves with HTMLAudioElement
 */
export async function loadAudioFromBlob(blobUrl: string): Promise<HTMLAudioElement> {
  return new Promise((resolve, reject) => {
    const audio = new Audio();

    audio.oncanplay = () => resolve(audio);
    audio.onerror = () => reject(new Error(`Failed to load audio from ${blobUrl}`));

    audio.src = blobUrl;
    audio.load();
  });
}

/**
 * Load audio with retry logic
 * @param blobUrl - Blob URL of the audio file
 * @param maxRetries - Maximum number of retry attempts (default: 1)
 * @returns Promise that resolves with HTMLAudioElement
 */
export async function loadAudioWithRetry(blobUrl: string, maxRetries: number = 1): Promise<HTMLAudioElement> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await loadAudioFromBlob(blobUrl);
    } catch (error) {
      lastError = error as Error;
      if (attempt < maxRetries) {
        // Wait 500ms before retry
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }
  }

  throw lastError || new Error('Failed to load audio');
}
