/**
 * SEQUENCE MANAGER - Handles complex menu sequences like destination and story flows
 * 
 * This module manages the complex sequences of menus that need to be chained together,
 * such as destination sequences (DESTINATION -> DESTINATION_INFO -> SHOW -> STORY_OVERLAY -> TURN_KEY)
 * and story sequences. It provides a clean interface for managing these flows.
 */

import Phaser from 'phaser';
import { MenuType } from './MenuTypes';
import { MenuQueue } from './MenuQueue';
import { MenuState } from './MenuState';

export interface SequenceStep {
  menuType: MenuType;
  payload?: any;
  delay?: number;
}

export class SequenceManager {
  private scene: Phaser.Scene;
  private menuQueue: MenuQueue;
  private menuState: MenuState;
  private activeSequences: Map<string, SequenceStep[]> = new Map();
  private sequenceCallbacks: Map<string, () => void> = new Map();

  constructor(scene: Phaser.Scene, menuQueue: MenuQueue, menuState: MenuState) {
    this.scene = scene;
    this.menuQueue = menuQueue;
    this.menuState = menuState;
  }

  /**
   * Start a destination sequence
   */
  startDestinationSequence(destinationName: string): void {
    if (this.menuState.isDestinationTransitioning()) {
      return;
    }

    this.menuState.setDestinationTransitioning(true);
    this.menuState.setDestinationSequenceInProgress(true);
    this.menuState.setDestinationSelectedName(destinationName);

    // Pause the game when destination sequence starts
    const appScene = this.scene.scene.get('AppScene');
    if (appScene) {
      (appScene as any).isPaused = true;
      console.log('MenuManager: Game paused for destination sequence');
    }

    // Define the destination sequence steps with delays
    const sequence: SequenceStep[] = [
      { menuType: 'DESTINATION_INFO', payload: { name: destinationName }, delay: 0 },
      { menuType: 'SHOW', delay: 2000 }, // 2 second delay after destination info
      { menuType: 'STORY_OVERLAY', payload: { title: 'the next day', content: '' }, delay: 2000 }, // 2 second delay after show
      { menuType: 'TURN_KEY', delay: 2000 } // 2 second delay after story overlay
    ];

    this.startSequence('destination', sequence, () => {
      this.completeDestinationSequence();
    });
  }

  /**
   * Start a story sequence
   */
  startStorySequence(storyData: { isExitRelated: boolean, exitNumber?: number }): void {
    this.menuState.setStorySequenceInProgress(true);

    // Define story sequence steps based on the story data
    const sequence: SequenceStep[] = [
      { menuType: 'STORY', payload: storyData }
    ];

    this.startSequence('story', sequence, () => {
      this.completeStorySequence();
    });
  }

  /**
   * Start a post-shop sequence
   */
  startPostShopSequence(): void {
    this.menuState.setPostShopSequenceActive(true);

    const sequence: SequenceStep[] = [
      { menuType: 'STORY_OVERLAY', payload: { title: 'later on…', content: '' } },
      { menuType: 'BAND_SLIDE' }
    ];

    this.startSequence('postShop', sequence, () => {
      this.completePostShopSequence();
    });
  }

  /**
   * Start a generic sequence
   */
  private startSequence(sequenceId: string, steps: SequenceStep[], onComplete?: () => void): void {
    this.activeSequences.set(sequenceId, [...steps]);
    if (onComplete) {
      this.sequenceCallbacks.set(sequenceId, onComplete);
    }

    this.processNextStep(sequenceId);
  }

  /**
   * Process the next step in a sequence
   */
  private processNextStep(sequenceId: string): void {
    const steps = this.activeSequences.get(sequenceId);
    if (!steps || steps.length === 0) {
      this.completeSequence(sequenceId);
      return;
    }

    const step = steps.shift()!;
    
    // Add delay if specified
    if (step.delay && step.delay > 0) {
      this.scene.time.delayedCall(step.delay, () => {
        this.menuQueue.enqueue(step.menuType, step.payload);
        // Process the queue immediately for sequence menus
        this.menuQueue.processNext();
        // Continue with next step after processing
        this.scene.time.delayedCall(100, () => {
          this.processNextStep(sequenceId);
        });
      });
    } else {
      this.menuQueue.enqueue(step.menuType, step.payload);
      // Process the queue immediately for sequence menus
      this.menuQueue.processNext();
      // Continue with next step after a short delay
      this.scene.time.delayedCall(100, () => {
        this.processNextStep(sequenceId);
      });
    }
  }

  /**
   * Complete a sequence
   */
  private completeSequence(sequenceId: string): void {
    this.activeSequences.delete(sequenceId);
    const callback = this.sequenceCallbacks.get(sequenceId);
    if (callback) {
      callback();
      this.sequenceCallbacks.delete(sequenceId);
    }
  }

  /**
   * Complete destination sequence
   */
  private completeDestinationSequence(): void {
    this.menuState.setDestinationSequenceInProgress(false);
    this.menuState.setDestinationSelectedName(null);
    this.menuState.setDestinationTransitioning(false);
    console.log('🎬 Destination sequence completed');
  }

  /**
   * Complete story sequence
   */
  private completeStorySequence(): void {
    this.menuState.setStorySequenceInProgress(false);
    console.log('📖 Story sequence completed');
  }

  /**
   * Complete post-shop sequence
   */
  private completePostShopSequence(): void {
    this.menuState.setPostShopSequenceActive(false);
    console.log('🛒 Post-shop sequence completed');
  }

  /**
   * Check if any sequence is in progress
   */
  isAnySequenceInProgress(): boolean {
    return this.menuState.isStorySequenceInProgress() || 
           this.menuState.isDestinationSequenceInProgress() ||
           this.menuState.isPostShopSequenceActive();
  }

  /**
   * Check if a specific sequence is in progress
   */
  isSequenceInProgress(sequenceId: string): boolean {
    return this.activeSequences.has(sequenceId);
  }

  /**
   * Cancel a specific sequence
   */
  cancelSequence(sequenceId: string): void {
    this.activeSequences.delete(sequenceId);
    this.sequenceCallbacks.delete(sequenceId);
  }

  /**
   * Cancel all sequences
   */
  cancelAllSequences(): void {
    this.activeSequences.clear();
    this.sequenceCallbacks.clear();
  }

  /**
   * Get active sequences (for debugging)
   */
  getActiveSequences(): string[] {
    return Array.from(this.activeSequences.keys());
  }
}
