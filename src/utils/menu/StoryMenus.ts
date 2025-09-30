/**
 * STORY MENUS - Handles story-related menus and overlays
 * 
 * This module manages story content, CYOA (Choose Your Own Adventure) menus,
 * and story overlays. It provides a clean interface for narrative content.
 */

import Phaser from 'phaser';
import { MenuConfig, MenuType } from './MenuTypes';
import { MenuState } from './MenuState';
import { MenuQueue } from './MenuQueue';

export class StoryMenus {
  private scene: Phaser.Scene;
  private menuState: MenuState;
  private menuQueue: MenuQueue;
  private createDialog: (config: MenuConfig, menuType: MenuType) => void;
  private closeDialog: () => void;
  private clearCurrentDialog: () => void;
  private canShowMenu: (menuType: MenuType) => boolean;
  private pushMenu: (menuType: MenuType, config?: any) => void;

  constructor(
    scene: Phaser.Scene,
    menuState: MenuState,
    menuQueue: MenuQueue,
    callbacks: {
      createDialog: (config: MenuConfig, menuType: MenuType) => void;
      closeDialog: () => void;
      clearCurrentDialog: () => void;
      canShowMenu: (menuType: MenuType) => boolean;
      pushMenu: (menuType: MenuType, config?: any) => void;
    }
  ) {
    this.scene = scene;
    this.menuState = menuState;
    this.menuQueue = menuQueue;
    this.createDialog = callbacks.createDialog;
    this.closeDialog = callbacks.closeDialog;
    this.clearCurrentDialog = callbacks.clearCurrentDialog;
    this.canShowMenu = callbacks.canShowMenu;
    this.pushMenu = callbacks.pushMenu;
  }

  /**
   * Show story overlay
   */
  showStoryOverlay(title: string, content: string): void {
    console.log(`🎬 showStoryOverlay called with title: "${title}"`);
    
    // If EXIT/SHOP is open, queue with payload and bail
    if (this.menuState.isExitOrShopOpen()) { 
      this.menuQueue.enqueue('STORY_OVERLAY', { title, content }); 
      return; 
    }
    
    // Don't clear current dialog for "the next day" overlay - it's part of the destination sequence
    if (title !== 'the next day') {
      this.clearCurrentDialog();
    }
    
    // Use H menu styling through WindowShapes instead of custom graphics
    const gameScene = this.scene.scene.get('GameScene') as any;
    if (!gameScene || !gameScene.windowShapes) {
      console.warn('Cannot create story overlay: GameScene or WindowShapes not available');
      return;
    }

    const x = this.scene.cameras.main.centerX;
    const y = this.scene.cameras.main.centerY;
    const width = 400;
    const height = 200;

    const storyTexts = [content];
    const choices = [
      {
        text: "Continue",
        callback: () => {
          console.log("Story overlay dismissed by user");
          // Let closeDialog() handle all chaining logic, including destination sequence
          this.closeDialog();
        }
      }
    ];
    
    // Use the CYOA system with H menu styling for story overlays
    const storyContainer = gameScene.windowShapes.createCYOADialog(x, y, width, height, storyTexts, choices);
    
    if (storyContainer) {
      // Set proper depth for story overlays (above all game elements including pets and items)
      storyContainer.setDepth(1000);
      this.menuState.setCurrentDialog(storyContainer);
    }
  }

  /**
   * Show CYOA menu
   */
  showCyoaMenu(cyoaData: { 
    cyoaId: number, 
    isExitRelated: boolean, 
    exitNumber?: number, 
    exitTiming?: 'before' | 'after' 
  }): void {
    if (!this.canShowMenu('CYOA')) return;

    this.clearCurrentDialog();
    this.pushMenu('CYOA');
    this.menuState.setCurrentDisplayedMenuType('CYOA');

    // Pause game while CYOA is open
    try {
      const appScene = this.scene.scene.get('AppScene');
      const gameScene = this.scene.scene.get('GameScene');
      if (appScene) { (appScene as any).isPaused = true; }
      if (gameScene) { (gameScene as any).events.emit('gamePaused'); }
    } catch {}

    // Get CYOA content based on ID
    const cyoaContent = this.getCyoaContent(cyoaData.cyoaId);
    
    const menuConfig: MenuConfig = {
      title: 'CHOOSE YOUR OWN ADVENTURE',
      content: cyoaContent.text,
      buttons: [
        { 
          text: cyoaContent.optionA, 
          onClick: () => { 
            this.handleCyoaChoice(cyoaData, 'A', cyoaContent.followA);
          } 
        },
        { 
          text: cyoaContent.optionB, 
          onClick: () => { 
            this.handleCyoaChoice(cyoaData, 'B', cyoaContent.followB);
          } 
        }
      ]
    };

    this.createDialog(menuConfig, 'CYOA');
  }

  /**
   * Show story menu
   */
  showStoryMenu(storyData: { isExitRelated: boolean, exitNumber?: number }): void {
    if (!this.canShowMenu('STORY')) return;

    this.clearCurrentDialog();
    this.pushMenu('STORY');
    this.menuState.setCurrentDisplayedMenuType('STORY');

    // Pause game while story is open
    try {
      const appScene = this.scene.scene.get('AppScene');
      const gameScene = this.scene.scene.get('GameScene');
      if (appScene) { (appScene as any).isPaused = true; }
      if (gameScene) { (gameScene as any).events.emit('gamePaused'); }
    } catch {}

    // Get story content
    const storyContent = this.getStoryContent(storyData);
    
    const menuConfig: MenuConfig = {
      title: 'STORY',
      content: storyContent,
      buttons: [
        { 
          text: 'Continue', 
          onClick: () => { 
            this.closeDialog();
          } 
        }
      ]
    };

    this.createDialog(menuConfig, 'STORY');
  }

  /**
   * Show novel story menu (long-form story)
   */
  showNovelStoryMenu(storyData: { isExitRelated: boolean, exitNumber?: number }): void {
    if (!this.canShowMenu('NOVEL_STORY')) return;

    this.clearCurrentDialog();
    this.pushMenu('NOVEL_STORY');
    this.menuState.setCurrentDisplayedMenuType('NOVEL_STORY');

    // Pause game while novel story is open
    try {
      const appScene = this.scene.scene.get('AppScene');
      const gameScene = this.scene.scene.get('GameScene');
      if (appScene) { (appScene as any).isPaused = true; }
      if (gameScene) { (gameScene as any).events.emit('gamePaused'); }
    } catch {}

    // Get novel story content
    const novelContent = this.getNovelStoryContent(storyData);
    
    const menuConfig: MenuConfig = {
      title: 'NOVEL',
      content: novelContent,
      buttons: [
        { 
          text: 'Continue', 
          onClick: () => { 
            this.closeDialog();
          } 
        }
      ]
    };

    this.createDialog(menuConfig, 'NOVEL_STORY');
  }

  /**
   * Handle CYOA choice
   */
  private handleCyoaChoice(
    cyoaData: { cyoaId: number, isExitRelated: boolean, exitNumber?: number, exitTiming?: 'before' | 'after' },
    choice: 'A' | 'B',
    followText: string
  ): void {
    console.log(`CYOA choice ${choice} selected for ID ${cyoaData.cyoaId}`);
    
    // Handle the choice logic
    if (cyoaData.isExitRelated && cyoaData.exitTiming === 'after') {
      // Queue exit menu after CYOA
      this.menuQueue.enqueue('EXIT', { exitNumber: cyoaData.exitNumber });
    }
    
    // Show follow-up text if available
    if (followText) {
      this.menuQueue.enqueue('STORY_OVERLAY', { title: 'Story', content: followText });
    }
    
    this.closeDialog();
  }

  /**
   * Get CYOA content based on ID
   */
  private getCyoaContent(cyoaId: number): { text: string, optionA: string, optionB: string, followA: string, followB: string } {
    // This would typically come from a content file or database
    // For now, return placeholder content
    return {
      text: `CYOA content for ID ${cyoaId}`,
      optionA: 'Option A',
      optionB: 'Option B',
      followA: 'You chose option A...',
      followB: 'You chose option B...'
    };
  }

  /**
   * Get story content
   */
  private getStoryContent(storyData: { isExitRelated: boolean, exitNumber?: number }): string {
    // This would typically come from a content file or database
    // For now, return placeholder content
    return `Story content${storyData.isExitRelated ? ' (exit related)' : ''}`;
  }

  /**
   * Get novel story content
   */
  private getNovelStoryContent(storyData: { isExitRelated: boolean, exitNumber?: number }): string {
    // This would typically come from a content file or database
    // For now, return placeholder content
    return `Novel story content${storyData.isExitRelated ? ' (exit related)' : ''}`;
  }
}
