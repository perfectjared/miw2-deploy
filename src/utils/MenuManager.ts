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
              if (appScene) {
                (appScene as any).startGame();
              }
            },
            style: {
              backgroundColor: '#27ae60',
              color: '#ffffff'
            }
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
            style: {
              backgroundColor: '#e74c3c',
              color: '#ffffff'
            }
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
            style: {
              backgroundColor: '#27ae60',
              color: '#ffffff'
            }
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
              (appScene as any).togglePauseMenu();
            }
          },
          style: {
            backgroundColor: '#27ae60',
            color: '#ffffff'
          }
        },
        {
          text: 'Restart',
          onClick: () => {
            this.closeDialog();
            window.location.reload();
          },
          style: {
            backgroundColor: '#e74c3c',
            color: '#ffffff'
          }
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
          style: {
            backgroundColor: '#3498db',
            color: '#ffffff'
          }
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
          style: {
            backgroundColor: '#f39c12',
            color: '#ffffff'
          }
        },
        {
          text: 'Clear Save',
          onClick: () => {
            this.saveManager.clearSave();
            this.closeDialog();
          },
          style: {
            backgroundColor: '#e74c3c',
            color: '#ffffff'
          }
        },
        {
          text: 'Close',
          onClick: () => {
            this.closeDialog();
          },
          style: {
            backgroundColor: '#95a5a6',
            color: '#ffffff'
          }
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
          style: {
            backgroundColor: '#27ae60',
            color: '#ffffff'
          }
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
          style: {
            backgroundColor: '#27ae60',
            color: '#ffffff'
          }
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
          style: {
            backgroundColor: '#3498db',
            color: '#ffffff'
          }
        }
      ]
    };

    this.createDialog(menuConfig);
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
          style: {
            backgroundColor: '#e74c3c',
            color: '#ffffff'
          }
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
      this.currentDialog.destroy();
      this.currentDialog = null;
    }
  }

  private closeDialog() {
    this.clearCurrentDialog();
  }
}
