import Phaser from 'phaser';

export class BackseatScene extends Phaser.Scene {
  private currentView: string = 'main'; // 'main' or 'overlay'

  constructor() {
    super({ key: 'BackseatScene' });
  }

  create() {
    const gameWidth = this.cameras.main.width;
    const gameHeight = this.cameras.main.height;
    const centerX = gameWidth / 2;
    const centerY = gameHeight / 2;

    // BACK SEAT CONTENT (main view)
    const backseatTitle = this.add.text(centerX, centerY - 30, 'BACK SEAT', {
      fontSize: '36px',
      color: '#ffffff',
      fontStyle: 'bold'
    });
    backseatTitle.setOrigin(0.5);

    const backseatSubtitle = this.add.text(centerX, centerY + 20, 'Passenger position', {
      fontSize: '18px',
      color: '#cccccc'
    });
    backseatSubtitle.setOrigin(0.5);

    const backseatHint = this.add.text(centerX, gameHeight - 60, 'Left: Move to frontseat | Down: View Inventory', {
      fontSize: '14px',
      color: '#888888'
    });
    backseatHint.setOrigin(0.5);

    // Listen for camera movement events from GameScene
    this.events.on('showOverlay', () => {
      // Move camera down to show overlay content (affects both main and overlay)
      this.cameras.main.pan(centerX, centerY + 320, 500);
    });

    this.events.on('hideOverlay', () => {
      // Move camera back up to show main content (affects both main and overlay)
      this.cameras.main.pan(centerX, centerY, 500);
    });
  }
}
