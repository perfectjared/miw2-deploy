import Phaser from 'phaser';

/**
 * Centralized key/ignition management that operates on a host scene.
 * This module delegates side-effects back to the GameScene to avoid behavior changes.
 */
export class KeySystem {
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * Handles the complete key removal process - mirrors existing GameScene behavior.
   */
  public handleKeyRemoval(reason: string = 'unknown') {
    // Expecting the host scene to expose these fields/methods via 'as any'
    const host: any = this.scene;

    console.log(`Keys removed from ignition - reason: ${reason}`);

    // Remove the constraint to release the keys
    if (host.keysConstraint) {
      host.matter.world.remove(host.keysConstraint);
      host.keysConstraint = null;

      // Reset all car-related state (delegated to scene)
      if (typeof host.resetCarState === 'function') {
        host.resetCarState();
      }

      // Set cooldown to prevent immediate re-snapping
      host.keysRemovalCooldown = 1000; // 1 second cooldown

      // Reset keys scroll factor
      if (host.frontseatKeys && host.frontseatKeys.gameObject) {
        host.frontseatKeys.gameObject.setScrollFactor(1, 0);
      }

      // Reset magnetic target color - redraw with green stroke
      if (host.magneticTarget) {
        host.magneticTarget.clear();
        host.magneticTarget.lineStyle(2, 0x00ff00);
        host.magneticTarget.strokeCircle(0, 0, 20);
      }

      // Return camera to front seat
      if (typeof host.switchToFrontseat === 'function') {
        host.switchToFrontseat();
      }

      // Hide navigation buttons until car is started again
      if (typeof host.updateNavigationButtonVisibility === 'function') {
        host.updateNavigationButtonVisibility();
      }

      // Close the turn key menu since keys are no longer in ignition
      const menuScene = this.scene.scene.get('MenuScene');
      if (menuScene) {
        console.log('GameScene: Emitting closeCurrentMenu event to MenuScene');
        menuScene.events.emit('closeCurrentMenu');
      } else {
        console.log('GameScene: MenuScene not found when trying to emit closeCurrentMenu');
      }
    }
  }
}


