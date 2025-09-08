import Phaser from 'phaser';

/**
 * MenuBridge wraps cross-scene menu event emissions.
 */
export class MenuBridge {
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  public showPauseMenu() {
    const menuScene = this.scene.scene.get('MenuScene');
    if (menuScene) {
      menuScene.events.emit('showPauseMenu');
      this.scene.scene.bringToTop('MenuScene');
    }
  }

  public showTurnKeyMenu() {
    const menuScene = this.scene.scene.get('MenuScene');
    if (menuScene) {
      menuScene.events.emit('showTurnKeyMenu');
      this.scene.scene.bringToTop('MenuScene');
    }
  }

  public closeCurrentMenu() {
    const menuScene = this.scene.scene.get('MenuScene');
    if (menuScene) {
      menuScene.events.emit('closeCurrentMenu');
    }
  }

  public showSaveMenu() {
    const menuScene = this.scene.scene.get('MenuScene');
    if (menuScene) {
      menuScene.events.emit('showSaveMenu');
      this.scene.scene.bringToTop('MenuScene');
    }
  }

  public showGameOverMenu() {
    const menuScene = this.scene.scene.get('MenuScene');
    if (menuScene) {
      menuScene.events.emit('showGameOverMenu');
      this.scene.scene.bringToTop('MenuScene');
    }
  }

  public showObstacleMenu(obstacleType: string) {
    const menuScene = this.scene.scene.get('MenuScene');
    if (menuScene) {
      menuScene.events.emit('showObstacleMenu', obstacleType);
      this.scene.scene.bringToTop('MenuScene');
    }
  }
}


