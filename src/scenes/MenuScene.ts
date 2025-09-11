/**
 * MENU SCENE - MENU SYSTEM COORDINATOR
 * 
 * This scene acts as a bridge between the game logic and the menu system.
 * It doesn't create menus directly, but instead listens for events from other
 * scenes and delegates menu creation to the MenuManager utility class.
 * 
 * Key Responsibilities:
 * - Event listening for menu requests from other scenes
 * - Delegating menu creation to MenuManager
 * - Overlay camera setup for consistent menu rendering
 * - Scene communication for menu state management
 * 
 * The MenuScene runs continuously and provides a stable interface for
 * other scenes to request menu displays without tight coupling.
 */

import Phaser from 'phaser';
import { MenuManager } from '../utils/MenuManager';

export class MenuScene extends Phaser.Scene {
  private menuManager!: MenuManager;

  constructor() {
    super({ key: 'MenuScene' });
  }

  async create() {
    console.log('MenuScene create() called'); // Debug log
    
    // Set up overlay camera for this scene
    this.setupOverlayCamera();
    
    // Initialize menu manager
    this.menuManager = new MenuManager(this);
    
    // Listen for different menu events
    this.events.on('showObstacleMenu', this.showObstacleMenu, this);
    this.events.on('showPauseMenu', this.showPauseMenu, this);
    this.events.on('showSaveMenu', this.showSaveMenu, this);
    this.events.on('showGameOverMenu', this.showGameOverMenu, this);
    this.events.on('showStartMenu', this.showStartMenu, this);
    this.events.on('showTurnKeyMenu', this.showTurnKeyMenu, this);
    this.events.on('closeCurrentMenu', this.closeCurrentMenu, this);
    
    // Don't create any default menu - wait for events
    console.log('MenuScene ready - waiting for menu events');
  }

  private setupOverlayCamera() {
    // Create overlay camera for this scene
    const overlayCamera = this.cameras.add(0, 0, this.cameras.main.width, this.cameras.main.height);
    overlayCamera.setName('menuOverlayCamera');
    overlayCamera.setScroll(0, 0);
    // Don't set background color - keep it transparent
    
    // Set this scene to use the overlay camera
    this.cameras.main = overlayCamera;
    
    console.log('MenuScene: Overlay camera set up');
  }

  private showStartMenu() {
    console.log('MenuScene: showStartMenu called');
    this.menuManager.showStartMenu();
  }

  private showPauseMenu() {
    console.log('MenuScene: showPauseMenu called - received event!');
    this.menuManager.showPauseMenu();
  }

  private showSaveMenu() {
    console.log('MenuScene: showSaveMenu called - received event!');
    this.menuManager.showSaveMenu();
  }

  private showGameOverMenu() {
    this.menuManager.showGameOverMenu();
  }

  private showObstacleMenu(obstacleType: string) {
    if (obstacleType === 'pothole') {
      this.menuManager.showPotholeMenu();
    } else if (obstacleType === 'exit') {
      this.menuManager.showExitMenu();
    }
  }

  private showTurnKeyMenu() {
    this.menuManager.showTurnKeyMenu();
  }

  private closeCurrentMenu() {
    console.log('MenuScene: Received closeCurrentMenu event');
    this.menuManager.closeCurrentDialog();
  }
}