import Phaser from 'phaser';

/**
 * OverlaySystem wraps overlay visibility and mask updates for crank and ignition overlays.
 * It delegates to existing GameScene methods to preserve behavior.
 */
export class OverlaySystem {
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  public updateCrankTutorialOverlay() {
    const host: any = this.scene;
    if (!host.crankTutorialOverlay) {
      console.log('Crank tutorial overlay not found');
      return;
    }
    const shouldShow = host.carStarted && host.currentSpeedCrankPercentage === 0;
    console.log('Crank overlay check - carStarted:', host.carStarted, 'crankPercentage:', host.currentSpeedCrankPercentage, 'shouldShow:', shouldShow);
    host.crankTutorialOverlay.setVisible(shouldShow);
    if (shouldShow) {
      this.updateCrankTutorialMask();
    }
    console.log('Crank tutorial overlay visibility:', shouldShow ? 'shown' : 'hidden');
  }

  public updateIgnitionTutorialOverlay() {
    const host: any = this.scene;
    if (!host.ignitionTutorialOverlay) {
      console.log('Ignition tutorial overlay not found');
      return;
    }
    const shouldShow = host.ignitionMenuShown;
    console.log('Ignition overlay check - ignitionMenuShown:', host.ignitionMenuShown, 'shouldShow:', shouldShow);
    console.log('Ignition overlay exists:', !!host.ignitionTutorialOverlay);
    console.log('Ignition overlay visible before:', host.ignitionTutorialOverlay.visible);
    host.ignitionTutorialOverlay.setVisible(shouldShow);
    console.log('Ignition overlay visible after:', host.ignitionTutorialOverlay.visible);
    console.log('Ignition overlay depth:', host.ignitionTutorialOverlay.depth);
    console.log('Ignition overlay alpha:', host.ignitionTutorialOverlay.alpha);
    if (shouldShow) {
      this.updateIgnitionTutorialMask();
      console.log('Ignition mask updated');
    }
    console.log('Ignition tutorial overlay visibility:', shouldShow ? 'shown' : 'hidden');
  }

  public onIgnitionMenuShown() {
    const host: any = this.scene;
    console.log('Ignition menu shown - updating overlay');
    host.ignitionMenuShown = true;
    console.log('ignitionMenuShown set to:', host.ignitionMenuShown);
    this.updateIgnitionTutorialOverlay();
  }

  public onIgnitionMenuHidden() {
    const host: any = this.scene;
    console.log('Ignition menu hidden - updating overlay');
    host.ignitionMenuShown = false;
    console.log('ignitionMenuShown set to:', host.ignitionMenuShown);
    this.updateIgnitionTutorialOverlay();
  }

  public createCrankTutorialOverlay() {
    const host: any = this.scene;
    const gameWidth = host.cameras.main.width;
    const gameHeight = host.cameras.main.height;
    const cfg = host.config?.overlays?.tutorial;
    console.log('Creating crank tutorial overlay with dimensions:', gameWidth, gameHeight);
    host.crankTutorialOverlay = host.add.container(0, 0);
    host.crankTutorialOverlay.setDepth(cfg?.depth ?? 50000);
    const overlay = host.add.graphics();
    overlay.fillStyle(0x000000, cfg?.alpha ?? 0.5).fillRect(0, 0, gameWidth, gameHeight);
    host.crankTutorialOverlay.add(overlay);
    const maskGraphics = host.make.graphics();
    host.crankTutorialMaskGraphics = maskGraphics;
    maskGraphics.fillStyle(0xffffff);
    const mask = new Phaser.Display.Masks.BitmapMask(this.scene, maskGraphics);
    mask.invertAlpha = true;
    overlay.setMask(mask);
    host.crankTutorialOverlay.setVisible(false);
    console.log('Crank tutorial overlay created');
  }

  public updateCrankTutorialMask() {
    const host: any = this.scene;
    if (!host.crankTutorialOverlay || !host.speedCrankArea) {
      console.log('Cannot update crank mask - overlay or crank area not found');
      return;
    }
    if (!host.crankTutorialMaskGraphics) {
      return;
    }
    host.crankTutorialMaskGraphics.clear();
    host.crankTutorialMaskGraphics.fillStyle(0xffffff);
    const crankX = host.speedCrankArea.x;
    const crankY = host.speedCrankArea.y;
    const crankWidth = host.speedCrankArea.width;
    const crankHeight = host.speedCrankArea.height;
    const cutoutPadding = host.config?.overlays?.tutorial?.crank?.cutoutPadding ?? 10;
    const cutoutX = crankX - crankWidth/2 - cutoutPadding;
    const cutoutY = crankY - crankHeight/2 - cutoutPadding;
    const cutoutWidth = crankWidth + (cutoutPadding * 2);
    const cutoutHeight = crankHeight + (cutoutPadding * 2);
    host.crankTutorialMaskGraphics.beginPath();
    host.crankTutorialMaskGraphics.fillRoundedRect(cutoutX, cutoutY, cutoutWidth, cutoutHeight, host.config?.overlays?.tutorial?.crank?.cornerRadius ?? 8);
    host.crankTutorialMaskGraphics.closePath();
    host.crankTutorialMaskGraphics.fill();
    console.log('Crank mask updated with cutout at:', crankX, crankY);
  }

  public createIgnitionTutorialOverlay() {
    const host: any = this.scene;
    const gameWidth = host.cameras.main.width;
    const gameHeight = host.cameras.main.height;
    const cfg = host.config?.overlays?.tutorial;
    console.log('Creating ignition tutorial overlay with dimensions:', gameWidth, gameHeight);
    host.ignitionTutorialOverlay = host.add.container(0, 0);
    host.ignitionTutorialOverlay.setDepth(cfg?.depth ?? 50000);
    const overlay = host.add.graphics();
    overlay.fillStyle(0x000000, cfg?.alpha ?? 0.5).fillRect(0, 0, gameWidth, gameHeight);
    host.ignitionTutorialOverlay.add(overlay);
    const maskGraphics = host.make.graphics();
    host.ignitionTutorialMaskGraphics = maskGraphics;
    maskGraphics.fillStyle(0xffffff);
    const mask = new Phaser.Display.Masks.BitmapMask(this.scene, maskGraphics);
    mask.invertAlpha = true;
    overlay.setMask(mask);
    host.ignitionTutorialOverlay.setVisible(false);
    host.ignitionTutorialOverlay.setDepth(cfg?.ignition?.depth ?? 1000);
    console.log('Ignition tutorial overlay created with depth:', host.ignitionTutorialOverlay.depth);
    console.log('Ignition tutorial overlay mask applied:', !!overlay.mask);
    console.log('Ignition tutorial overlay mask invertAlpha:', mask.invertAlpha);
  }

  public updateIgnitionTutorialMask() {
    const host: any = this.scene;
    if (!host.ignitionTutorialOverlay) {
      console.log('Cannot update ignition mask - overlay not found');
      return;
    }
    if (!host.ignitionTutorialMaskGraphics) {
      return;
    }
    host.ignitionTutorialMaskGraphics.clear();
    host.ignitionTutorialMaskGraphics.fillStyle(0xffffff);
    const gameWidth = host.cameras.main.width;
    const gameHeight = host.cameras.main.height;
    const menuX = gameWidth / 2;
    const menuY = gameHeight / 2;
    const menuWidth = 300;
    const menuHeight = 200;
    const scaleFactor = host.config?.overlays?.tutorial?.ignition?.cutoutScale ?? 1.2;
    const cutoutWidth = menuWidth * scaleFactor;
    const cutoutHeight = menuHeight * scaleFactor;
    const cutoutX = menuX - cutoutWidth/2;
    const cutoutY = menuY - cutoutHeight/2;
    host.ignitionTutorialMaskGraphics.beginPath();
    host.ignitionTutorialMaskGraphics.fillRoundedRect(cutoutX, cutoutY, cutoutWidth, cutoutHeight, host.config?.overlays?.tutorial?.ignition?.cornerRadius ?? 12);
    host.ignitionTutorialMaskGraphics.closePath();
    host.ignitionTutorialMaskGraphics.fill();
    console.log('Ignition mask updated with cutout at:', menuX, menuY, 'size:', cutoutWidth, 'x', cutoutHeight);
    console.log('Ignition mask cutout position:', cutoutX, cutoutY);
    console.log('Ignition mask graphics exists:', !!host.ignitionTutorialMaskGraphics);
  }
}


