import Phaser from 'phaser';
import { SaveManager } from '../utils/SaveManager';
import { MenuBuilder, MenuConfig } from '../utils/MenuBuilder';
import { ConfigLoader, GameConfig } from '../config/ConfigLoader';

export class MenuScene extends Phaser.Scene {
  private saveManager!: SaveManager;
  private menuBuilder!: MenuBuilder;
  private config!: GameConfig;

  constructor() {
    super({ key: 'MenuScene' });
  }

  async create() {
    console.log('MenuScene create() called'); // Debug log
    
    // Load configuration
    const configLoader = ConfigLoader.getInstance();
    this.config = await configLoader.loadConfig(this);
    
    // Set up overlay camera for this scene
    this.setupOverlayCamera();
    
    // Initialize save manager
    this.saveManager = SaveManager.getInstance();
    
    // Initialize menu builder
    this.menuBuilder = new MenuBuilder(this, this.config);
    
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
    if (this.menuBuilder) {
      this.menuBuilder.clearElements();
    }
  }

  private showStartMenu() {
    console.log('MenuScene: showStartMenu called');
    this.clearCurrentMenu();
    
    const menuConfig: MenuConfig = {
      layerText: 'MENU LAYER',
      title: 'START GAME',
      buttons: [
        {
          text: 'Start Game',
          onClick: () => {
            console.log('Start Game clicked!');
            
            // Start the game by calling AppScene's startGame method
            const appScene = this.scene.get('AppScene');
            if (appScene) {
              (appScene as any).startGame();
            }
            
            this.clearCurrentMenu();
            // Don't sleep MenuScene - keep it active but empty
            // this.scene.sleep('MenuScene');
          },
          style: {
            ...this.config.menus.styles.button,
            backgroundColor: '#27ae60'
          }
        }
      ]
    };

    this.menuBuilder.createMenu(menuConfig);
  }

  private showPauseMenu() {
    console.log('MenuScene: showPauseMenu called - received event!');
    this.clearCurrentMenu();
    
    // Create a simple test menu to see if it's visible
    const gameWidth = this.cameras.main.width;
    const gameHeight = this.cameras.main.height;
    const centerX = gameWidth / 2;
    const centerY = gameHeight / 2;

    // Create a bright test background
    const testBackground = this.add.rectangle(centerX, centerY, gameWidth, gameHeight, 0xff0000, 0.8);
    testBackground.setScrollFactor(0);
    testBackground.setDepth(60000); // Very high depth

    // Create test text
    const testText = this.add.text(centerX, centerY, 'PAUSE MENU TEST', {
      fontSize: '32px',
      color: '#ffffff',
      fontStyle: 'bold'
    });
    testText.setOrigin(0.5);
    testText.setScrollFactor(0);
    testText.setDepth(60001);

    // Create test button
    const testButton = this.add.text(centerX, centerY + 50, 'RESUME', {
      fontSize: '24px',
      color: '#ffffff',
      backgroundColor: '#008800',
      padding: { x: 15, y: 8 }
    });
    testButton.setOrigin(0.5);
    testButton.setScrollFactor(0);
    testButton.setDepth(60001);
    testButton.setInteractive();
    testButton.on('pointerdown', () => {
      console.log('Test Resume clicked!');
      testBackground.destroy();
      testText.destroy();
      testButton.destroy();
      
      // Resume the game
      const appScene = this.scene.get('AppScene');
      if (appScene) {
        (appScene as any).togglePauseMenu();
      }
    });

    console.log('Test pause menu created with bright red background');
  }

  private showSaveMenu() {
    console.log('MenuScene: showSaveMenu called - received event!');
    this.clearCurrentMenu();
    
    // Show current save info
    const saveInfo = this.saveManager.getSaveInfo();
    let infoText = 'No save data found';
    if (saveInfo.exists) {
      const saveDate = new Date(saveInfo.timestamp!).toLocaleString();
      infoText = `Last save: ${saveDate}\nSteps: ${saveInfo.steps}`;
    }
    
    const menuConfig: MenuConfig = {
      layerText: 'SAVE MENU LAYER',
      title: 'SAVE MENU',
      texts: [
        {
          text: infoText,
          y: this.cameras.main.height / 2 - 40,
          style: this.config.menus.styles.infoText
        }
      ],
      buttons: [
        {
          text: 'Save Game',
          onClick: () => {
            this.saveGame();
            this.clearCurrentMenu();
            // Don't sleep MenuScene - keep it active but empty
            // this.scene.sleep('MenuScene');
          },
          style: {
            ...this.config.menus.styles.button,
            backgroundColor: '#27ae60'
          }
        },
        {
          text: 'Load Game',
          onClick: () => {
            this.loadGame();
            this.clearCurrentMenu();
            // Don't sleep MenuScene - keep it active but empty
            // this.scene.sleep('MenuScene');
          },
          style: {
            ...this.config.menus.styles.button,
            backgroundColor: '#3498db'
          }
        },
        {
          text: 'Clear Save',
          onClick: () => {
            this.clearSave();
            this.clearCurrentMenu();
            // Don't sleep MenuScene - keep it active but empty
            // this.scene.sleep('MenuScene');
          },
          style: {
            ...this.config.menus.styles.button,
            backgroundColor: '#e74c3c'
          }
        },
        {
          text: 'Close',
          onClick: () => {
            this.clearCurrentMenu();
            // Don't sleep MenuScene - keep it active but empty
            // this.scene.sleep('MenuScene');
          },
          style: {
            ...this.config.menus.styles.button,
            backgroundColor: '#7f8c8d'
          }
        }
      ]
    };

    this.menuBuilder.createMenu(menuConfig);
  }

  private showGameOverMenu() {
    this.clearCurrentMenu();
    
    const menuConfig: MenuConfig = {
      layerText: 'GAME OVER LAYER',
      texts: [
        {
          text: 'YOU LOST!',
          y: this.cameras.main.height / 2 - 40,
          style: {
            ...this.config.menus.styles.title,
            fontSize: '32px',
            color: '#ff0000'
          }
        },
        {
          text: 'Time ran out!',
          y: this.cameras.main.height / 2,
          style: {
            ...this.config.menus.styles.bodyText,
            fontSize: '18px',
            fontStyle: 'bold'
          }
        }
      ],
      buttons: [
        {
          text: 'Restart Game',
          onClick: () => {
            console.log('Restarting game via page reload...');
            window.location.reload();
          },
          style: {
            ...this.config.menus.styles.button,
            backgroundColor: '#27ae60'
          }
        }
      ]
    };

    this.menuBuilder.createMenu(menuConfig);
  }

  private showObstacleMenu(obstacleType: string) {
    this.clearCurrentMenu();
    
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

    const menuConfig: MenuConfig = {
      layerText: 'OBSTACLE MENU LAYER',
      title: titleText,
      texts: [
        {
          text: messageText,
          y: this.cameras.main.height / 2,
          style: this.config.menus.styles.bodyText
        }
      ],
      buttons: [
        {
          text: 'Continue',
          onClick: () => {
            console.log('Continue clicked!');
            
            // Resume driving by calling GameScene's resumeDriving method
            const gameScene = this.scene.get('GameScene');
            if (gameScene) {
              (gameScene as any).resumeDriving();
            }
            
            this.clearCurrentMenu();
            // Don't sleep MenuScene - keep it active but empty
            // this.scene.sleep('MenuScene');
          },
          style: {
            ...this.config.menus.styles.button,
            backgroundColor: '#27ae60'
          }
        }
      ]
    };

    this.menuBuilder.createMenu(menuConfig);
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