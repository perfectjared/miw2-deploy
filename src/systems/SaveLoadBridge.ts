import Phaser from 'phaser';

/**
 * SaveLoadBridge centralizes calls to AppScene and MenuScene for save/load.
 */
export class SaveLoadBridge {
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  public loadSteps(steps: number) {
    const appScene = this.scene.scene.get('AppScene');
    if (appScene) {
      (appScene as any).setStep(steps);
    }
  }

  public showSaveMenu() {
    const menuScene = this.scene.scene.get('MenuScene');
    if (menuScene) {
      menuScene.events.emit('showSaveMenu');
      this.scene.scene.bringToTop('MenuScene');
    }
  }
}


