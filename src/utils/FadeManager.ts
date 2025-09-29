/**
 * FADE MANAGER - TOP-LEVEL UI FOR TRANSITIONS
 * 
 * This manager handles all fade effects, transitions, and vignettes at the highest UI level.
 * It sits above all other UI elements including menus, buttons, virtual pets, etc.
 * 
 * Key Features:
 * - Fade to black/white transitions
 * - Vignette effects
 * - Scene transitions
 * - Loading screens
 * - Concert sequence effects
 */

import Phaser from 'phaser';

export class FadeManager {
  private scene: Phaser.Scene;
  private fadeOverlay?: Phaser.GameObjects.Rectangle;
  private vignetteOverlay?: Phaser.GameObjects.Rectangle;
  private isFading: boolean = false;
  private fadeDepth: number = 100000; // Highest depth - above everything

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.setupFadeOverlay();
  }

  /**
   * Set up the fade overlay rectangle
   */
  private setupFadeOverlay(): void {
    const gameWidth = this.scene.cameras.main.width;
    const gameHeight = this.scene.cameras.main.height;

    // Create fade overlay (initially transparent)
    this.fadeOverlay = this.scene.add.rectangle(
      gameWidth / 2, 
      gameHeight / 2, 
      gameWidth, 
      gameHeight, 
      0x000000, 
      0
    );
    this.fadeOverlay.setScrollFactor(0);
    this.fadeOverlay.setDepth(this.fadeDepth);
    this.fadeOverlay.setVisible(false);
  }

  /**
   * Fade to black
   */
  public fadeToBlack(duration: number = 1000, onComplete?: () => void): void {
    if (this.isFading) return;
    
    this.isFading = true;
    this.fadeOverlay!.setVisible(true);
    this.fadeOverlay!.setAlpha(0);

    this.scene.tweens.add({
      targets: this.fadeOverlay,
      alpha: 1,
      duration: duration,
      ease: 'Power2',
      onComplete: () => {
        this.isFading = false;
        if (onComplete) onComplete();
      }
    });
  }

  /**
   * Fade from black
   */
  public fadeFromBlack(duration: number = 1000, onComplete?: () => void): void {
    if (this.isFading) return;
    
    this.isFading = true;
    this.fadeOverlay!.setVisible(true);
    this.fadeOverlay!.setAlpha(1);

    this.scene.tweens.add({
      targets: this.fadeOverlay,
      alpha: 0,
      duration: duration,
      ease: 'Power2',
      onComplete: () => {
        this.isFading = false;
        this.fadeOverlay!.setVisible(false);
        if (onComplete) onComplete();
      }
    });
  }

  /**
   * Fade to white
   */
  public fadeToWhite(duration: number = 1000, onComplete?: () => void): void {
    if (this.isFading) return;
    
    this.isFading = true;
    this.fadeOverlay!.setFillStyle(0xffffff);
    this.fadeOverlay!.setVisible(true);
    this.fadeOverlay!.setAlpha(0);

    this.scene.tweens.add({
      targets: this.fadeOverlay,
      alpha: 1,
      duration: duration,
      ease: 'Power2',
      onComplete: () => {
        this.isFading = false;
        if (onComplete) onComplete();
      }
    });
  }

  /**
   * Fade from white
   */
  public fadeFromWhite(duration: number = 1000, onComplete?: () => void): void {
    if (this.isFading) return;
    
    this.isFading = false;
    this.fadeOverlay!.setFillStyle(0xffffff);
    this.fadeOverlay!.setVisible(true);
    this.fadeOverlay!.setAlpha(1);

    this.scene.tweens.add({
      targets: this.fadeOverlay,
      alpha: 0,
      duration: duration,
      ease: 'Power2',
      onComplete: () => {
        this.isFading = false;
        this.fadeOverlay!.setVisible(false);
        // Reset to black for future fades
        this.fadeOverlay!.setFillStyle(0x000000);
        if (onComplete) onComplete();
      }
    });
  }

  /**
   * Crossfade between two scenes/effects
   */
  public crossfade(duration: number = 1000, onComplete?: () => void): void {
    this.fadeToBlack(duration / 2, () => {
      this.fadeFromBlack(duration / 2, onComplete);
    });
  }

  /**
   * Concert sequence with multiple effects
   */
  public concertSequence(onComplete?: () => void): void {
    // Fade to black for concert start
    this.fadeToBlack(500, () => {
      // Hold black for a moment
      this.scene.time.delayedCall(1000, () => {
        // Fade to white for concert flash
        this.fadeToWhite(300, () => {
          // Hold white briefly
          this.scene.time.delayedCall(200, () => {
            // Fade back to black
            this.fadeToBlack(300, () => {
              // Hold black for concert
              this.scene.time.delayedCall(2000, () => {
                // Fade to white for concert end
                this.fadeToWhite(500, () => {
                  // Hold white briefly
                  this.scene.time.delayedCall(300, () => {
                    // Fade to black for transition
                    this.fadeToBlack(800, () => {
                      // Hold black for scene transition
                      this.scene.time.delayedCall(1000, () => {
                        // Fade from black to next scene
                        this.fadeFromBlack(1000, onComplete);
                      });
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  }

  /**
   * Quick flash effect
   */
  public flash(duration: number = 200, onComplete?: () => void): void {
    this.fadeToWhite(duration / 2, () => {
      this.fadeFromWhite(duration / 2, onComplete);
    });
  }

  /**
   * Set fade overlay to specific alpha without animation
   */
  public setFadeAlpha(alpha: number): void {
    if (this.fadeOverlay) {
      this.fadeOverlay.setAlpha(alpha);
      this.fadeOverlay.setVisible(alpha > 0);
    }
  }

  /**
   * Check if currently fading
   */
  public getIsFading(): boolean {
    return this.isFading;
  }

  /**
   * Clean up
   */
  public destroy(): void {
    if (this.fadeOverlay) {
      this.fadeOverlay.destroy();
    }
    if (this.vignetteOverlay) {
      this.vignetteOverlay.destroy();
    }
  }
}
