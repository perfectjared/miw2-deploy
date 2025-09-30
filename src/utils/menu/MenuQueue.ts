/**
 * MENU QUEUE - Manages menu queuing and timing
 * 
 * This module handles the queuing system for menus that need to be
 * deferred due to conflicts or timing issues. It provides a clean
 * interface for managing queued menus and processing them when appropriate.
 */

import Phaser from 'phaser';
import { QueuedMenu, MenuType } from './MenuTypes';

export class MenuQueue {
  private queue: QueuedMenu[] = [];
  private scene: Phaser.Scene;
  private processingCallback?: (menu: QueuedMenu) => void;
  private isProcessing = false;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * Set the callback function to process queued menus
   */
  setProcessingCallback(callback: (menu: QueuedMenu) => void): void {
    this.processingCallback = callback;
  }

  /**
   * Add a menu to the queue
   */
  enqueue(menuType: MenuType, payload?: any): void {
    const queuedMenu: QueuedMenu = { type: menuType, payload };
    this.queue.push(queuedMenu);
    console.log(`📋 Queued menu: ${menuType}`, payload ? `with payload: ${JSON.stringify(payload)}` : '');
  }

  /**
   * Process the next menu in the queue
   */
  processNext(): boolean {
    if (this.queue.length === 0 || this.isProcessing) {
      return false;
    }

    const next = this.queue.shift();
    if (!next || !this.processingCallback) {
      return false;
    }

    this.isProcessing = true;
    
    // Defer slightly to let prior operations complete
    this.scene.time.delayedCall(50, () => {
      try {
        this.processingCallback!(next);
      } catch (error) {
        console.error('Error processing queued menu:', error);
      } finally {
        this.isProcessing = false;
      }
    });

    return true;
  }

  /**
   * Process all queued menus
   */
  processAll(): void {
    while (this.processNext()) {
      // Continue processing until queue is empty or processing is blocked
    }
  }

  /**
   * Check if the queue has any menus
   */
  hasQueuedMenus(): boolean {
    return this.queue.length > 0;
  }

  /**
   * Get the number of queued menus
   */
  getQueueLength(): number {
    return this.queue.length;
  }

  /**
   * Clear all queued menus
   */
  clear(): void {
    this.queue = [];
  }

  /**
   * Get all queued menus (for debugging)
   */
  getAll(): QueuedMenu[] {
    return [...this.queue];
  }

  /**
   * Check if a specific menu type is queued
   */
  hasType(menuType: MenuType): boolean {
    return this.queue.some(menu => menu.type === menuType);
  }

  /**
   * Remove all instances of a specific menu type from the queue
   */
  removeType(menuType: MenuType): void {
    this.queue = this.queue.filter(menu => menu.type !== menuType);
  }

  /**
   * Get queue state as string for debugging
   */
  getState(): string {
    return this.queue.map(menu => menu.type).join(', ');
  }
}
