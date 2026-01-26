/**
 * Unified Property Items Types
 * Combines Lost & Found and Packages types
 */

// Re-export Lost & Found types
export * from '../../lost-and-found/types/lost-and-found.types';

// Re-export Package types
export * from '../../packages/types/package.types';

// Unified item category
export type PropertyItemCategory = 'lost-found' | 'package';

// Unified item type (for filtering/searching across both)
export type UnifiedPropertyItem = {
  id: string;
  category: PropertyItemCategory;
  type: string;
  description: string;
  status: string;
  location?: any;
  date: string;
  guest_id?: string;
  property_id: string;
};

// Unified tab ID
export type TabId = 'overview' | 'lost-found' | 'packages' | 'analytics' | 'settings';
