/**
 * NAVIGATION UI - NAVIGATION CONTROLS MANAGEMENT
 * 
 * This class manages the visibility and behavior of navigation UI elements
 * such as buttons for switching between frontseat/backseat views and
 * toggling map/inventory displays.
 * 
 * Key Features:
 * - Centralized visibility logic for navigation elements
 * - Conditional display based on game state (car started, crank percentage)
 * - Dynamic UI updates based on player progress
 * - Clean separation of navigation logic from main game scene
 * 
 * The NavigationUI ensures that navigation controls only appear when
 * the player has progressed far enough in the game to use them.
 */

import Phaser from 'phaser';

export class NavigationUI {
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  public updateVisibility() {
    const host: any = this.scene;
    const crankPercentage = host.getSpeedCrankPercentage ? host.getSpeedCrankPercentage() : 0;
    const threshold = host.config?.navigation?.minCrankPercentForNavButtons ?? 40;
    const shouldShowButtons = !!host.carStarted && crankPercentage >= threshold;
    console.log('Updating navigation button visibility - carStarted:', host.carStarted, 'crankPercentage:', crankPercentage, 'shouldShow:', shouldShowButtons);
    if (host.frontseatButton) host.frontseatButton.setVisible(shouldShowButtons);
    if (host.backseatButton) host.backseatButton.setVisible(shouldShowButtons);
    if (host.mapToggleButton) host.mapToggleButton.setVisible(shouldShowButtons);
    if (host.inventoryToggleButton) host.inventoryToggleButton.setVisible(shouldShowButtons);
    if (host.mapToggleText) host.mapToggleText.setVisible(shouldShowButtons);
    if (host.inventoryToggleText) host.inventoryToggleText.setVisible(shouldShowButtons);
  }
}


