/**
 * Camera Wall Layout Types
 * Defines types for unlimited camera tile layouts, presets, and multi-monitor support
 */

import type { CameraEntry } from './security-operations.types';

export interface CameraTile {
  id: string;
  cameraId: string;
  camera: CameraEntry;
  position: { x: number; y: number };
  size: { width: number; height: number };
  displayId?: string;
  zIndex: number;
  isPinned?: boolean;
  isMinimized?: boolean;
  quality?: 'preview' | 'full' | 'adaptive';
  isPaused?: boolean;
}

export interface CameraWallLayout {
  id: string;
  name: string;
  description?: string;
  tiles: CameraTile[];
  createdAt: string;
  updatedAt: string;
  isDefault?: boolean;
}

export interface CameraWallPreset {
  id: string;
  name: string;
  description?: string;
  gridConfig: {
    columns: number;
    rows: number;
    tileSize: { width: number; height: number };
  };
  cameraIds: string[];
  createdAt: string;
}

export interface DisplayBounds {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CameraWallSettings {
  maxConcurrentDecodes: number;
  pauseOffscreenTiles: boolean;
  adaptiveQuality: boolean;
  previewModeEnabled: boolean;
  defaultQuality: 'preview' | 'full' | 'adaptive';
  autoPauseThreshold: number; // milliseconds of offscreen time before pause
}

export const DEFAULT_WALL_SETTINGS: CameraWallSettings = {
  maxConcurrentDecodes: 16, // Reasonable default for most hardware
  pauseOffscreenTiles: true,
  adaptiveQuality: true,
  previewModeEnabled: false,
  defaultQuality: 'adaptive',
  autoPauseThreshold: 5000, // 5 seconds
};
