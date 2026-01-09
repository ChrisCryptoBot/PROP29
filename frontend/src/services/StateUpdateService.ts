/**
 * Centralized state update service for Patrol Command Center
 * Eliminates duplicate state update patterns
 */

export class StateUpdateService {
  /**
   * Update existing item in array
   */
  static updateItem<T extends { id: string }>(
    items: T[],
    id: string,
    updates: Partial<T>
  ): T[] {
    return items.map(item =>
      item.id === id ? { ...item, ...updates } : item
    );
  }

  /**
   * Add new item to array
   */
  static addItem<T>(items: T[], newItem: T): T[] {
    return [...items, newItem];
  }

  /**
   * Remove item from array
   */
  static removeItem<T extends { id: string }>(
    items: T[],
    id: string
  ): T[] {
    return items.filter(item => item.id !== id);
  }

  /**
   * Update nested array within items
   */
  static updateNestedArray<
    T extends { id: string; [key: string]: any },
    N extends { id: string }
  >(
    items: T[],
    itemId: string,
    nestedKey: keyof T,
    nestedId: string,
    updates: Partial<N>
  ): T[] {
    return items.map(item => {
      if (item.id !== itemId) return item;

      const nestedArray = item[nestedKey] as N[];
      if (!Array.isArray(nestedArray)) return item;

      const updatedNested = nestedArray.map(nestedItem =>
        nestedItem.id === nestedId
          ? { ...nestedItem, ...updates }
          : nestedItem
      );

      return {
        ...item,
        [nestedKey]: updatedNested
      };
    });
  }

  /**
   * Add item to nested array
   */
  static addToNestedArray<
    T extends { id: string; [key: string]: any },
    N
  >(
    items: T[],
    itemId: string,
    nestedKey: keyof T,
    newItem: N
  ): T[] {
    return items.map(item => {
      if (item.id !== itemId) return item;

      const nestedArray = (item[nestedKey] as N[]) || [];
      return {
        ...item,
        [nestedKey]: [...nestedArray, newItem]
      };
    });
  }
}
