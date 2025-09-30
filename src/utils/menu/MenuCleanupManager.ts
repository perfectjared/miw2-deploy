/**
 * MENU CLEANUP MANAGER
 * 
 * Handles cleanup of menu dialogs including:
 * - Animation cleanup
 * - Event listener removal
 * - Resource cleanup
 * - Memory management
 */

import Phaser from 'phaser';
import { WindowShapes } from '../WindowShapes';

export class MenuCleanupManager {
  private scene: Phaser.Scene;
  private windowShapes?: WindowShapes;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  private getWindowShapes(): WindowShapes | null {
    try {
      const gameScene = this.scene.scene.get('GameScene');
      const ws = (gameScene && (gameScene as any).windowShapes) || this.windowShapes;
      if (ws) this.windowShapes = ws;
      return ws || null;
    } catch {
      return this.windowShapes || null;
    }
  }

  clearDialog(dialog: Phaser.GameObjects.Container): void {
    if (!dialog) return;

    // Closing animation for collage window
    try {
      const cw = (dialog as any).collageWindow as Phaser.GameObjects.Graphics | undefined;
      if (cw && cw.scene) {
        cw.once('destroy', () => {
          this.finishCleanup(dialog);
        });
        this.scene.tweens.add({
          targets: cw,
          scaleX: 0.01,
          scaleY: 0.01,
          duration: 160,
          ease: 'Back.easeIn',
          onComplete: () => {
            try { cw.destroy(); } catch {}
          }
        });
        return; // Defer cleanup until after animation
      }
    } catch (error) {
      console.error('Error in closing animation:', error);
    }

    // No animated window; perform immediate cleanup
    this.finishCleanup(dialog);
  }

  private finishCleanup(dialog: Phaser.GameObjects.Container): void {
    if (!dialog) return;

    // Unregister animated shapes
    try {
      const ws = this.getWindowShapes();
      if (ws && (ws as any).unregisterAnimatedShape) {
        const commonIds = ['hMenuAnimationId', 'cyoaAnimationId', 'animationId'];
        commonIds.forEach(id => {
          const shapeId = (dialog as any)[id];
          if (shapeId) {
            (ws as any).unregisterAnimatedShape(shapeId);
          }
        });
        
        const collageWindow = (dialog as any).collageWindow;
        if (collageWindow && (collageWindow as any).__shapeId) {
          (ws as any).unregisterAnimatedShape((collageWindow as any).__shapeId);
        }

        // Recursively unregister any child Graphics with animationId or cyoaAnimationId
        this.unregisterFromChildren(dialog, ws);
      }
    } catch (error) {
      console.error('Error unregistering animated shapes:', error);
    }

    // Clean up background
    if ((dialog as any).background) {
      const background = (dialog as any).background;
      if ((background as any).overlayInstance) {
        (background as any).overlayInstance.destroy();
      } else {
        background.destroy();
      }
    }

    // Clean up background sprite and geometry mask
    const backgroundSprite = (dialog as any).backgroundSprite;
    if (backgroundSprite && backgroundSprite.destroy) {
      backgroundSprite.destroy();
    }
    
    const geometryMask = (dialog as any).geometryMask;
    if (geometryMask && geometryMask.destroy) {
      geometryMask.destroy();
    }

    // Clean up subtitle animation
    const subtitleElement = (dialog as any).subtitleElement;
    if (subtitleElement && (subtitleElement as any).pulseTween) {
      (subtitleElement as any).pulseTween.stop();
      (subtitleElement as any).pulseTween.destroy();
    }

    // Clean up ad-hoc UI parts
    this.cleanupAdHocUI(dialog);

    // Clean up event listeners
    this.cleanupEventListeners(dialog);

    // Clean up timers
    if ((dialog as any).momentumTimer) {
      (dialog as any).momentumTimer.destroy();
    }

    // Clean up countdown text
    if ((dialog as any).countdownText) {
      (dialog as any).countdownText.destroy();
      (dialog as any).countdownText = null;
    }

    // Clean up text display callbacks
    const textDisplayCallbacks = (dialog as any).textDisplayCallbacks;
    if (textDisplayCallbacks && Array.isArray(textDisplayCallbacks)) {
      textDisplayCallbacks.forEach((callback: any) => {
        if (callback && callback.destroy) {
          callback.destroy();
        }
      });
    }

    // Destroy the container
    dialog.destroy();
  }

  private unregisterFromChildren(container: any, ws: any): void {
    try {
      const children: any[] = (container && container.list) ? container.list : [];
      children.forEach((child: any) => {
        if (child && child.type === 'Graphics') {
          const animId = (child as any).animationId;
          const cyoaId = (child as any).cyoaAnimationId;
          if (animId) {
            (ws as any).unregisterAnimatedShape(animId);
          }
          if (cyoaId) {
            (ws as any).unregisterAnimatedShape(cyoaId);
          }
        }
        if (child && child.list && Array.isArray(child.list)) {
          this.unregisterFromChildren(child, ws);
        }
      });
    } catch (error) {
      console.error('Error unregistering from children:', error);
    }
  }

  private cleanupAdHocUI(dialog: any): void {
    // Clean up turn key dial
    if (dialog.turnKeyDial) {
      const slider = dialog.turnKeyDial;
      if (slider.sliderTrack) slider.sliderTrack.destroy();
      if (slider.handle) slider.handle.destroy();
    }

    // Clean up dial labels
    if (dialog.dialLabel) {
      const labels = dialog.dialLabel;
      if (labels.startLabel) labels.startLabel.destroy();
      if (labels.turnKeyLabel) labels.turnKeyLabel.destroy();
    }

    // Clean up start meter
    if (dialog.startMeter) {
      const meter = dialog.startMeter;
      if (meter.meterBackground) meter.meterBackground.destroy();
      if (meter.meterFill) meter.meterFill.destroy();
      if (meter.meterText) meter.meterText.destroy();
    }
  }

  private cleanupEventListeners(dialog: any): void {
    if (dialog.pointerDownHandler) {
      this.scene.input.off('pointerdown', dialog.pointerDownHandler);
    }
    if (dialog.pointerMoveHandler) {
      this.scene.input.off('pointermove', dialog.pointerMoveHandler);
    }
    if (dialog.pointerUpHandler) {
      this.scene.input.off('pointerup', dialog.pointerUpHandler);
    }
  }
}
