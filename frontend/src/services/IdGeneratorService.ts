/**
 * Centralized ID generation service
 * Ensures consistent ID format and prevents collisions
 */

export class IdGeneratorService {
  private static counter = 0;

  /**
   * Generate unique ID with type prefix
   */
  static generate(type: 'template' | 'route' | 'checkpoint' | 'patrol'): string {
    this.counter++;
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `${type}-${timestamp}-${random}-${this.counter}`;
  }

  /**
   * Generate UUID v4 (for future use)
   */
  static generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }
}
