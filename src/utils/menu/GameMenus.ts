/**
 * GAME MENUS - Handles core game menus like START, PAUSE, SAVE, GAME_OVER
 * 
 * This module manages the essential game menus that control the game flow.
 * These are the menus that players interact with most frequently.
 */

import Phaser from 'phaser';
import { MenuConfig, MenuType } from './MenuTypes';
import { MenuState } from './MenuState';
import { MenuQueue } from './MenuQueue';
import { SaveManager } from '../SaveManager';

export class GameMenus {
  private scene: Phaser.Scene;
  private menuState: MenuState;
  private menuQueue: MenuQueue;
  private saveManager: SaveManager;
  private createDialog: (config: MenuConfig, menuType: MenuType) => void;
  private closeDialog: () => void;
  private clearCurrentDialog: () => void;
  private canShowMenu: (menuType: MenuType) => boolean;
  private pushMenu: (menuType: MenuType, config?: any) => void;
  private popMenu: () => {type: string, priority: number, config?: any} | null;
  private resumeGame: () => void;
  private pauseGame: () => void;

  constructor(
    scene: Phaser.Scene,
    menuState: MenuState,
    menuQueue: MenuQueue,
    saveManager: SaveManager,
    callbacks: {
      createDialog: (config: MenuConfig, menuType: MenuType) => void;
      closeDialog: () => void;
      clearCurrentDialog: () => void;
      canShowMenu: (menuType: MenuType) => boolean;
      pushMenu: (menuType: MenuType, config?: any) => void;
      popMenu: () => {type: string, priority: number, config?: any} | null;
      resumeGame: () => void;
      pauseGame: () => void;
    }
  ) {
    this.scene = scene;
    this.menuState = menuState;
    this.menuQueue = menuQueue;
    this.saveManager = saveManager;
    this.createDialog = callbacks.createDialog;
    this.closeDialog = callbacks.closeDialog;
    this.clearCurrentDialog = callbacks.clearCurrentDialog;
    this.canShowMenu = callbacks.canShowMenu;
    this.pushMenu = callbacks.pushMenu;
    this.popMenu = callbacks.popMenu;
    this.resumeGame = callbacks.resumeGame;
    this.pauseGame = callbacks.pauseGame;
  }

  /**
   * Show the start menu
   */
  showStartMenu(): void {
    if (!this.canShowMenu('START')) return;

    this.clearCurrentDialog();
    this.pushMenu('START');
    this.menuState.setCurrentDisplayedMenuType('START');

    const menuConfig: MenuConfig = {
      title: 'START',
      content: 'Welcome to the game!',
      buttons: [
        { 
          text: 'Start Game', 
          onClick: () => { 
            this.closeDialog();
            this.resumeGame();
          } 
        }
      ]
    };

    this.createDialog(menuConfig, 'START');
  }

  /**
   * Show the pause menu
   */
  showPauseMenu(): void {
    if (!this.canShowMenu('PAUSE')) return;

    this.pauseGame();
    this.clearCurrentDialog();
    this.pushMenu('PAUSE');
    this.menuState.setCurrentDisplayedMenuType('PAUSE');

    const menuConfig: MenuConfig = {
      title: 'PAUSE',
      content: 'Game Paused',
      buttons: [
        { 
          text: 'Resume', 
          onClick: () => { 
            this.closeDialog();
            this.resumeGame();
          } 
        },
        { 
          text: 'Save Game', 
          onClick: () => { 
            this.closeDialog();
            this.showSaveMenu();
          } 
        },
        { 
          text: 'Main Menu', 
          onClick: () => { 
            this.closeDialog();
            // Handle main menu navigation
          } 
        }
      ]
    };

    this.createDialog(menuConfig, 'PAUSE');
  }

  /**
   * Show the save menu
   */
  showSaveMenu(): void {
    if (!this.canShowMenu('SAVE')) return;

    this.clearCurrentDialog();
    this.pushMenu('SAVE');
    this.menuState.setCurrentDisplayedMenuType('SAVE');

    const menuConfig: MenuConfig = {
      title: 'SAVE GAME',
      content: 'Choose a save slot:',
      buttons: [
        { 
          text: 'Save Slot 1', 
          onClick: () => { 
            this.saveGame(1);
            this.closeDialog();
          } 
        },
        { 
          text: 'Save Slot 2', 
          onClick: () => { 
            this.saveGame(2);
            this.closeDialog();
          } 
        },
        { 
          text: 'Save Slot 3', 
          onClick: () => { 
            this.saveGame(3);
            this.closeDialog();
          } 
        },
        { 
          text: 'Cancel', 
          onClick: () => { 
            this.closeDialog();
          } 
        }
      ]
    };

    this.createDialog(menuConfig, 'SAVE');
  }

  /**
   * Show the game over menu
   */
  showGameOverMenu(): void {
    if (!this.canShowMenu('GAME_OVER')) return;

    this.clearCurrentDialog();
    this.pushMenu('GAME_OVER');
    this.menuState.setCurrentDisplayedMenuType('GAME_OVER');

    const menuConfig: MenuConfig = {
      title: 'GAME OVER',
      content: 'Your journey has ended.',
      buttons: [
        { 
          text: 'Restart', 
          onClick: () => { 
            this.closeDialog();
            this.restartGame();
          } 
        },
        { 
          text: 'Main Menu', 
          onClick: () => { 
            this.closeDialog();
            this.goToMainMenu();
          } 
        }
      ]
    };

    this.createDialog(menuConfig, 'GAME_OVER');
  }

  /**
   * Show the turn key menu (ignition)
   */
  showTurnKeyMenu(): void {
    if (!this.canShowMenu('TURN_KEY')) return;

    this.clearCurrentDialog();
    this.pushMenu('TURN_KEY');
    this.menuState.setCurrentDisplayedMenuType('TURN_KEY');

    const menuConfig: MenuConfig = {
      title: 'TURN KEY',
      content: 'Turn the key to start the engine.',
      buttons: [
        { 
          text: 'Turn Key', 
          onClick: () => { 
            this.closeDialog();
            this.startEngine();
          } 
        }
      ]
    };

    this.createDialog(menuConfig, 'TURN_KEY');
  }

  /**
   * Save game to a specific slot
   */
  private saveGame(slot: number): void {
    try {
      this.saveManager.saveGame(slot);
      console.log(`Game saved to slot ${slot}`);
    } catch (error) {
      console.error('Failed to save game:', error);
    }
  }

  /**
   * Restart the game
   */
  private restartGame(): void {
    try {
      // Reset game state and restart
      this.scene.scene.restart();
    } catch (error) {
      console.error('Failed to restart game:', error);
    }
  }

  /**
   * Go to main menu
   */
  private goToMainMenu(): void {
    try {
      // Navigate to main menu scene
      this.scene.scene.start('MenuScene');
    } catch (error) {
      console.error('Failed to go to main menu:', error);
    }
  }

  /**
   * Start the engine
   */
  private startEngine(): void {
    try {
      // Emit ignition event
      this.scene.events.emit('ignitionMenuHidden');
      
      // Resume game
      this.resumeGame();
      
      console.log('Engine started');
    } catch (error) {
      console.error('Failed to start engine:', error);
    }
  }
}
