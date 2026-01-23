/**
 * TypeScript type definitions matching backend Pydantic schemas
 * Reference: backend/app/schemas/lesson.py
 */

export enum VisualEventType {
  DRAW = 'draw',
  FADE_IN = 'fadeIn',
  HIGHLIGHT = 'highlight',
  MOVE = 'move',
  PAUSE = 'pause',
  QUIZ = 'quiz',
}

export enum Zone {
  CENTER_MAIN = 'centerMain',
  LEFT_SUPPORT = 'leftSupport',
  RIGHT_NOTES = 'rightNotes',
  TOP_HEADER = 'topHeader',
  BOTTOM_CONTEXT = 'bottomContext',
}

export enum Role {
  PRIMARY_DIAGRAM = 'primaryDiagram',
  SUPPORTING_DIAGRAM = 'supportingDiagram',
  PROP = 'prop',
  ICON = 'icon',
}

export enum ScaleHint {
  LARGE = 'large',
  MEDIUM = 'medium',
  SMALL = 'small',
}

export enum InteractionType {
  QUIZ = 'quiz',
  PAUSE_AND_THINK = 'pauseAndThink',
  LABEL_PREDICTION = 'labelPrediction',
  NONE = 'none',
}

export interface VoiceoverSegment {
  text: string;
  checkpointId: string;
}

export interface VisualEvent {
  type: VisualEventType;
  assetId: string;
  checkpointId: string;
  zone: Zone;
  role: Role;
  scaleHint: ScaleHint;
  params: {
    duration?: number;
    [key: string]: any;
  };
}

export interface Interaction {
  type: InteractionType;
  prompt?: string | null;
  options?: string[];
  correctAnswer?: string | null;
}

export interface Scene {
  sceneId: string;
  purpose: string;
  assetsUsed: string[];
  voiceover: VoiceoverSegment[];
  events: VisualEvent[];
  interaction: Interaction;
}

export interface LessonManifest {
  lessonDurationSec: number;
  scenes: Scene[];
}

export interface Asset {
  id: string;
  url: string; // blob URL
  type: 'image' | 'audio';
  metadata?: {
    width?: number;
    height?: number;
    duration?: number;
  };
}

export interface AudioCheckpoint {
  id: string;
  timestamp: number;
  text: string;
}
