import Phaser from 'phaser';

/**
 * NavigationUI centralizes visibility logic for nav buttons/text.
 */
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


