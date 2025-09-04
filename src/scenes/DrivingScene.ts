import Phaser from 'phaser';

export class DrivingScene extends Phaser.Scene {
  private player: any;
  private steeringWheel: any;
  private currentSteeringValue: number = 0;
  private gameStarted: boolean = false;

  // Background elements
  private clouds1!: Phaser.GameObjects.TileSprite;
  private clouds2!: Phaser.GameObjects.TileSprite;
  private clouds3!: Phaser.GameObjects.TileSprite;
  private mountains!: Phaser.GameObjects.TileSprite;
  private hills!: Phaser.GameObjects.TileSprite;
  private hillsBaseY: number = 0;

  // Camera
  private cameraAngle: number = 0;

  // Debug
  private debugText!: Phaser.GameObjects.BitmapText;

  constructor() {
    super({ key: 'DrivingScene' });
  }

  create() {
    const gameWidth = this.scale.gameSize.width;
    const gameHeight = this.scale.gameSize.height;

    // Create background elements
    this.createBackground(gameWidth, gameHeight);

    // Create steering wheel
    this.createSteeringWheel();

    // Initialize driving game components
    this.initializeDrivingGame(gameWidth, gameHeight);

    // Add back button
    this.createBackButton();

    console.log('DrivingScene created successfully');
  }

  private createBackground(gameWidth: number, gameHeight: number) {
    // Sky (using rectangle instead of sky variable)
    this.add.rectangle(-10, -20, gameWidth + 20, gameHeight + 30, 0x87CEEB).setOrigin(0).setZ(0).setDepth(0);
    
    // Clouds and mountains (using placeholder colors for now)
    this.clouds2 = this.add.tileSprite(-10, 10, gameWidth + 20, 64, 'clouds1').setOrigin(0).setZ(3).setDepth(1);
    this.clouds3 = this.add.tileSprite(-10, 20, gameWidth + 20, 64, 'clouds2').setOrigin(0).setZ(4).setDepth(2);
    this.mountains = this.add.tileSprite(-10, gameHeight / 2 - 85, gameWidth + 20, 128, 'mountain').setOrigin(0).setZ(3).setDepth(3);
    this.clouds1 = this.add.tileSprite(-10, 0, gameWidth + 20, 64, 'clouds1').setOrigin(0).setZ(2).setDepth(4);

    this.hillsBaseY = gameHeight / 2 - 40;
    this.hills = this.add.tileSprite(-10, this.hillsBaseY, gameWidth + 10, 64, 'hills').setOrigin(0).setZ(5).setDepth(4);
  }

  private createSteeringWheel() {
    const gameWidth = this.scale.gameSize.width;
    const gameHeight = this.scale.gameSize.height;
    
    // Position the steering wheel at the bottom center
    const dialX = gameWidth / 2;
    const dialY = gameHeight * 0.85;
    
    // Create the steering wheel using RexUI knob
    this.steeringWheel = this.rexUI.add.knob({
      x: dialX,
      y: dialY,
      radius: 50,
      trackColor: 0x333333,
      barColor: 0x00ff00,
      centerColor: 0x666666,
      textColor: '#ffffff',
      textFontSize: '16px',
      value: 0,
      min: -100,
      max: 100,
      step: 1,
      easeValue: {
        duration: 100
      }
    });
    
    // Add event listeners for steering
    this.steeringWheel.on('valuechange', (newValue: number) => {
      this.currentSteeringValue = newValue;
      console.log('Steering wheel value:', newValue);
    });
    
    console.log('Steering wheel created');
  }

  private initializeDrivingGame(_gameWidth: number, gameHeight: number) {
    // For now, we'll create a simplified driving game
    // In a full implementation, you'd import and use the actual components from the phaser-driving example
    
    // Create a simple player representation
    this.player = {
      x: 0,
      y: gameHeight - 100,
      speed: 0,
      turn: 0,
      trackPosition: 0,
      z: 0,
      pitch: 0,
      accelerating: false,
      screeching: false,
      isOnGravel: false
    };

    console.log('Driving game initialized');
  }

  private createBackButton() {
    const backButton = this.add.text(20, 20, 'BACK TO GAME', {
      fontSize: '24px',
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 10, y: 5 }
    });
    
    backButton.setInteractive();
    backButton.on('pointerdown', () => {
      this.scene.stop();
      this.scene.resume('GameScene');
    });
  }

  update(_time: number, delta: number) {
    if (!this.gameStarted) return;

    const dlt = delta * 0.01;

    // Handle steering input from the wheel
    this.handleSteeringInput(dlt);

    // Update player position based on steering
    this.updatePlayerPosition(dlt);

    // Update background parallax
    this.updateBackground(dlt);

    // Update debug text
    this.updateDebugText();
  }

  private handleSteeringInput(dlt: number) {
    // Convert steering wheel value (-100 to 100) to turn amount
    const normalizedValue = this.currentSteeringValue / 100; // Convert to -1 to 1 range
    
    if (normalizedValue < -0.1) {
      // Turn left
      this.player.turn -= dlt * 0.25;
      this.cameraAngle += dlt;
    } else if (normalizedValue > 0.1) {
      // Turn right
      this.player.turn += dlt * 0.25;
      this.cameraAngle -= dlt;
    } else {
      // Center - gradually return to center
      this.player.turn = Math.abs(this.player.turn) < 0.01 ? 0 : this.player.turn * 0.95;
      this.cameraAngle = Math.abs(this.cameraAngle) < 0.02 ? 0 : this.cameraAngle * 0.95;
    }

    // Clamp values
    this.player.turn = Phaser.Math.Clamp(this.player.turn, -1, 1);
    this.cameraAngle = Phaser.Math.Clamp(this.cameraAngle, -6, 6);
  }

  private updatePlayerPosition(_dlt: number) {
    // Simple movement based on steering
    this.player.x += this.player.turn * 5;
    this.player.x = Phaser.Math.Clamp(this.player.x, -200, 200);

    // Update camera angle
    this.cameras.main.setAngle(this.cameraAngle);
  }

  private updateBackground(_dlt: number) {
    // Simple parallax effect
    if (this.clouds1) this.clouds1.tilePositionX += 0.5;
    if (this.clouds2) this.clouds2.tilePositionX += 0.3;
    if (this.clouds3) this.clouds3.tilePositionX += 0.2;
    if (this.mountains) this.mountains.tilePositionX += 0.1;
    if (this.hills) this.hills.tilePositionX += 0.15;
  }

  private updateDebugText() {
    if (!this.debugText) {
      this.debugText = this.add.bitmapText(10, 60, 'retro', '', 16).setTint(0xff0000).setDepth(200);
    }
    
    this.debugText.setText(`Steering: ${this.currentSteeringValue.toFixed(0)}
Turn: ${this.player.turn.toFixed(2)}
Camera: ${this.cameraAngle.toFixed(2)}
X: ${this.player.x.toFixed(0)}`);
  }

  public startGame() {
    this.gameStarted = true;
    console.log('Driving game started!');
  }

  public getSteeringValue(): number {
    return this.currentSteeringValue;
  }
}
