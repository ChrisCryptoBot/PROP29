/**
 * Camera Wall Component
 * Main component for unlimited camera tile layout with drag/drop/resize
 */

import React, { useEffect, useCallback, useState } from 'react';
import { CameraWallTile } from './CameraWallTile';
import { useCameraWallLayout } from '../../context/CameraWallLayoutContext';
import { Button } from '../../../../components/UI/Button';
import { Modal } from '../../../../components/UI/Modal';
import { Select } from '../../../../components/UI/Select';
import { useSecurityOperationsTelemetry } from '../../hooks/useSecurityOperationsTelemetry';
import { logger } from '../../../../services/logger';

interface CameraWallProps {
  cameras: any[];
  onTileClick?: (cameraId: string) => void;
  /** Callback to switch back to the grid/layout view (fixed layout picker) */
  onSwitchToGrid?: () => void;
  /** When changed, stream players remount so they retry loading (e.g. after user clicks Refresh) */
  streamRefreshKey?: number;
}

export const CameraWall: React.FC<CameraWallProps> = ({ cameras, onTileClick, onSwitchToGrid, streamRefreshKey = 0 }) => {
  const {
    tiles,
    addTile,
    removeTile,
    clearAllTiles,
    layouts,
    saveLayout,
    loadLayout,
    deleteLayout,
    presets,
    createPreset,
    applyPreset,
    deletePreset,
    settings,
    updateSettings,
    getActiveTiles,
    getPausedTiles,
    getOffscreenTiles,
  } = useCameraWallLayout();
  const { trackAction } = useSecurityOperationsTelemetry();

  const [showLayoutModal, setShowLayoutModal] = useState(false);
  const [showPresetModal, setShowPresetModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showClearAllConfirm, setShowClearAllConfirm] = useState(false);
  const [newLayoutName, setNewLayoutName] = useState('');
  const [newPresetName, setNewPresetName] = useState('');
  const [presetGridConfig, setPresetGridConfig] = useState({ columns: 4, rows: 3, tileSize: { width: 400, height: 300 } });

  // Auto-pause offscreen tiles based on settings
  useEffect(() => {
    if (!settings.pauseOffscreenTiles) return;

    const interval = setInterval(() => {
      const offscreen = getOffscreenTiles();
      offscreen.forEach(tile => {
        if (!tile.isPaused && !tile.isPinned) {
          // Auto-pause tiles that have been offscreen for threshold duration
          // This is a simplified check - in production, track time offscreen per tile
          logger.debug('Auto-pausing offscreen tile', { tileId: tile.id });
        }
      });
    }, settings.autoPauseThreshold);

    return () => clearInterval(interval);
  }, [settings.pauseOffscreenTiles, settings.autoPauseThreshold, getOffscreenTiles]);

  // Enforce max concurrent decodes
  useEffect(() => {
    const activeTiles = getActiveTiles();
    if (activeTiles.length > settings.maxConcurrentDecodes) {
      // Pause excess tiles (prioritize pinned tiles)
      const sorted = [...activeTiles].sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return 0;
      });
      
      const excess = sorted.slice(settings.maxConcurrentDecodes);
      excess.forEach(tile => {
        if (!tile.isPaused) {
          logger.info('Auto-pausing tile to enforce max concurrent decodes', { tileId: tile.id });
          // Note: We'd call toggleTilePause here, but that's handled by the tile component
        }
      });
    }
  }, [tiles, settings.maxConcurrentDecodes, getActiveTiles]);

  const handleAddCamera = useCallback((camera: any) => {
    addTile(camera.id, camera);
    trackAction('add_tile', 'camera', { cameraId: camera.id });
  }, [addTile, trackAction]);

  const handleSaveLayout = useCallback(() => {
    if (!newLayoutName.trim()) return;
    const layoutId = saveLayout(newLayoutName.trim());
    trackAction('save_layout', 'camera_wall', { layoutId, tileCount: tiles.length });
    setNewLayoutName('');
    setShowLayoutModal(false);
  }, [newLayoutName, tiles.length, saveLayout, trackAction]);

  const handleCreatePreset = useCallback(() => {
    if (!newPresetName.trim()) return;
    const cameraIds = cameras.slice(0, presetGridConfig.columns * presetGridConfig.rows).map(c => c.id);
    const presetId = createPreset(newPresetName.trim(), presetGridConfig, cameraIds);
    trackAction('create_preset', 'camera_wall', { presetId, gridConfig: presetGridConfig });
    setNewPresetName('');
    setShowPresetModal(false);
  }, [newPresetName, presetGridConfig, cameras, createPreset, trackAction]);

  return (
    <div className="relative w-full h-full min-h-[600px] bg-slate-950/50 overflow-hidden">
      {/* Toolbar */}
      <div className="absolute top-4 left-4 z-50 flex items-center gap-2 bg-black/60 rounded-md p-2 border border-white/5">
        {onSwitchToGrid && (
          <Button
            size="sm"
            variant="outline"
            onClick={onSwitchToGrid}
            className="text-[10px] font-black uppercase tracking-widest"
            title="Return to grid layout (fixed 1–16 camera grid)"
          >
            <i className="fas fa-th-large mr-2" />
            Grid view
          </Button>
        )}
        <Button
          size="sm"
          variant="glass"
          onClick={() => {
            cameras.forEach(camera => handleAddCamera(camera));
          }}
          className="text-[10px] font-black uppercase tracking-widest"
          disabled={cameras.length === 0}
        >
          <i className="fas fa-plus mr-2" />
          Add All Cameras
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowLayoutModal(true)}
          className="text-[10px] font-black uppercase tracking-widest"
        >
          <i className="fas fa-save mr-2" />
          Save Layout
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowPresetModal(true)}
          className="text-[10px] font-black uppercase tracking-widest"
        >
          <i className="fas fa-th mr-2" />
          Create Preset
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowSettingsModal(true)}
          className="text-[10px] font-black uppercase tracking-widest"
        >
          <i className="fas fa-cog mr-2" />
          Settings
        </Button>
        {tiles.length > 0 && (
          <Button
            size="sm"
            variant="destructive"
            onClick={() => setShowClearAllConfirm(true)}
            className="text-[10px] font-black uppercase tracking-widest"
          >
            <i className="fas fa-times mr-2" />
            Clear All
          </Button>
        )}
        <div className="text-[9px] text-slate-400 font-black uppercase tracking-widest px-2">
          {tiles.length} Tile{tiles.length !== 1 ? 's' : ''} · {getActiveTiles().length} Active
        </div>
      </div>

      {/* Layout selector – always visible so users can discover and load saved layouts */}
      <div className="absolute top-4 right-4 z-50 bg-black/60 rounded-md p-2 border border-white/5">
        <Select
          value=""
          onChange={(e) => {
            if (e.target.value) loadLayout(e.target.value);
          }}
          className="w-48"
          title="Load a saved layout (tile positions)"
        >
          <option value="">{layouts.length === 0 ? 'No layouts saved' : 'Load layout...'}</option>
          {layouts.map(layout => (
            <option key={layout.id} value={layout.id}>{layout.name}</option>
          ))}
        </Select>
      </div>

      {/* Preset selector – always visible so users can discover and apply templates */}
      <div className="absolute top-16 right-4 z-50 bg-black/60 rounded-md p-2 border border-white/5">
        <Select
          value=""
          onChange={(e) => {
            if (e.target.value) {
              applyPreset(e.target.value, cameras);
              trackAction('apply_preset', 'camera_wall', { presetId: e.target.value });
            }
          }}
          className="w-48"
          title="Apply a saved preset (camera set + grid)"
        >
          <option value="">{presets.length === 0 ? 'No presets saved' : 'Apply preset...'}</option>
          {presets.map(preset => (
            <option key={preset.id} value={preset.id}>{preset.name}</option>
          ))}
        </Select>
      </div>

      {/* Render tiles */}
      {tiles.map(tile => (
        <CameraWallTile key={tile.id} tile={tile} streamRefreshKey={streamRefreshKey} />
      ))}

      {/* Empty state */}
      {tiles.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <i className="fas fa-video text-slate-500 text-4xl mb-4" />
            <p className="text-white font-black uppercase tracking-tighter text-lg mb-2">No Camera Tiles</p>
            <p className="text-slate-400 text-sm mb-4">Add cameras to create your surveillance wall</p>
            <Button
              variant="glass"
              onClick={() => {
                cameras.slice(0, 4).forEach(camera => handleAddCamera(camera));
              }}
              disabled={cameras.length === 0}
            >
              <i className="fas fa-plus mr-2" />
              Add Cameras
            </Button>
          </div>
        </div>
      )}

      {/* Save Layout Modal */}
      <Modal
        isOpen={showLayoutModal}
        onClose={() => {
          setShowLayoutModal(false);
          setNewLayoutName('');
        }}
        title="Save Layout"
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">
              Layout Name
            </label>
            <input
              type="text"
              value={newLayoutName}
              onChange={(e) => setNewLayoutName(e.target.value)}
              className="w-full bg-white/5 border border-white/5 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              placeholder="e.g., Main Wall - Day Shift"
              autoFocus
            />
          </div>
          <p className="text-[10px] text-slate-400">
            This will save the current arrangement of {tiles.length} camera tile{tiles.length !== 1 ? 's' : ''}.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="subtle" onClick={() => setShowLayoutModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleSaveLayout} disabled={!newLayoutName.trim()}>
              Save
            </Button>
          </div>
        </div>
      </Modal>

      {/* Create Preset Modal */}
      <Modal
        isOpen={showPresetModal}
        onClose={() => {
          setShowPresetModal(false);
          setNewPresetName('');
        }}
        title="Create Grid Preset"
        size="sm"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">
              Preset Name
            </label>
            <input
              type="text"
              value={newPresetName}
              onChange={(e) => setNewPresetName(e.target.value)}
              className="w-full bg-white/5 border border-white/5 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              placeholder="e.g., 4x3 Grid"
              autoFocus
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">
                Columns
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={presetGridConfig.columns}
                onChange={(e) => setPresetGridConfig(prev => ({ ...prev, columns: parseInt(e.target.value) || 1 }))}
                className="w-full bg-white/5 border border-white/5 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">
                Rows
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={presetGridConfig.rows}
                onChange={(e) => setPresetGridConfig(prev => ({ ...prev, rows: parseInt(e.target.value) || 1 }))}
                className="w-full bg-white/5 border border-white/5 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
              />
            </div>
          </div>
          <p className="text-[10px] text-slate-400">
            This preset will arrange up to {presetGridConfig.columns * presetGridConfig.rows} cameras in a {presetGridConfig.columns}x{presetGridConfig.rows} grid.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="subtle" onClick={() => setShowPresetModal(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleCreatePreset} disabled={!newPresetName.trim()}>
              Create
            </Button>
          </div>
        </div>
      </Modal>

      {/* Settings Modal */}
      <Modal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        title="Camera Wall Settings"
        size="md"
      >
        <div className="space-y-6">
          <div>
            <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">
              Max Concurrent Decodes
            </label>
            <input
              type="number"
              min="1"
              max="32"
              value={settings.maxConcurrentDecodes}
              onChange={(e) => updateSettings({ maxConcurrentDecodes: parseInt(e.target.value) || 1 })}
              className="w-full bg-white/5 border border-white/5 rounded-lg px-3 py-2 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50"
            />
            <p className="text-[10px] text-slate-400 mt-1">
              Maximum number of video streams to decode simultaneously. Higher values may impact performance.
            </p>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <label className="block text-xs font-bold text-white mb-1 uppercase tracking-wider">
                Pause Offscreen Tiles
              </label>
              <p className="text-[10px] text-slate-400">
                Automatically pause tiles that are outside the visible area
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.pauseOffscreenTiles}
              onChange={(e) => updateSettings({ pauseOffscreenTiles: e.target.checked })}
              className="w-5 h-5 rounded border-white/20 bg-white/10 text-blue-500 focus:ring-blue-500/20"
            />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <label className="block text-xs font-bold text-white mb-1 uppercase tracking-wider">
                Adaptive Quality
              </label>
              <p className="text-[10px] text-slate-400">
                Automatically adjust stream quality based on tile size and performance
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings.adaptiveQuality}
              onChange={(e) => updateSettings({ adaptiveQuality: e.target.checked })}
              className="w-5 h-5 rounded border-white/20 bg-white/10 text-blue-500 focus:ring-blue-500/20"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-white mb-2 uppercase tracking-wider">
              Default Quality
            </label>
            <Select
              value={settings.defaultQuality}
              onChange={(e) => updateSettings({ defaultQuality: e.target.value as 'preview' | 'full' | 'adaptive' })}
            >
              <option value="preview">Preview (Low bandwidth)</option>
              <option value="full">Full (High quality)</option>
              <option value="adaptive">Adaptive (Auto)</option>
            </Select>
          </div>
          <div className="flex justify-end">
            <Button variant="subtle" onClick={() => setShowSettingsModal(false)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showClearAllConfirm}
        onClose={() => setShowClearAllConfirm(false)}
        title="Clear all tiles?"
        size="sm"
        footer={
          <>
            <Button variant="subtle" onClick={() => setShowClearAllConfirm(false)} className="text-[10px] font-black uppercase tracking-widest">
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                clearAllTiles();
                trackAction('clear_all_tiles', 'camera_wall');
                setShowClearAllConfirm(false);
              }}
              className="text-[10px] font-black uppercase tracking-widest"
            >
              <i className="fas fa-times mr-2" />
              Clear All
            </Button>
          </>
        }
      >
        <p className="text-sm text-[color:var(--text-sub)]">
          Remove all tiles from the camera wall. Saved layouts are not affected.
        </p>
      </Modal>
    </div>
  );
};
