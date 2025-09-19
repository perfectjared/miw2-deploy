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
    this.events.on('showTutorialInterrupt', this.showTutorialInterrupt, this);
    this.events.on('showDestinationMenu', this.showDestinationMenu, this);
    this.events.on('showRegionChoiceMenu', this.showRegionChoiceMenu, this);
    // this.events.on('showCYOA', this.showCYOA, this); // REMOVED: Old event listener causing double-triggering
    this.events.on('showCyoaMenu', this.showCyoaMenu, this);
    this.events.on('showStoryMenu', this.showStoryMenu, this);
    this.events.on('showVirtualPetMenu', this.showVirtualPetMenu, this);
    this.events.on('showMoralDecision', this.showMoralDecision, this);
    this.events.on('showPetStoryUI', this.showPetStoryUI, this);
    this.events.on('showStoryOverlay', (title: string, content: string) => {
      this.menuManager.showStoryOverlay(title, content);
    });
    this.events.on('closeCurrentMenu', this.closeCurrentMenu, this);
    
    // Don't create any default menu - wait for events
    console.log('MenuScene ready - waiting for menu events');

    // Forward step events from GameScene to MenuManager for ephemeral UIs
    try {
      const gameScene = this.scene.get('GameScene');
      gameScene?.events.on('step', () => {
        (this.menuManager as any)?.onGlobalStep?.();
      });
    } catch {}
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

  private showObstacleMenu(obstacleType: string, shopCount?: number, exitNumber?: number) {
    if (obstacleType === 'pothole') {
      this.menuManager.showPotholeMenu();
    } else if (obstacleType === 'exit') {
      this.menuManager.showExitMenu(shopCount || 3, exitNumber);
    }
  }

  private showTurnKeyMenu() {
    this.menuManager.showTurnKeyMenu();
  }

  private showTutorialInterrupt() {
    this.menuManager.showTutorialInterrupt();
  }

  private showDestinationMenu(includeFinalShowStep?: boolean) {
    this.menuManager.showDestinationMenu(!!includeFinalShowStep);
  }

  private showRegionChoiceMenu(config: { currentRegion: string; connectedRegions: string[] }) {
    this.menuManager.showRegionChoiceMenu(config);
  }

  private showCYOA(cfg?: { imageKey?: string; text?: string; optionA?: string; optionB?: string; followA?: string; followB?: string; }) {
    this.menuManager.showCYOAMenu(cfg);
  }

  private showCyoaMenu(cyoaData: { cyoaId: number, isExitRelated: boolean, exitNumber?: number }) {
    this.menuManager.showCyoaMenu(cyoaData);
  }

  private showStoryMenu(storyData: { isExitRelated: boolean, exitNumber?: number }) {
    this.menuManager.showStoryMenu(storyData);
  }

  private showVirtualPetMenu(petSprite?: Phaser.GameObjects.Ellipse) {
    console.log('MenuScene: showVirtualPetMenu called with petSprite:', petSprite);
    this.menuManager.showVirtualPetMenu(petSprite);
  }

  private showMoralDecision(cfg?: { petIndex?: number; text?: string; optionA?: string; optionB?: string; followA?: string; followB?: string; }) {
    console.log('MenuScene: showMoralDecision called with config:', cfg);
    this.menuManager.showMoralDecisionMenu(cfg);
  }

  private showPetStoryUI(arg: any) {
    // arg can be string (legacy) or { petIndex: number }
    if (typeof arg === 'string') {
      console.log('MenuScene: showPetStoryUI called (legacy) with content:', arg);
      this.menuManager.showPetStoryUI(arg);
      return;
    }
    const petIndex = (arg && typeof arg.petIndex === 'number') ? arg.petIndex : 0;
    console.log('MenuScene: showPetStoryUI called with petIndex:', petIndex);
    this.menuManager.showPetStoryUIForPet(petIndex);
  }

  private closeCurrentMenu() {
    console.log('MenuScene: Received closeCurrentMenu event');
    this.menuManager.closeCurrentDialog();
  }
}