import Phaser from 'phaser';

export interface VirtualPetConfig {
	width?: number;
	height?: number;
	backgroundColor?: number;
	petColor?: number;
	xPercent?: number; // 0..1 horizontal position
	yOffset?: number;  // pixels from top
	depth?: number;
}

export class VirtualPet {
	private scene: Phaser.Scene;
	private config: VirtualPetConfig;
	private container!: Phaser.GameObjects.Container;
	private baseRect!: Phaser.GameObjects.Rectangle;
	private pet!: Phaser.GameObjects.Ellipse;
	private foodValue: number = 100; // 0..100
	private foodBarBG!: Phaser.GameObjects.Rectangle;
	private foodBarFill!: Phaser.GameObjects.Rectangle;
	private foodLabel!: Phaser.GameObjects.Text;

	constructor(scene: Phaser.Scene, config: VirtualPetConfig = {}) {
		this.scene = scene;
		this.config = config;
	}

	public initialize() {
		const cam = this.scene.cameras.main;
		const width = this.config.width ?? Math.floor(cam.width * 0.85);
		const height = this.config.height ?? Math.floor(cam.height * 0.20);
		const x = Math.floor((this.config.xPercent ?? 0.5) * cam.width);
		const y = Math.max(0, (this.config.yOffset ?? 6)) + Math.floor(height / 2);

		this.container = this.scene.add.container(0, 0);
		if (this.config.depth !== undefined) this.container.setDepth(this.config.depth);
		this.container.setScrollFactor(0);

		this.baseRect = this.scene.add.rectangle(x, y, width, height, this.config.backgroundColor ?? 0x222222, 0.9);
		this.baseRect.setStrokeStyle(2, 0xffffff, 1);
		this.baseRect.setScrollFactor(0);

		// Simple “pet” body (ellipse) atop the rectangle, Tamagotchi-like
		const petRadius = Math.floor(height * 0.30);
		this.pet = this.scene.add.ellipse(x, y - Math.floor(height * 0.35), petRadius * 2, petRadius * 2, this.config.petColor ?? 0xffcc66, 1);
		this.pet.setStrokeStyle(2, 0x000000, 1);
		this.pet.setScrollFactor(0);

		// Add simple idle bobbing animation
		this.scene.tweens.add({
			targets: this.pet,
			y: this.pet.y - 4,
			duration: 800,
			yoyo: true,
			repeat: -1,
			ease: 'Sine.easeInOut'
		});

		this.container.add([this.baseRect, this.pet]);

		// Food meter (label + bar) inside the rectangle
		const padding = 12;
		const barWidth = Math.max(10, width - padding * 2 - 50);
		const barHeight = 10;
		const barX = x - Math.floor(width / 2) + padding + 50;
		const barY = y - Math.floor(height / 2) + padding + Math.floor(barHeight / 2);

		this.foodLabel = this.scene.add.text(barX - 54, barY - 9, 'FOOD', {
			fontSize: '12px',
			color: '#ffffff',
			fontStyle: 'bold'
		});
		this.foodLabel.setScrollFactor(0);

		this.foodBarBG = this.scene.add.rectangle(barX + Math.floor(barWidth / 2), barY, barWidth, barHeight, 0x000000, 0.6);
		this.foodBarBG.setStrokeStyle(1, 0xffffff, 0.8);
		this.foodBarBG.setScrollFactor(0);

		this.foodBarFill = this.scene.add.rectangle(barX, barY, Math.floor(barWidth * (this.foodValue / 100)), barHeight - 2, 0x2ecc71, 1).setOrigin(0, 0.5);
		this.foodBarFill.setScrollFactor(0);

		this.container.add([this.foodLabel, this.foodBarBG, this.foodBarFill]);
	}

	public destroy() {
		this.container?.destroy();
	}

	public getRoot(): Phaser.GameObjects.Container | undefined {
		return this.container;
	}

	public update() {
		if (!this.container) return;
		// Counter-rotate to keep HUD upright when main camera tilts
		const camAngle = (this.scene.cameras.main as any).angle ?? 0;
		(this.container as any).setAngle?.(-camAngle);
	}

	private refreshFoodBar() {
		if (!this.foodBarBG || !this.foodBarFill) return;
		const totalWidth = this.foodBarBG.width;
		const clamped = Phaser.Math.Clamp(this.foodValue, 0, 100);
		this.foodBarFill.width = Math.max(0, Math.floor(totalWidth * (clamped / 100)) - 2);
		// Color shift based on value (green -> yellow -> red)
		const color = clamped > 60 ? 0x2ecc71 : (clamped > 30 ? 0xf1c40f : 0xe74c3c);
		this.foodBarFill.fillColor = color as any;
	}

	public setFood(value: number) {
		this.foodValue = value;
		this.refreshFoodBar();
	}
}
