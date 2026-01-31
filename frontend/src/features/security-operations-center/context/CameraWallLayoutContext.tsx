/**
 * Camera Wall Layout Context
 * Manages unlimited camera tiles, layouts, presets, and multi-monitor positioning
 */

import React, { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react';
import type { CameraTile, CameraWallLayout, CameraWallPreset, CameraWallSettings, DisplayBounds } from '../types/camera-wall.types';
import { DEFAULT_WALL_SETTINGS } from '../types/camera-wall.types';
import { multiMonitorService } from '../../../services/MultiMonitorService';
import { logger } from '../../../services/logger';

const LAYOUT_STORAGE_KEY = 'security-operations-camera-wall-layouts';
const PRESETS_STORAGE_KEY = 'security-operations-camera-wall-presets';
const SETTINGS_STORAGE_KEY = 'security-operations-camera-wall-settings';

interface CameraWallLayoutContextValue {
  // Current tiles
  tiles: CameraTile[];
  addTile: (cameraId: string, camera: any) => string; // Returns tile ID
  removeTile: (tileId: string) => void;
  updateTilePosition: (tileId: string, position: { x: number; y: number }) => void;
  updateTileSize: (tileId: string, size: { width: number; height: number }) => void;
  updateTileDisplay: (tileId: string, displayId: string) => void;
  updateTileQuality: (tileId: string, quality: 'preview' | 'full' | 'adaptive') => void;
  toggleTilePause: (tileId: string) => void;
  toggleTilePin: (tileId: string) => void;
  toggleTileMinimize: (tileId: string) => void;
  bringTileToFront: (tileId: string) => void;
  clearAllTiles: () => void;
  
  // Layouts
  layouts: CameraWallLayout[];
  saveLayout: (name: string, description?: string) => string; // Returns layout ID
  loadLayout: (layoutId: string) => void;
  deleteLayout: (layoutId: string) => void;
  currentLayoutId: string | null;
  
  // Presets
  presets: CameraWallPreset[];
  createPreset: (name: string, gridConfig: { columns: number; rows: number; tileSize: { width: number; height: number } }, cameraIds: string[], description?: string) => string;
  applyPreset: (presetId: string, cameras: any[]) => void;
  deletePreset: (presetId: string) => void;
  
  // Settings
  settings: CameraWallSettings;
  updateSettings: (newSettings: Partial<CameraWallSettings>) => void;
  
  // Multi-monitor
  displays: DisplayBounds[];
  refreshDisplays: () => Promise<void>;
  
  // Performance
  getActiveTiles: () => CameraTile[];
  getPausedTiles: () => CameraTile[];
  getOffscreenTiles: () => CameraTile[];
}

const CameraWallLayoutContext = createContext<CameraWallLayoutContextValue | undefined>(undefined);

let nextTileId = 1;
let nextZIndex = 1000;

function loadFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    logger.warn('Failed to save to localStorage', { key, error: e });
  }
}

export const CameraWallLayoutProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [tiles, setTiles] = useState<CameraTile[]>([]);
  const [layouts, setLayouts] = useState<CameraWallLayout[]>(loadFromStorage(LAYOUT_STORAGE_KEY, []));
  const [presets, setPresets] = useState<CameraWallPreset[]>(loadFromStorage(PRESETS_STORAGE_KEY, []));
  const [settings, setSettings] = useState<CameraWallSettings>(loadFromStorage(SETTINGS_STORAGE_KEY, DEFAULT_WALL_SETTINGS));
  const [displays, setDisplays] = useState<DisplayBounds[]>([]);
  const [currentLayoutId, setCurrentLayoutId] = useState<string | null>(null);

  // Load displays on mount
  useEffect(() => {
    refreshDisplays();
  }, []);

  // Persist layouts and presets
  useEffect(() => {
    saveToStorage(LAYOUT_STORAGE_KEY, layouts);
  }, [layouts]);

  useEffect(() => {
    saveToStorage(PRESETS_STORAGE_KEY, presets);
  }, [presets]);

  useEffect(() => {
    saveToStorage(SETTINGS_STORAGE_KEY, settings);
  }, [settings]);

  const refreshDisplays = useCallback(async () => {
    const displayList = await multiMonitorService.getDisplays();
    setDisplays(displayList.map(d => ({
      id: d.id,
      x: d.bounds.x,
      y: d.bounds.y,
      width: d.bounds.width,
      height: d.bounds.height,
    })));
  }, []);

  const addTile = useCallback((cameraId: string, camera: any): string => {
    const tileId = `tile-${nextTileId++}`;
    const primaryDisplay = displays.find(d => d.id === 'primary') || displays[0];
    
    // Default tile size
    const defaultSize = { width: 400, height: 300 };
    
    // Position in center of primary display or viewport
    const x = primaryDisplay 
      ? primaryDisplay.x + (primaryDisplay.width - defaultSize.width) / 2
      : (window.innerWidth - defaultSize.width) / 2;
    const y = primaryDisplay
      ? primaryDisplay.y + (primaryDisplay.height - defaultSize.height) / 2
      : (window.innerHeight - defaultSize.height) / 2;

    const newTile: CameraTile = {
      id: tileId,
      cameraId,
      camera,
      position: { x, y },
      size: defaultSize,
      displayId: primaryDisplay?.id,
      zIndex: nextZIndex++,
      isPinned: false,
      isMinimized: false,
      quality: settings.defaultQuality,
      isPaused: false,
    };

    setTiles(prev => [...prev, newTile]);
    return tileId;
  }, [displays, settings.defaultQuality]);

  const removeTile = useCallback((tileId: string) => {
    setTiles(prev => prev.filter(t => t.id !== tileId));
  }, []);

  const updateTilePosition = useCallback((tileId: string, position: { x: number; y: number }) => {
    setTiles(prev => prev.map(t => 
      t.id === tileId ? { ...t, position } : t
    ));
  }, []);

  const updateTileSize = useCallback((tileId: string, size: { width: number; height: number }) => {
    setTiles(prev => prev.map(t => 
      t.id === tileId ? { ...t, size } : t
    ));
  }, []);

  const updateTileDisplay = useCallback((tileId: string, displayId: string) => {
    setTiles(prev => prev.map(t => 
      t.id === tileId ? { ...t, displayId } : t
    ));
  }, []);

  const updateTileQuality = useCallback((tileId: string, quality: 'preview' | 'full' | 'adaptive') => {
    setTiles(prev => prev.map(t => 
      t.id === tileId ? { ...t, quality } : t
    ));
  }, []);

  const toggleTilePause = useCallback((tileId: string) => {
    setTiles(prev => prev.map(t => 
      t.id === tileId ? { ...t, isPaused: !t.isPaused } : t
    ));
  }, []);

  const toggleTilePin = useCallback((tileId: string) => {
    setTiles(prev => prev.map(t => 
      t.id === tileId ? { ...t, isPinned: !t.isPinned } : t
    ));
  }, []);

  const toggleTileMinimize = useCallback((tileId: string) => {
    setTiles(prev => prev.map(t => 
      t.id === tileId ? { ...t, isMinimized: !t.isMinimized } : t
    ));
  }, []);

  const bringTileToFront = useCallback((tileId: string) => {
    setTiles(prev => prev.map(t => 
      t.id === tileId ? { ...t, zIndex: nextZIndex++ } : t
    ));
  }, []);

  const clearAllTiles = useCallback(() => {
    setTiles([]);
    setCurrentLayoutId(null);
  }, []);

  const saveLayout = useCallback((name: string, description?: string): string => {
    const layoutId = `layout-${Date.now()}`;
    const layout: CameraWallLayout = {
      id: layoutId,
      name,
      description,
      tiles: [...tiles],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setLayouts(prev => [...prev, layout]);
    setCurrentLayoutId(layoutId);
    return layoutId;
  }, [tiles]);

  const loadLayout = useCallback((layoutId: string) => {
    const layout = layouts.find(l => l.id === layoutId);
    if (layout) {
      setTiles(layout.tiles.map(t => ({ ...t, zIndex: nextZIndex++ })));
      setCurrentLayoutId(layoutId);
    }
  }, [layouts]);

  const deleteLayout = useCallback((layoutId: string) => {
    setLayouts(prev => prev.filter(l => l.id !== layoutId));
    if (currentLayoutId === layoutId) {
      setCurrentLayoutId(null);
    }
  }, [currentLayoutId]);

  const createPreset = useCallback((
    name: string,
    gridConfig: { columns: number; rows: number; tileSize: { width: number; height: number } },
    cameraIds: string[],
    description?: string
  ): string => {
    const presetId = `preset-${Date.now()}`;
    const preset: CameraWallPreset = {
      id: presetId,
      name,
      description,
      gridConfig,
      cameraIds,
      createdAt: new Date().toISOString(),
    };
    setPresets(prev => [...prev, preset]);
    return presetId;
  }, []);

  const applyPreset = useCallback((presetId: string, cameras: any[]) => {
    const preset = presets.find(p => p.id === presetId);
    if (!preset) return;

    const primaryDisplay = displays.find(d => d.id === 'primary') || displays[0];
    const startX = primaryDisplay?.x || 0;
    const startY = primaryDisplay?.y || 0;
    const { columns, rows, tileSize } = preset.gridConfig;

    const newTiles: CameraTile[] = [];
    let tileIndex = 0;

    for (let row = 0; row < rows && tileIndex < preset.cameraIds.length; row++) {
      for (let col = 0; col < columns && tileIndex < preset.cameraIds.length; col++) {
        const cameraId = preset.cameraIds[tileIndex];
        const camera = cameras.find(c => c.id === cameraId);
        if (camera) {
          newTiles.push({
            id: `tile-${nextTileId++}`,
            cameraId,
            camera,
            position: {
              x: startX + col * (tileSize.width + 10),
              y: startY + row * (tileSize.height + 10),
            },
            size: tileSize,
            displayId: primaryDisplay?.id,
            zIndex: nextZIndex++,
            isPinned: false,
            isMinimized: false,
            quality: settings.defaultQuality,
            isPaused: false,
          });
        }
        tileIndex++;
      }
    }

    setTiles(newTiles);
    setCurrentLayoutId(null);
  }, [presets, displays, settings.defaultQuality]);

  const deletePreset = useCallback((presetId: string) => {
    setPresets(prev => prev.filter(p => p.id !== presetId));
  }, []);

  const updateSettings = useCallback((newSettings: Partial<CameraWallSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  const getActiveTiles = useCallback((): CameraTile[] => {
    return tiles.filter(t => !t.isPaused && !t.isMinimized);
  }, [tiles]);

  const getPausedTiles = useCallback((): CameraTile[] => {
    return tiles.filter(t => t.isPaused);
  }, [tiles]);

  const getOffscreenTiles = useCallback((): CameraTile[] => {
    // Check if tile is outside all displays
    return tiles.filter(tile => {
      const tileRight = tile.position.x + tile.size.width;
      const tileBottom = tile.position.y + tile.size.height;
      
      return displays.every(display => {
        const displayRight = display.x + display.width;
        const displayBottom = display.y + display.height;
        return tileRight < display.x || tile.position.x > displayRight ||
               tileBottom < display.y || tile.position.y > displayBottom;
      });
    });
  }, [tiles, displays]);

  return (
    <CameraWallLayoutContext.Provider
      value={{
        tiles,
        addTile,
        removeTile,
        updateTilePosition,
        updateTileSize,
        updateTileDisplay,
        updateTileQuality,
        toggleTilePause,
        toggleTilePin,
        toggleTileMinimize,
        bringTileToFront,
        clearAllTiles,
        layouts,
        saveLayout,
        loadLayout,
        deleteLayout,
        currentLayoutId,
        presets,
        createPreset,
        applyPreset,
        deletePreset,
        settings,
        updateSettings,
        displays,
        refreshDisplays,
        getActiveTiles,
        getPausedTiles,
        getOffscreenTiles,
      }}
    >
      {children}
    </CameraWallLayoutContext.Provider>
  );
};

export const useCameraWallLayout = (): CameraWallLayoutContextValue => {
  const context = useContext(CameraWallLayoutContext);
  if (!context) {
    throw new Error('useCameraWallLayout must be used within CameraWallLayoutProvider');
  }
  return context;
};
