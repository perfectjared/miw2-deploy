import Phaser from 'phaser';
import { SaveManager } from './SaveManager';
import { GameConfig } from '../config/ConfigLoader';

export interface MenuButton {
  text: string;
  onClick: () => void;
  style?: any;
}

export interface MenuConfig {
  title: string;
  content?: string;
  buttons: MenuButton[];
  width?: number;
  height?: number;
}

export class MenuManager {
  private scene: Phaser.Scene;
  private config: GameConfig;
  private saveManager: SaveManager;
  private currentDialog: any = null;

  constructor(scene: Phaser.Scene, config: GameConfig) {
    this.scene = scene;
    this.config = config;
    this.saveManager = SaveManager.getInstance();
  }

  public showStartMenu() {
    this.clearCurrentDialog();
    
    // Check if there's existing save data
    const saveData = this.saveManager.load();
    const hasExistingSave = saveData && saveData.steps > 0;
    
    let menuConfig: MenuConfig;
    
    if (hasExistingSave) {
      // Show resume menu for existing save
      const saveDate = new Date(saveData.timestamp).toLocaleString();
      menuConfig = {
        title: 'RESUME GAME',
        content: `Welcome back! You have a saved game with ${saveData.steps} steps.\nSaved: ${saveDate}`,
        buttons: [
          {
            text: 'Resume Game',
            onClick: () => {
              this.closeDialog();
              const appScene = this.scene.scene.get('AppScene');
              const gameScene = this.scene.scene.get('GameScene');
              if (appScene) {
                (appScene as any).startGame();
              }
              if (gameScene && saveData) {
                (gameScene as any).loadGame(saveData.steps);
              }
            },
            style: this.config.menuManager.buttonStyles.resume
          },
          {
            text: 'Start Fresh',
            onClick: () => {
              // Clear existing save and start fresh
              this.saveManager.clearSave();
              this.closeDialog();
              const appScene = this.scene.scene.get('AppScene');
              if (appScene) {
                (appScene as any).startGame();
              }
            },
            style: this.config.menuManager.buttonStyles.startFresh
          }
        ]
      };
    } else {
      // Show new game menu for first time
      menuConfig = {
        title: 'START GAME',
        content: 'Welcome to the game! Click Start to begin your adventure.',
        buttons: [
          {
            text: 'Start Game',
            onClick: () => {
              this.closeDialog();
              const appScene = this.scene.scene.get('AppScene');
              if (appScene) {
                (appScene as any).startGame();
              }
            },
            style: this.config.menuManager.buttonStyles.resume
          }
        ]
      };
    }

    this.createDialog(menuConfig);
  }

  public showPauseMenu() {
    this.clearCurrentDialog();
    
    const menuConfig: MenuConfig = {
      title: 'PAUSE MENU',
      content: 'Game is paused. Choose an option:',
      buttons: [
        {
          text: 'Resume',
          onClick: () => {
            this.closeDialog();
            const appScene = this.scene.scene.get('AppScene');
            if (appScene) {
              // Don't call togglePauseMenu() - just resume directly
              (appScene as any).isPaused = false;
              console.log('Game resumed from pause menu');
              
              // Emit resume event to GameScene
              const gameScene = this.scene.scene.get('GameScene');
              if (gameScene) {
                gameScene.events.emit('gameResumed');
              }
            }
          },
            style: this.config.menuManager.buttonStyles.startGame
        },
        {
          text: 'Restart',
          onClick: () => {
            this.closeDialog();
            window.location.reload();
          },
            style: this.config.menuManager.buttonStyles.restart
        }
      ]
    };

    this.createDialog(menuConfig);
  }

  public showSaveMenu() {
    this.clearCurrentDialog();
    
    const saveData = this.saveManager.load();
    const hasSaveData = saveData && saveData.steps > 0;
    
    const menuConfig: MenuConfig = {
      title: 'SAVE MENU',
      content: hasSaveData 
        ? `Current save: ${saveData.steps} steps (${saveData.timestamp})`
        : 'No save data found',
      buttons: [
        {
          text: 'Save Game',
          onClick: () => {
            const appScene = this.scene.scene.get('AppScene');
            if (appScene) {
              const steps = (appScene as any).getStep();
              this.saveManager.save(steps);
              this.closeDialog();
            }
          },
            style: this.config.menuManager.buttonStyles.save
        },
        {
          text: 'Load Game',
          onClick: () => {
            const saveData = this.saveManager.load();
            if (saveData && saveData.steps > 0) {
              const gameScene = this.scene.scene.get('GameScene');
              if (gameScene) {
                (gameScene as any).loadGame(saveData.steps);
              }
            }
            this.closeDialog();
          },
            style: this.config.menuManager.buttonStyles.load
        },
        {
          text: 'Clear Save',
          onClick: () => {
            this.saveManager.clearSave();
            this.closeDialog();
          },
            style: this.config.menuManager.buttonStyles.restart
        },
        {
          text: 'Close',
          onClick: () => {
            this.closeDialog();
          },
            style: this.config.menuManager.buttonStyles.back
        }
      ]
    };

    this.createDialog(menuConfig);
  }

  public showPotholeMenu() {
    this.clearCurrentDialog();
    
    const menuConfig: MenuConfig = {
      title: 'POTHOLE!',
      content: 'You hit a pothole! Your car took some damage. Take a moment to recover.',
      buttons: [
        {
          text: 'Continue',
          onClick: () => {
            this.closeDialog();
            const gameScene = this.scene.scene.get('GameScene');
            if (gameScene) {
              (gameScene as any).resumeAfterCollision();
            }
          },
            style: this.config.menuManager.buttonStyles.startGame
        }
      ]
    };

    this.createDialog(menuConfig);
  }

  public showExitMenu() {
    this.clearCurrentDialog();
    
    const menuConfig: MenuConfig = {
      title: 'EXIT FOUND!',
      content: 'You found an exit! This could lead to new opportunities.',
      buttons: [
        {
          text: 'Take Exit',
          onClick: () => {
            this.closeDialog();
            const gameScene = this.scene.scene.get('GameScene');
            if (gameScene) {
              (gameScene as any).takeExit();
            }
          },
            style: this.config.menuManager.buttonStyles.startGame
        },
        {
          text: 'Continue Driving',
          onClick: () => {
            this.closeDialog();
            const gameScene = this.scene.scene.get('GameScene');
            if (gameScene) {
              (gameScene as any).resumeAfterCollision();
            }
          },
            style: this.config.menuManager.buttonStyles.save
        }
      ]
    };

    this.createDialog(menuConfig);
  }

  public showTurnKeyMenu() {
    this.clearCurrentDialog();
    
    const menuConfig: MenuConfig = {
      title: 'IGNITION',
      content: 'Keys are in the ignition! Turn the dial to start the car. Swipe down to remove keys.',
      buttons: [] // No buttons - swipe down to remove keys
    };

    this.createDialog(menuConfig);
    
    // Add drag dial after creating the dialog
    this.addTurnKeyDial();
    
    // Emit event to notify GameScene that ignition menu is shown
    console.log('MenuManager: Emitting ignitionMenuShown event');
    this.scene.events.emit('ignitionMenuShown');
    
    // Also emit on GameScene
    const gameScene = this.scene.scene.get('GameScene');
    if (gameScene) {
      console.log('MenuManager: Emitting ignitionMenuShown event on GameScene');
      gameScene.events.emit('ignitionMenuShown');
    }
  }

  private addTurnKeyDial() {
    const gameWidth = this.scene.cameras.main.width;
    const gameHeight = this.scene.cameras.main.height;
    const centerX = gameWidth / 2;
    const centerY = gameHeight / 2;
    
    // Create vertical slider
    const sliderWidth = this.config.menuManager.slider.width;
    const sliderHeight = this.config.menuManager.slider.height;
    const sliderX = centerX;
    const sliderY = centerY + this.config.menuManager.slider.yOffset;
    
    // Create slider track (background)
    const sliderTrack = this.scene.add.graphics();
    sliderTrack.fillStyle(parseInt(this.config.menuManager.slider.trackColor.replace('0x', ''), 16));
    sliderTrack.fillRoundedRect(sliderX - sliderWidth/2, sliderY - sliderHeight/2, sliderWidth, sliderHeight, this.config.menuManager.slider.cornerRadius);
    sliderTrack.setScrollFactor(0);
    sliderTrack.setDepth(this.config.menuManager.depths.sliderTrack);
    
    // Create slider handle
    const handleWidth = this.config.menuManager.slider.handleWidth;
    const handleHeight = this.config.menuManager.slider.handleHeight;
    const handle = this.scene.add.graphics();
    handle.fillStyle(parseInt(this.config.menuManager.slider.handleColor.replace('0x', ''), 16));
    handle.fillRoundedRect(sliderX - handleWidth/2, sliderY + sliderHeight/2 - handleHeight, handleWidth, handleHeight, this.config.menuManager.slider.handleCornerRadius);
    handle.setScrollFactor(0);
    handle.setDepth(this.config.menuManager.depths.sliderHandle);
    
    // Add text labels
    const startLabel = this.scene.add.text(centerX, centerY + sliderHeight/2 + this.config.menuManager.labels.startLabelOffset, 'START', {
      fontSize: this.config.menuManager.labels.fontSize,
      color: this.config.menuManager.labels.color,
      fontStyle: 'bold'
    });
    startLabel.setOrigin(0.5);
    startLabel.setScrollFactor(0);
    startLabel.setDepth(this.config.menuManager.depths.labels);
    
    const turnKeyLabel = this.scene.add.text(centerX, centerY - sliderHeight/2 + this.config.menuManager.labels.turnKeyLabelOffset, 'Turn Key', {
      fontSize: this.config.menuManager.labels.fontSize,
      color: this.config.menuManager.labels.color,
      fontStyle: 'bold'
    });
    turnKeyLabel.setOrigin(0.5);
    turnKeyLabel.setScrollFactor(0);
    turnKeyLabel.setDepth(this.config.menuManager.depths.labels);
    
    // Add start value meter
    const meterWidth = this.config.menuManager.meter.width;
    const meterHeight = this.config.menuManager.meter.height;
    const meterX = centerX;
    const meterY = centerY + sliderHeight/2 + this.config.menuManager.meter.yOffset;
    
    // Meter background
    const meterBackground = this.scene.add.graphics();
    meterBackground.fillStyle(parseInt(this.config.menuManager.meter.backgroundColor.replace('0x', ''), 16));
    meterBackground.fillRoundedRect(meterX - meterWidth/2, meterY - meterHeight/2, meterWidth, meterHeight, this.config.menuManager.meter.cornerRadius);
    meterBackground.setScrollFactor(0);
    meterBackground.setDepth(this.config.menuManager.depths.meter);
    
    // Meter fill
    const meterFill = this.scene.add.graphics();
    meterFill.fillStyle(parseInt(this.config.menuManager.meter.fillColor.replace('0x', ''), 16)); // Green when accumulating
    meterFill.setScrollFactor(0);
    meterFill.setDepth(this.config.menuManager.depths.meter);
    
    // Meter text
    const meterText = this.scene.add.text(centerX, meterY + this.config.menuManager.meter.textOffset, 'START: 0%', {
      fontSize: this.config.menuManager.labels.fontSize,
      color: this.config.menuManager.labels.color,
      fontStyle: 'bold'
    });
    meterText.setOrigin(0.5);
    meterText.setScrollFactor(0);
    meterText.setDepth(this.config.menuManager.depths.meter);
    
    // Track slider state
    let isDragging = false;
    let currentProgress = 0; // 0 = bottom, 1 = top
    const maxProgress = 1.0; // 100% to start the car (must reach the very top)
    let lastPointerY = 0;
    let lastPointerX = 0;
    let lastUpdateTime = 0;
    let velocity = 0;
    const momentumDecay = this.config.menuManager.physics.momentumDecay; // How quickly momentum fades
    const maxVelocity = this.config.menuManager.physics.maxVelocity; // Increased maximum velocity per frame
    const gravity = this.config.menuManager.physics.gravity; // How much the slider falls each frame
    const sensitivity = this.config.menuManager.physics.sensitivity; // How sensitive the slider is to mouse movement (higher = more sensitive)
    
    // Start value system
    let startValue = 0; // 0-100, accumulates when slider > 90%
    const startThreshold = this.config.menuManager.physics.startThreshold; // 90% slider position to start accumulating
    const startIncrement = this.config.menuManager.physics.startIncrement; // How much to add per frame when over threshold
    //.4 is slow, .8 is medium, 1.2 is fast
    const startMax = 100; // Maximum start value to trigger ignition
    let carStarted = false; // Track if car has been started
    
    // Create pointer down handler (works anywhere on screen)
    const pointerDownHandler = (pointer: Phaser.Input.Pointer) => {
      isDragging = true;
      lastPointerY = pointer.y;
      lastPointerX = pointer.x;
      lastUpdateTime = Date.now();
      velocity = 0;
    };
    
    // Create pointer move handler
    const pointerMoveHandler = (pointer: Phaser.Input.Pointer) => {
      if (!isDragging) return;
      
      // Don't allow slider movement if car has started
      if (carStarted) return;
      
      const currentTime = Date.now();
      const deltaTime = currentTime - lastUpdateTime;
      
      if (deltaTime > 0) {
        // Calculate velocity based on pointer movement
        const deltaY = lastPointerY - pointer.y; // Inverted: up movement is positive
        const newVelocity = deltaY / sliderHeight; // Normalize to slider height
        
        // Check for swipe down gesture (much more restrictive)
        const deltaX = pointer.x - lastPointerX;
        const swipeThreshold = 100; // Much larger threshold
        const verticalDominance = Math.abs(deltaY) > Math.abs(deltaX) * 2; // Must be primarily vertical
        
        if (deltaY > swipeThreshold && verticalDominance && Math.abs(deltaY) > 150) {
          // Swipe down detected - remove keys (much harder to trigger)
          console.log('Swipe down detected - removing keys');
          this.closeDialog();
          const gameScene = this.scene.scene.get('GameScene');
          if (gameScene) {
            gameScene.events.emit('removeKeys');
          }
          return;
        }
        
        // Apply sensitivity multiplier for easier movement
        velocity = newVelocity * sensitivity;
        
        // Clamp velocity to reasonable limits
        velocity = Phaser.Math.Clamp(velocity, -maxVelocity, maxVelocity);
        
        // Update progress based on velocity
        currentProgress += velocity;
        currentProgress = Phaser.Math.Clamp(currentProgress, 0, 1);
        
        updateSlider();
      }
      
      lastPointerY = pointer.y;
      lastPointerX = pointer.x;
      lastUpdateTime = currentTime;
    };
    
    // Create pointer up handler
    const pointerUpHandler = () => {
      isDragging = false;
    };
    
    // Update slider visual
    const updateSlider = () => {
      const handleY = sliderY + sliderHeight/2 - (currentProgress * sliderHeight) - handleHeight/2;
      
      handle.clear();
      handle.fillStyle(parseInt(this.config.menuManager.slider.handleColor.replace('0x', ''), 16));
      handle.fillRoundedRect(sliderX - handleWidth/2, handleY, handleWidth, handleHeight, this.config.menuManager.slider.handleCornerRadius);
    };
    
    // Update meter visual
    const updateMeter = () => {
      const fillWidth = (startValue / startMax) * meterWidth;
      meterFill.clear();
      meterFill.fillStyle(parseInt(this.config.menuManager.meter.fillColor.replace('0x', ''), 16));
      meterFill.fillRoundedRect(meterX - meterWidth/2, meterY - meterHeight/2, fillWidth, meterHeight, this.config.menuManager.meter.cornerRadius);
      
      meterText.setText(`START: ${Math.floor(startValue)}%`);
    };
    
    // Add momentum update loop
    const momentumUpdate = () => {
      // Don't apply gravity or movement if car has started
      if (!carStarted) {
        // Apply gravity - slider constantly falls down
        velocity -= gravity;
        
        if (!isDragging && Math.abs(velocity) > 0.001) {
          // Continue momentum when not dragging
          currentProgress += velocity;
          currentProgress = Phaser.Math.Clamp(currentProgress, 0, 1);
          
          // Apply momentum decay
          velocity *= momentumDecay;
          
          updateSlider();
        } else if (!isDragging) {
          // Apply gravity even when not dragging
          currentProgress += velocity;
          currentProgress = Phaser.Math.Clamp(currentProgress, 0, 1);
          updateSlider();
        }
      } else {
        // Car has started - keep slider at the top
        currentProgress = 1.0;
        updateSlider();
      }
      
      // Check if slider is over 90% to accumulate start value
      if (currentProgress >= startThreshold) {
        startValue += startIncrement;
        startValue = Math.min(startValue, startMax);
        updateMeter();
        
        // Check if start value reached maximum to start the car
        if (startValue >= startMax) {
          console.log('Car started!');
          carStarted = true; // Mark car as started
          // Add delay before closing menu
          this.scene.time.delayedCall(500, () => {
            this.closeDialog();
            const gameScene = this.scene.scene.get('GameScene');
            if (gameScene) {
              gameScene.events.emit('turnKey');
            }
          });
        }
      } else {
        // Decrease start value when slider is below threshold
        if (startValue > 0) {
          startValue -= startIncrement * 2; // Decrease faster than it increases
          startValue = Math.max(startValue, 0);
          updateMeter();
        }
      }
    };
    
    // Start momentum update loop
    const momentumTimer = this.scene.time.addEvent({
      delay: 16, // ~60fps
      callback: momentumUpdate,
      loop: true
    });
    
    // Add event listeners (global - works anywhere on screen)
    this.scene.input.on('pointerdown', pointerDownHandler);
    this.scene.input.on('pointermove', pointerMoveHandler);
    this.scene.input.on('pointerup', pointerUpHandler);
    
    // Store handlers for cleanup
    (this.currentDialog as any).pointerDownHandler = pointerDownHandler;
    (this.currentDialog as any).pointerMoveHandler = pointerMoveHandler;
    (this.currentDialog as any).pointerUpHandler = pointerUpHandler;
    (this.currentDialog as any).momentumTimer = momentumTimer;
    
    // Store references for cleanup
    (this.currentDialog as any).turnKeyDial = { sliderTrack, handle };
    (this.currentDialog as any).dialLabel = { startLabel, turnKeyLabel };
    (this.currentDialog as any).startMeter = { meterBackground, meterFill, meterText };
  }

  public showGameOverMenu() {
    this.clearCurrentDialog();
    
    const menuConfig: MenuConfig = {
      title: 'GAME OVER',
      content: 'Time\'s up! You lost. Better luck next time!',
      buttons: [
        {
          text: 'Restart Game',
          onClick: () => {
            this.closeDialog();
            window.location.reload();
          },
            style: this.config.menuManager.buttonStyles.restart
        }
      ]
    };

    this.createDialog(menuConfig);
  }

  private createDialog(menuConfig: MenuConfig) {
    const gameWidth = this.scene.cameras.main.width;
    const gameHeight = this.scene.cameras.main.height;
    
    // Create a simple container-based dialog instead of RexUI dialog
    this.currentDialog = this.scene.add.container(gameWidth / 2, gameHeight / 2);
    this.currentDialog.setScrollFactor(0);
    this.currentDialog.setDepth(50000);
    
    // Background
    const background = this.scene.add.rectangle(0, 0, menuConfig.width || 300, menuConfig.height || (menuConfig.buttons.length > 1 ? 350 : 200), 0x000000, 0.8);
    background.setStrokeStyle(2, 0xffffff);
    this.currentDialog.add(background);
    
    // Title
    const title = this.scene.add.text(0, -80, menuConfig.title, {
      fontSize: '24px',
      color: '#ffffff',
      fontStyle: 'bold'
    });
    title.setOrigin(0.5);
    this.currentDialog.add(title);
    
    // Content
    if (menuConfig.content) {
      const content = this.scene.add.text(0, -20, menuConfig.content, {
        fontSize: '16px',
        color: '#ffffff',
        wordWrap: { width: 250 },
        align: 'center'
      });
      content.setOrigin(0.5);
      this.currentDialog.add(content);
    }
    
    // Buttons
    const buttonY = menuConfig.content ? 20 : 0;
    const buttonSpacing = 50;
    
    menuConfig.buttons.forEach((button, index) => {
      const buttonText = this.scene.add.text(0, buttonY + (index * buttonSpacing), button.text, {
        fontSize: '18px',
        color: button.style?.color || '#ffffff',
        backgroundColor: button.style?.backgroundColor || '#34495e',
        padding: { x: 15, y: 8 }
      });
      buttonText.setOrigin(0.5);
      buttonText.setInteractive();
      
      buttonText.on('pointerdown', () => {
        button.onClick();
      });
      
      buttonText.on('pointerover', () => {
        this.scene.tweens.add({
          targets: buttonText,
          scaleX: 1.05,
          scaleY: 1.05,
          duration: 100
        });
      });
      
      buttonText.on('pointerout', () => {
        this.scene.tweens.add({
          targets: buttonText,
          scaleX: 1,
          scaleY: 1,
          duration: 100
        });
      });
      
      this.currentDialog.add(buttonText);
    });
  }

  private createActionButtons(buttons: MenuButton[]) {
    return buttons.map(button => {
      const buttonText = this.scene.add.text(0, 0, button.text, {
        fontSize: '18px',
        color: button.style?.color || '#ffffff',
        backgroundColor: button.style?.backgroundColor || '#34495e',
        padding: { x: 15, y: 8 }
      });
      
      buttonText.setInteractive()
        .on('pointerdown', () => {
          button.onClick();
        })
        .on('pointerover', () => {
          this.scene.tweens.add({
            targets: buttonText,
            scaleX: 1.05,
            scaleY: 1.05,
            duration: 100
          });
        })
        .on('pointerout', () => {
          this.scene.tweens.add({
            targets: buttonText,
            scaleX: 1,
            scaleY: 1,
            duration: 100
          });
        });
      
      return buttonText;
    });
  }

  private clearCurrentDialog() {
    if (this.currentDialog) {
      // Clean up turn key slider if it exists
      if ((this.currentDialog as any).turnKeyDial) {
        const slider = (this.currentDialog as any).turnKeyDial;
        if (slider.sliderTrack) slider.sliderTrack.destroy();
        if (slider.handle) slider.handle.destroy();
      }
      if ((this.currentDialog as any).dialLabel) {
        const labels = (this.currentDialog as any).dialLabel;
        if (labels.startLabel) labels.startLabel.destroy();
        if (labels.turnKeyLabel) labels.turnKeyLabel.destroy();
      }
      if ((this.currentDialog as any).startMeter) {
        const meter = (this.currentDialog as any).startMeter;
        if (meter.meterBackground) meter.meterBackground.destroy();
        if (meter.meterFill) meter.meterFill.destroy();
        if (meter.meterText) meter.meterText.destroy();
      }
      
      // Clean up event listeners
      if ((this.currentDialog as any).pointerDownHandler) {
        this.scene.input.off('pointerdown', (this.currentDialog as any).pointerDownHandler);
      }
      if ((this.currentDialog as any).pointerMoveHandler) {
        this.scene.input.off('pointermove', (this.currentDialog as any).pointerMoveHandler);
      }
      if ((this.currentDialog as any).pointerUpHandler) {
        this.scene.input.off('pointerup', (this.currentDialog as any).pointerUpHandler);
      }
      
      // Clean up momentum timer
      if ((this.currentDialog as any).momentumTimer) {
        (this.currentDialog as any).momentumTimer.destroy();
      }
      
      this.currentDialog.destroy();
      this.currentDialog = null;
      
      // Emit event to notify GameScene that menu is hidden
      console.log('MenuManager: Emitting ignitionMenuHidden event');
      this.scene.events.emit('ignitionMenuHidden');
      
      // Also emit on GameScene
      const gameScene = this.scene.scene.get('GameScene');
      if (gameScene) {
        console.log('MenuManager: Emitting ignitionMenuHidden event on GameScene');
        gameScene.events.emit('ignitionMenuHidden');
      }
    }
  }

  private closeDialog() {
    this.clearCurrentDialog();
  }

  public closeCurrentDialog() {
    console.log('MenuManager: closeCurrentDialog called');
    this.clearCurrentDialog();
  }
}
