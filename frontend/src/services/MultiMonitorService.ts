/**
 * Multi-Monitor Service
 * Detects and manages multiple displays for camera modal positioning
 * Works in both Electron (full support) and browser (limited support)
 */

export interface Display {
  id: string;
  bounds: { x: number; y: number; width: number; height: number };
  workArea: { x: number; y: number; width: number; height: number };
  scaleFactor: number;
  primary: boolean;
}

class MultiMonitorService {
  private displays: Display[] = [];
  private isElectron: boolean = false;
  private electronAPI: any = null;

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    if (typeof window !== 'undefined' && (window as any).electronAPI) {
      this.electronAPI = (window as any).electronAPI;
      this.isElectron = true;
      this.loadDisplays();
    } else {
      // Browser fallback - single display
      this.displays = [{
        id: 'primary',
        bounds: { x: 0, y: 0, width: window.innerWidth, height: window.innerHeight },
        workArea: { x: 0, y: 0, width: window.innerWidth, height: window.innerHeight },
        scaleFactor: window.devicePixelRatio || 1,
        primary: true
      }];
    }
  }

  /**
   * Load displays from Electron screen API
   */
  private async loadDisplays(): Promise<void> {
    if (!this.isElectron || !this.electronAPI) {
      return;
    }

    try {
      // Request displays from Electron main process
      const displays = await this.electronAPI.invoke('get-displays');
      if (displays && Array.isArray(displays)) {
        this.displays = displays.map((d: any, index: number) => ({
          id: d.id || `display-${index}`,
          bounds: d.bounds || { x: 0, y: 0, width: 1920, height: 1080 },
          workArea: d.workArea || d.bounds || { x: 0, y: 0, width: 1920, height: 1080 },
          scaleFactor: d.scaleFactor || 1,
          primary: d.primary || false
        }));
      }
    } catch (error) {
      console.warn('Failed to load displays, using fallback:', error);
      // Fallback to single display
      this.displays = [{
        id: 'primary',
        bounds: { x: 0, y: 0, width: window.innerWidth, height: window.innerHeight },
        workArea: { x: 0, y: 0, width: window.innerWidth, height: window.innerHeight },
        scaleFactor: window.devicePixelRatio || 1,
        primary: true
      }];
    }
  }

  /**
   * Get all displays
   */
  async getDisplays(): Promise<Display[]> {
    if (this.displays.length === 0) {
      await this.loadDisplays();
    }
    return [...this.displays];
  }

  /**
   * Get primary display
   */
  async getPrimaryDisplay(): Promise<Display | null> {
    const displays = await this.getDisplays();
    return displays.find(d => d.primary) || displays[0] || null;
  }

  /**
   * Check if a point is on a specific display
   */
  async isPointOnDisplay(x: number, y: number, displayId: string): Promise<boolean> {
    const displays = await this.getDisplays();
    const display = displays.find(d => d.id === displayId);
    if (!display) return false;

    const bounds = display.bounds;
    return x >= bounds.x && x < bounds.x + bounds.width &&
           y >= bounds.y && y < bounds.y + bounds.height;
  }

  /**
   * Get display for a point
   */
  async getDisplayForPoint(x: number, y: number): Promise<Display | null> {
    const displays = await this.getDisplays();
    return displays.find(d => {
      const bounds = d.bounds;
      return x >= bounds.x && x < bounds.x + bounds.width &&
             y >= bounds.y && y < bounds.y + bounds.height;
    }) || null;
  }

  /**
   * Clamp position to a specific display
   */
  clampToDisplay(x: number, y: number, width: number, height: number, displayId?: string): { x: number; y: number; displayId: string } {
    const display = displayId 
      ? this.displays.find(d => d.id === displayId)
      : this.displays.find(d => {
          const bounds = d.bounds;
          return x >= bounds.x && x < bounds.x + bounds.width &&
                 y >= bounds.y && y < bounds.y + bounds.height;
        });

    if (!display) {
      // Fallback to primary display
      const primary = this.displays.find(d => d.primary) || this.displays[0];
      if (!primary) {
        return { x: 0, y: 0, displayId: 'primary' };
      }
      const workArea = primary.workArea;
      return {
        x: Math.max(workArea.x, Math.min(workArea.x + workArea.width - width, x)),
        y: Math.max(workArea.y, Math.min(workArea.y + workArea.height - height, y)),
        displayId: primary.id
      };
    }

    const workArea = display.workArea;
    return {
      x: Math.max(workArea.x, Math.min(workArea.x + workArea.width - width, x)),
      y: Math.max(workArea.y, Math.min(workArea.y + workArea.height - height, y)),
      displayId: display.id
    };
  }

  /**
   * Refresh displays (call when displays change)
   */
  async refreshDisplays(): Promise<void> {
    await this.loadDisplays();
  }
}

export const multiMonitorService = new MultiMonitorService();
export default multiMonitorService;
