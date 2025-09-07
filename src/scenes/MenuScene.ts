import Phaser from 'phaser';
import { SaveManager } from '../utils/SaveManager';

export class MenuScene extends Phaser.Scene {
  private saveManager!: SaveManager;
  private currentMenuElements: any = null;

  constructor() {
    super({ key: 'MenuScene' });
  }

  create() {
    console.log('MenuScene create() called'); // Debug log
    
    // Set up overlay camera for this scene
    this.setupOverlayCamera();
    
    // Initialize save manager
    this.saveManager = SaveManager.getInstance();
    
    // Listen for different menu events
    this.events.on('showObstacleMenu', this.showObstacleMenu, this);
    this.events.on('showPauseMenu', this.showPauseMenu, this);
    this.events.on('showSaveMenu', this.showSaveMenu, this);
    this.events.on('showGameOverMenu', this.showGameOverMenu, this);
    this.events.on('showStartMenu', this.showStartMenu, this);
    
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

  private clearCurrentMenu() {
    if (this.currentMenuElements) {
      Object.values(this.currentMenuElements).forEach((element: any) => {
        if (element && element.destroy) {
          element.destroy();
        }
      });
      this.currentMenuElements = null;
    }
  }

  private showStartMenu() {
    console.log('MenuScene: showStartMenu called');
    this.clearCurrentMenu();
    
    const gameWidth = this.cameras.main.width;
    const gameHeight = this.cameras.main.height;
    const centerX = gameWidth / 2;
    const centerY = gameHeight / 2;

    // Add 80% transparent black background
    const background = this.add.rectangle(centerX, centerY, gameWidth, gameHeight, 0x000000, 0.8);
    background.setScrollFactor(0);
    background.setDepth(20000);

    // Add menu layer text
    const menuLayerText = this.add.text(10, 130, 'MENU LAYER', {
      fontSize: '16px',
      color: '#ff00ff',
      fontStyle: 'bold',
      backgroundColor: '#000000',
      padding: { x: 8, y: 4 }
    });
    menuLayerText.setScrollFactor(0);
    menuLayerText.setDepth(20001);

    // Add title text
    const titleText = this.add.text(centerX, centerY - 50, 'START GAME', {
      fontSize: '32px',
      color: '#ffffff',
      fontStyle: 'bold'
    });
    titleText.setOrigin(0.5);
    titleText.setScrollFactor(0);
    titleText.setDepth(20001);

    // Add start button
    const startButton = this.add.text(centerX, centerY + 50, 'Start Game', {
      fontSize: '24px',
      color: '#ffffff',
      backgroundColor: '#27ae60',
      padding: { x: 15, y: 8 }
    });
    startButton.setOrigin(0.5);
    startButton.setScrollFactor(0);
    startButton.setDepth(20001);
    startButton.setInteractive();
    startButton.on('pointerdown', () => {
      console.log('Start Game clicked!');
      
      // Start the game by calling AppScene's startGame method
      const appScene = this.scene.get('AppScene');
      if (appScene) {
        (appScene as any).startGame();
      }
      
      this.clearCurrentMenu();
      this.scene.sleep('MenuScene');
    });

    this.currentMenuElements = {
      background,
      menuLayerText,
      titleText,
      startButton
    };
  }

  private showPauseMenu() {
    console.log('MenuScene: showPauseMenu called');
    this.clearCurrentMenu();
    
    const gameWidth = this.cameras.main.width;
    const gameHeight = this.cameras.main.height;
    const centerX = gameWidth / 2;
    const centerY = gameHeight / 2;

    // Add 80% transparent black background
    const background = this.add.rectangle(centerX, centerY, gameWidth, gameHeight, 0x000000, 0.8);
    background.setScrollFactor(0);
    background.setDepth(20000);

    // Add pause menu layer text
    const pauseLayerText = this.add.text(10, 160, 'PAUSE MENU LAYER', {
      fontSize: '16px',
      color: '#ff00ff',
      fontStyle: 'bold',
      backgroundColor: '#000000',
      padding: { x: 8, y: 4 }
    });
    pauseLayerText.setScrollFactor(0);
    pauseLayerText.setDepth(20001);

    // Add title text
    const titleText = this.add.text(centerX, centerY - 60, 'PAUSED', {
      fontSize: '24px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    titleText.setScrollFactor(0);
    titleText.setDepth(20001);

    // Add resume button
    const resumeButton = this.add.text(centerX, centerY + 20, 'Resume', {
      fontSize: '18px',
      color: '#ffffff',
      backgroundColor: '#008800',
      padding: { x: 15, y: 8 }
    }).setOrigin(0.5);
    resumeButton.setScrollFactor(0);
    resumeButton.setDepth(20001);
    resumeButton.setInteractive();
    resumeButton.on('pointerdown', () => {
      console.log('Resume clicked!');
      
      // Resume the game by calling AppScene's togglePauseMenu method
      const appScene = this.scene.get('AppScene');
      if (appScene) {
        (appScene as any).togglePauseMenu();
      }
      
      this.clearCurrentMenu();
      this.scene.sleep('MenuScene');
    });

    this.currentMenuElements = {
      background,
      pauseLayerText,
      titleText,
      resumeButton
    };
  }

  private showSaveMenu() {
    console.log('MenuScene: showSaveMenu called');
    this.clearCurrentMenu();
    
    const gameWidth = this.cameras.main.width;
    const gameHeight = this.cameras.main.height;
    const centerX = gameWidth / 2;
    const centerY = gameHeight / 2;

    // Add 80% transparent black background
    const background = this.add.rectangle(centerX, centerY, gameWidth, gameHeight, 0x000000, 0.8);
    background.setScrollFactor(0);
    background.setDepth(20000);

    // Add save menu layer text
    const saveLayerText = this.add.text(10, 190, 'SAVE MENU LAYER', {
      fontSize: '16px',
      color: '#ff00ff',
      fontStyle: 'bold',
      backgroundColor: '#000000',
      padding: { x: 8, y: 4 }
    });
    saveLayerText.setScrollFactor(0);
    saveLayerText.setDepth(20001);

    // Add title text
    const titleText = this.add.text(centerX, centerY - 100, 'SAVE MENU', {
      fontSize: '28px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    titleText.setScrollFactor(0);
    titleText.setDepth(20001);

    // Show current save info
    const saveInfo = this.saveManager.getSaveInfo();
    let infoText = 'No save data found';
    if (saveInfo.exists) {
      const saveDate = new Date(saveInfo.timestamp!).toLocaleString();
      infoText = `Last save: ${saveDate}\nSteps: ${saveInfo.steps}`;
    }
    
    const infoDisplay = this.add.text(centerX, centerY - 40, infoText, {
      fontSize: '16px',
      color: '#cccccc',
      align: 'center'
    }).setOrigin(0.5);
    infoDisplay.setScrollFactor(0);
    infoDisplay.setDepth(20001);

    // Add save button
    const saveButton = this.add.text(centerX, centerY + 20, 'Save Game', {
      fontSize: '20px',
      color: '#ffffff',
      backgroundColor: '#27ae60',
      padding: { x: 15, y: 8 }
    }).setOrigin(0.5);
    saveButton.setScrollFactor(0);
    saveButton.setDepth(20001);
    saveButton.setInteractive();

    // Add load button
    const loadButton = this.add.text(centerX, centerY + 60, 'Load Game', {
      fontSize: '20px',
      color: '#ffffff',
      backgroundColor: '#3498db',
      padding: { x: 15, y: 8 }
    }).setOrigin(0.5);
    loadButton.setScrollFactor(0);
    loadButton.setDepth(20001);
    loadButton.setInteractive();

    // Add clear save button
    const clearButton = this.add.text(centerX, centerY + 100, 'Clear Save', {
      fontSize: '20px',
      color: '#ffffff',
      backgroundColor: '#e74c3c',
      padding: { x: 15, y: 8 }
    }).setOrigin(0.5);
    clearButton.setScrollFactor(0);
    clearButton.setDepth(20001);
    clearButton.setInteractive();

    // Add close button
    const closeButton = this.add.text(centerX, centerY + 140, 'Close', {
      fontSize: '18px',
      color: '#ffffff',
      backgroundColor: '#7f8c8d',
      padding: { x: 15, y: 8 }
    }).setOrigin(0.5);
    closeButton.setScrollFactor(0);
    closeButton.setDepth(20001);
    closeButton.setInteractive();

    // Add click handlers
    saveButton.on('pointerdown', () => {
      this.saveGame();
      this.clearCurrentMenu();
      this.scene.sleep('MenuScene');
    });
    
    loadButton.on('pointerdown', () => {
      this.loadGame();
      this.clearCurrentMenu();
      this.scene.sleep('MenuScene');
    });
    
    clearButton.on('pointerdown', () => {
      this.clearSave();
      this.clearCurrentMenu();
      this.scene.sleep('MenuScene');
    });
    
    closeButton.on('pointerdown', () => {
      this.clearCurrentMenu();
      this.scene.sleep('MenuScene');
    });

    this.currentMenuElements = {
      background,
      saveLayerText,
      titleText,
      infoDisplay,
      saveButton,
      loadButton,
      clearButton,
      closeButton
    };
  }

  private showGameOverMenu() {
    this.clearCurrentMenu();
    
    const gameWidth = this.cameras.main.width;
    const gameHeight = this.cameras.main.height;
    const centerX = gameWidth / 2;
    const centerY = gameHeight / 2;

    // Add 80% transparent black background
    const background = this.add.rectangle(centerX, centerY, gameWidth, gameHeight, 0x000000, 0.8);
    background.setScrollFactor(0);
    background.setDepth(20000);

    // Add game over layer text
    const gameOverLayerText = this.add.text(10, 190, 'GAME OVER LAYER', {
      fontSize: '16px',
      color: '#ff00ff',
      fontStyle: 'bold',
      backgroundColor: '#000000',
      padding: { x: 8, y: 4 }
    });
    gameOverLayerText.setScrollFactor(0);
    gameOverLayerText.setDepth(20001);

    // Add "You Lost!" text
    const gameOverText = this.add.text(centerX, centerY - 40, 'YOU LOST!', {
      fontSize: '32px',
      color: '#ff0000',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    gameOverText.setScrollFactor(0);
    gameOverText.setDepth(20001);

    // Add countdown text
    const countdownText = this.add.text(centerX, centerY, 'Time ran out!', {
      fontSize: '18px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    countdownText.setScrollFactor(0);
    countdownText.setDepth(20001);

    // Add restart button
    const restartButton = this.add.text(centerX, centerY + 40, 'Restart Game', {
      fontSize: '20px',
      color: '#ffffff',
      backgroundColor: '#27ae60',
      padding: { x: 15, y: 8 }
    }).setOrigin(0.5);
    restartButton.setScrollFactor(0);
    restartButton.setDepth(20001);
    restartButton.setInteractive();
    restartButton.on('pointerdown', () => {
      console.log('Restarting game via page reload...');
      window.location.reload();
    });

    this.currentMenuElements = {
      background,
      gameOverLayerText,
      gameOverText,
      countdownText,
      restartButton
    };
  }

  private showObstacleMenu(obstacleType: string) {
    this.clearCurrentMenu();
    
    const gameWidth = this.cameras.main.width;
    const gameHeight = this.cameras.main.height;
    const centerX = gameWidth / 2;
    const centerY = gameHeight / 2;

    // Add 80% transparent black background
    const background = this.add.rectangle(centerX, centerY, gameWidth, gameHeight, 0x000000, 0.8);
    background.setScrollFactor(0);
    background.setDepth(20000);

    // Add obstacle menu layer text
    const obstacleLayerText = this.add.text(10, 190, 'OBSTACLE MENU LAYER', {
      fontSize: '16px',
      color: '#ff00ff',
      fontStyle: 'bold',
      backgroundColor: '#000000',
      padding: { x: 8, y: 4 }
    });
    obstacleLayerText.setScrollFactor(0);
    obstacleLayerText.setDepth(20001);

    // Create obstacle-specific dialog
    let titleText = '';
    let messageText = '';
    
    if (obstacleType === 'pothole') {
      titleText = 'POTHOLE HIT!';
      messageText = 'You hit a pothole!\n\nYour car took damage.\nHealth decreased.\n\nBe more careful next time!';
    } else if (obstacleType === 'exit') {
      titleText = 'EXIT REACHED!';
      messageText = 'You found an exit!\n\nGood job!\nYou earned rewards.\n\nKeep up the good driving!';
    }

    // Add title text
    const titleTextObj = this.add.text(centerX, centerY - 60, titleText, {
      fontSize: '24px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    titleTextObj.setScrollFactor(0);
    titleTextObj.setDepth(20001);

    // Add message text
    const messageTextObj = this.add.text(centerX, centerY, messageText, {
      fontSize: '16px',
      color: '#ffffff',
      align: 'center'
    }).setOrigin(0.5);
    messageTextObj.setScrollFactor(0);
    messageTextObj.setDepth(20001);

    // Add continue button
    const continueButton = this.add.text(centerX, centerY + 80, 'Continue', {
      fontSize: '20px',
      color: '#ffffff',
      backgroundColor: '#27ae60',
      padding: { x: 15, y: 8 }
    }).setOrigin(0.5);
    continueButton.setScrollFactor(0);
    continueButton.setDepth(20001);
    continueButton.setInteractive();
    continueButton.on('pointerdown', () => {
      console.log('Continue clicked!');
      
      // Resume driving by calling GameScene's resumeDriving method
      const gameScene = this.scene.get('GameScene');
      if (gameScene) {
        (gameScene as any).resumeDriving();
      }
      
      this.clearCurrentMenu();
      this.scene.sleep('MenuScene');
    });

    this.currentMenuElements = {
      background,
      obstacleLayerText,
      titleTextObj,
      messageTextObj,
      continueButton
    };
  }

  private saveGame() {
    // Get current steps from AppScene
    const appScene = this.scene.get('AppScene') as any;
    const currentSteps = appScene ? appScene.getStep() : 0;
    
    const success = this.saveManager.save(currentSteps);
    if (success) {
      console.log(`Game saved successfully with ${currentSteps} steps`);
    } else {
      console.error('Failed to save game');
    }
  }

  private loadGame() {
    const saveData = this.saveManager.load();
    if (saveData) {
      // Restore steps to AppScene
      const appScene = this.scene.get('AppScene') as any;
      if (appScene && appScene.setStep) {
        appScene.setStep(saveData.steps);
      }
      
      console.log(`Game loaded successfully with ${saveData.steps} steps`);
    } else {
      console.log('No save data to load');
    }
  }

  private clearSave() {
    const success = this.saveManager.clearSave();
    if (success) {
      console.log('Save data cleared successfully');
    } else {
      console.error('Failed to clear save data');
    }
  }
}