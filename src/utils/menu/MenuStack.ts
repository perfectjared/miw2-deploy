/**
 * MENU STACK - Manages menu hierarchy and priority system
 * 
 * This module handles the menu stack, priority management, and menu
 * hierarchy logic. It ensures only one menu is active at a time with
 * predictable behavior based on priority levels.
 */

import { MenuStackItem, MenuType, MENU_PRIORITIES, MENU_CATEGORIES } from './MenuTypes';

export class MenuStack {
  private stack: MenuStackItem[] = [];

  /**
   * Push a menu onto the stack with its priority
   */
  push(menuType: MenuType, config?: any): void {
    const priority = MENU_PRIORITIES[menuType];
    const item: MenuStackItem = { type: menuType, priority, config };
    
    // Insert in priority order (highest first)
    let insertIndex = this.stack.length;
    for (let i = 0; i < this.stack.length; i++) {
      if (this.stack[i].priority < priority) {
        insertIndex = i;
        break;
      }
    }
    
    this.stack.splice(insertIndex, 0, item);
  }

  /**
   * Pop the highest priority menu from the stack
   */
  pop(): MenuStackItem | null {
    return this.stack.shift() || null;
  }

  /**
   * Pop a specific menu type from the stack
   */
  popSpecific(menuType: MenuType): MenuStackItem | null {
    const index = this.stack.findIndex(item => item.type === menuType);
    if (index !== -1) {
      return this.stack.splice(index, 1)[0];
    }
    return null;
  }

  /**
   * Clear all menus of a specific type from the stack
   */
  clearType(menuType: MenuType): void {
    this.stack = this.stack.filter(item => item.type !== menuType);
  }

  /**
   * Get the current top menu (highest priority)
   */
  getCurrent(): MenuStackItem | null {
    return this.stack[0] || null;
  }

  /**
   * Check if a specific menu type is in the stack
   */
  hasType(menuType: MenuType): boolean {
    return this.stack.some(item => item.type === menuType);
  }

  /**
   * Check if any menu of a given category is in the stack
   */
  hasCategory(category: keyof typeof MENU_CATEGORIES): boolean {
    return this.stack.some(item => 
      MENU_CATEGORIES[category].includes(item.type as any)
    );
  }

  /**
   * Get all menus in the stack
   */
  getAll(): MenuStackItem[] {
    return [...this.stack];
  }

  /**
   * Clear the entire stack
   */
  clear(): void {
    this.stack = [];
  }

  /**
   * Get stack state as string for debugging
   */
  getState(): string {
    return this.stack.map(item => `${item.type}(${item.priority})`).join(' -> ');
  }

  /**
   * Check if the stack is empty
   */
  isEmpty(): boolean {
    return this.stack.length === 0;
  }

  /**
   * Get the number of menus in the stack
   */
  size(): number {
    return this.stack.length;
  }
}
