/**
 * AUTO COMPLETE MANAGER - Handles menu auto-completion system
 * 
 * This module manages the universal auto-completion system that prevents
 * the game from getting stuck on functional menus. It uses step-based
 * counting when the game is running and timer-based when paused.
 */

import Phaser from 'phaser';
import { MenuType } from './MenuTypes';

export class AutoCompleteManager {
  private scene: Phaser.Scene;
  private stepCount: number = 0;
  private timer: Phaser.Time.TimerEvent | null = null;
  private countdownText: Phaser.GameObjects.Text | null = null;
  private countdownTimer: Phaser.Time.TimerEvent | null = null;
  private currentMenuType: MenuType | null = null;
  private onAutoComplete: (menuType: MenuType) => void;

  // Menus that should auto-complete
  private readonly AUTO_COMPLETE_MENUS: MenuType[] = [
    'TURN_KEY',  // Prevents game from getting stuck
    'PAUSE',     // Prevents game from getting stuck
    'STORY'      // Prevents game from getting stuck
  ];

  // Menus that should NOT auto-complete
  private readonly NO_AUTO_COMPLETE_MENUS: MenuType[] = [
    'START',      // Initial menu, player chooses when to start
    'CYOA',       // Interactive story content
    'DESTINATION', // Interactive planning content
    'EXIT',       // Interactive shop selection
    'SHOP'        // Interactive shopping content
  ];

  constructor(scene: Phaser.Scene, onAutoComplete: (menuType: MenuType) => void) {
    this.scene = scene;
    this.onAutoComplete = onAutoComplete;
  }

  /**
   * Start auto-completion for a menu
   */
  startAutoComplete(menuType: MenuType): void {
    if (!this.shouldAutoComplete(menuType)) {
      return;
    }

    this.currentMenuType = menuType;
    this.stepCount = 0;

    // Start step-based counting when game is running
    this.startStepBasedCountdown(menuType);

    // Start timer-based counting when game is paused
    this.startTimerBasedCountdown(menuType);

    console.log(`⏰ Auto-completion started for ${menuType}`);
  }

  /**
   * Stop auto-completion
   */
  stopAutoComplete(): void {
    if (this.timer) {
      this.timer.destroy();
      this.timer = null;
    }

    if (this.countdownTimer) {
      this.countdownTimer.destroy();
      this.countdownTimer = null;
    }

    if (this.countdownText) {
      this.countdownText.destroy();
      this.countdownText = null;
    }

    this.currentMenuType = null;
    this.stepCount = 0;

    console.log('⏰ Auto-completion stopped');
  }

  /**
   * Handle step events for step-based counting
   */
  onStepEvent(step: number): void {
    if (!this.currentMenuType || !this.shouldAutoComplete(this.currentMenuType)) {
      return;
    }

    this.stepCount++;

    // Auto-complete after 12 steps
    if (this.stepCount >= 12) {
      this.autoCompleteCurrentMenu();
    }
  }

  /**
   * Start step-based countdown
   */
  private startStepBasedCountdown(menuType: MenuType): void {
    // This will be called by the game's step system
    // The actual counting happens in onStepEvent
  }

  /**
   * Start timer-based countdown
   */
  private startTimerBasedCountdown(menuType: MenuType): void {
    // 12 seconds timer (assuming 1 step per second)
    this.timer = this.scene.time.delayedCall(12000, () => {
      this.autoCompleteCurrentMenu();
    });
  }

  /**
   * Add countdown display
   */
  addCountdown(menuType: MenuType, unit: 'steps' | 'step-lengths'): void {
    if (!this.shouldAutoComplete(menuType)) {
      return;
    }

    const countdownValue = unit === 'steps' ? 12 : 12;
    const unitText = unit === 'steps' ? 'steps' : 'step-lengths';

    // Create countdown text
    this.countdownText = this.scene.add.text(
      this.scene.cameras.main.centerX,
      this.scene.cameras.main.centerY + 100,
      `${countdownValue} ${unitText}`,
      {
        fontSize: '16px',
        color: '#ffffff',
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        padding: { x: 10, y: 5 }
      }
    );
    this.countdownText.setOrigin(0.5, 0.5);
    this.countdownText.setDepth(2500);

    // Update countdown every second
    this.countdownTimer = this.scene.time.addEvent({
      delay: 1000,
      callback: () => {
        if (this.countdownText) {
          const remaining = Math.max(0, countdownValue - Math.floor(this.scene.time.now / 1000));
          this.countdownText.setText(`${remaining} ${unitText}`);
          
          if (remaining <= 0) {
            this.countdownText.destroy();
            this.countdownText = null;
          }
        }
      },
      loop: true
    });
  }

  /**
   * Auto-complete the current menu
   */
  private autoCompleteCurrentMenu(): void {
    if (!this.currentMenuType) {
      return;
    }

    console.log(`⏰ Auto-completing menu: ${this.currentMenuType}`);
    
    // Stop auto-completion
    this.stopAutoComplete();
    
    // Trigger auto-complete callback
    this.onAutoComplete(this.currentMenuType);
  }

  /**
   * Check if a menu should auto-complete
   */
  private shouldAutoComplete(menuType: MenuType): boolean {
    return this.AUTO_COMPLETE_MENUS.includes(menuType);
  }

  /**
   * Check if a menu should NOT auto-complete
   */
  private shouldNotAutoComplete(menuType: MenuType): boolean {
    return this.NO_AUTO_COMPLETE_MENUS.includes(menuType);
  }

  /**
   * Get current menu type
   */
  getCurrentMenuType(): MenuType | null {
    return this.currentMenuType;
  }

  /**
   * Check if auto-completion is active
   */
  isActive(): boolean {
    return this.currentMenuType !== null;
  }

  /**
   * Get current step count
   */
  getStepCount(): number {
    return this.stepCount;
  }

  /**
   * Reset step count
   */
  resetStepCount(): void {
    this.stepCount = 0;
  }
}
