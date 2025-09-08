import Phaser from 'phaser';

/**
 * DrivingSystem delegates driving-related operations to the host GameScene.
 * Thin wrapper to enable progressive extraction without behavior changes.
 */
export class DrivingSystem {
  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  public startDriving() {
    const host: any = this.scene;
    host.drivingMode = true;
    host.shouldAutoRestartDriving = true;
    console.log('Starting driving...');
    host.carSpeed = 0;
    host.carX = host.cameras.main.width / 2;
    if (host.drivingCar) {
      host.drivingCar.setX(host.carX);
    }
    if (typeof host.startForwardMovementTimer === 'function') host.startForwardMovementTimer();
    if (typeof host.startNeutralReturnTimer === 'function') host.startNeutralReturnTimer();
    if (typeof host.startObstacleSpawning === 'function') host.startObstacleSpawning();
  }

  public stopDriving() {
    const host: any = this.scene;
    host.drivingMode = false;
    console.log('Stopping driving...');
    host.carSpeed = 0;
    if (typeof host.stopForwardMovementTimer === 'function') host.stopForwardMovementTimer();
    if (typeof host.stopNeutralReturnTimer === 'function') host.stopNeutralReturnTimer();
    if (typeof host.stopObstacleSpawning === 'function') host.stopObstacleSpawning();
  }

  public pauseDriving() {
    const host: any = this.scene;
    host.drivingPaused = true;
  }

  public resumeDriving() {
    const host: any = this.scene;
    host.drivingPaused = false;
    host.shouldAutoResumeAfterCollision = false;
  }

  public updateForwardMovement() {
    const host: any = this.scene;
    if (typeof host.updateForwardMovement === 'function') host.updateForwardMovement();
  }

  public updateCarPosition() {
    const host: any = this.scene;
    if (typeof host.updateCarPosition === 'function') host.updateCarPosition();
  }
}


