/**
 * DESTINATION MENUS - Handles destination selection and related menu flows
 * 
 * This module manages all destination-related menus including the main destination
 * selection, destination info display, and show menu. It provides a clean interface
 * for the destination sequence flow.
 */

import Phaser from 'phaser';
import { MenuConfig, MenuType } from './MenuTypes';
import { MenuState } from './MenuState';
import { MenuQueue } from './MenuQueue';

export class DestinationMenus {
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
   * Show the main destination selection menu
   */
  showDestinationMenu(includeFinalShowStep: boolean = false): void {
    // Defer if we're in the middle of dialog transitions
    if ((this as any).__dialogTransitioning) {
      this.menuQueue.enqueue('DESTINATION', { includeFinalShowStep });
      return;
    }

    // Cooldown after narrative/CYOA closes to avoid same-frame overlap
    const now = this.scene.time.now || Date.now();
    if (this.menuState.getLastClosedMenuType() && 
        ['CYOA', 'STORY', 'NOVEL_STORY'].includes(this.menuState.getLastClosedMenuType()!)) {
      if (now - this.menuState.getLastMenuCloseTime() < 150) {
        this.menuQueue.enqueue('DESTINATION', { includeFinalShowStep });
        return;
      }
    }

    // If EXIT/SHOP is open, queue with payload and bail
    if (this.menuState.isExitOrShopOpen()) { 
      this.menuQueue.enqueue('DESTINATION', { includeFinalShowStep }); 
      return; 
    }
    
    // Queue if SAVE is open - let user finish saving/loading
    if (this.menuState.getCurrentDisplayedMenuType() === 'SAVE') {
      console.log('⏳ Queueing DESTINATION until SAVE closes');
      this.menuQueue.enqueue('DESTINATION', { includeFinalShowStep });
      return;
    }
    
    // Queue if CYOA is open - let user finish their choice
    if (this.menuState.getCurrentDisplayedMenuType() === 'CYOA') {
      console.log('⏳ Queueing DESTINATION until CYOA closes');
      this.menuQueue.enqueue('DESTINATION', { includeFinalShowStep });
      return;
    }
    
    // Queue if VIRTUAL_PET is open - let user finish interacting with their pet
    if (this.menuState.getCurrentDisplayedMenuType() === 'VIRTUAL_PET') {
      console.log('⏳ Queueing DESTINATION until VIRTUAL_PET closes');
      this.menuQueue.enqueue('DESTINATION', { includeFinalShowStep });
      return;
    }
    
    // Special handling for STORY_OUTCOME - clear it if it's lingering
    if (this.menuState.getCurrentDisplayedMenuType() === 'STORY_OUTCOME') {
      console.log('🧹 Clearing lingering STORY_OUTCOME from stack to allow DESTINATION');
      this.clearCurrentDialog();
      this.menuState.setCurrentDisplayedMenuType(null);
    }
    
    // Queue if STORY is open - let user finish reading the story
    if (['STORY', 'NOVEL_STORY'].includes(this.menuState.getCurrentDisplayedMenuType() || '')) {
      console.log('⏳ Queueing DESTINATION until STORY closes');
      this.menuQueue.enqueue('DESTINATION', { includeFinalShowStep });
      return;
    }
    
    // Queue if another DESTINATION is open - let user finish their current destination choice
    if (this.menuState.getCurrentDisplayedMenuType() === 'DESTINATION') {
      console.log('⏳ Queueing DESTINATION until current DESTINATION closes');
      this.menuQueue.enqueue('DESTINATION', { includeFinalShowStep });
      return;
    }
    
    if (!this.canShowMenu('DESTINATION')) return;

    // Pause game and driving while destination menu is open
    try {
      const appScene = this.scene.scene.get('AppScene');
      const gameScene = this.scene.scene.get('GameScene');
      if (appScene) { (appScene as any).isPaused = true; }
      if (gameScene) { (gameScene as any).events.emit('gamePaused'); }
    } catch {}

    this.clearCurrentDialog();
    this.pushMenu('DESTINATION');
    this.menuState.setCurrentDisplayedMenuType('DESTINATION');
    
    const menuConfig: MenuConfig = {
      title: 'DESTINATION',
      content: 'Choose a destination.',
      buttons: [
        { 
          text: 'Gas Station', 
          onClick: () => { 
            if (this.menuState.isDestinationTransitioning()) return; 
            this.startDestinationFlow('gas station'); 
          } 
        },
        { 
          text: 'Motel', 
          onClick: () => { 
            if (this.menuState.isDestinationTransitioning()) return; 
            this.startDestinationFlow('motel'); 
          } 
        },
        { 
          text: 'Restaurant', 
          onClick: () => { 
            if (this.menuState.isDestinationTransitioning()) return; 
            this.startDestinationFlow('restaurant'); 
          } 
        }
      ]
    };
    
    this.createDialog(menuConfig, 'DESTINATION');
  }

  /**
   * Start the destination flow sequence
   */
  private startDestinationFlow(name: string): void {
    // Complete sequence: destination → destination info → show → story overlay → ignition
    this.menuQueue.enqueue('DESTINATION_INFO', { name });
    this.menuQueue.enqueue('SHOW');
    this.menuQueue.enqueue('STORY_OVERLAY', { title: 'the next day', content: '' });
    this.menuQueue.enqueue('TURN_KEY');
    this.closeDialog();
  }

  /**
   * Show destination info menu
   */
  showDestinationInfoMenu(name: string): void {
    if (!this.canShowMenu('DESTINATION_INFO')) return;
    
    this.clearCurrentDialog();
    this.pushMenu('DESTINATION_INFO', { name });
    this.menuState.setCurrentDisplayedMenuType('DESTINATION_INFO');
    
    const title = `you went to the ${name}`;
    const menuConfig: MenuConfig = {
      title,
      content: `You arrived at the ${name}. The band is ready to perform.`,
      buttons: [
        { text: 'Continue', onClick: () => { this.closeDialog(); } }
      ]
    };
    
    this.createDialog(menuConfig, 'DESTINATION_INFO');
  }

  /**
   * Show the simple show menu
   */
  showShowMenu(): void {
    if (!this.canShowMenu('SHOW')) return;
    
    this.clearCurrentDialog();
    this.pushMenu('SHOW');
    this.menuState.setCurrentDisplayedMenuType('SHOW');
    
    const menuConfig: MenuConfig = {
      title: 'SHOW',
      content: 'The band performs an amazing show! The crowd loves it. After the performance, it\'s time to head back to the van.',
      buttons: [
        { text: 'Continue', onClick: () => { this.closeDialog(); } }
      ]
    };
    
    this.createDialog(menuConfig, 'SHOW');
  }
}
