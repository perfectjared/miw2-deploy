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
	private foodDecayTimer?: Phaser.Time.TimerEvent;
	private lastCamWidth: number = 0;

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

		// Food meter (label + bar) alongside the pet (track its position)
		const camWidth = cam.width;
		this.lastCamWidth = camWidth;
		// Use the same pet radius as the ellipse above
		const barHeight = 10;
		const barWidth = Math.max(6, Math.floor(camWidth * 0.03));
		const barX = x + petRadius + 12;
		const barY = y - Math.floor(height * 0.35);

		this.foodLabel = this.scene.add.text(barX - 46, barY - 9, 'FOOD', {
			fontSize: '12px',
			color: '#ffffff',
			fontStyle: 'bold'
		});
		this.foodLabel.setScrollFactor(0);

		this.foodBarBG = this.scene.add.rectangle(barX + Math.floor(barWidth / 2), barY, barWidth, barHeight, 0x000000, 0.6);
		this.foodBarBG.setStrokeStyle(1, 0xffffff, 0.8);
		this.foodBarBG.setScrollFactor(0);

		this.foodBarFill = this.scene.add.rectangle(barX - Math.floor(barWidth / 2), barY, Math.floor(barWidth * (this.foodValue / 100)), barHeight - 2, 0x2ecc71, 1).setOrigin(0, 0.5);
		this.foodBarFill.setScrollFactor(0);

		this.container.add([this.foodLabel, this.foodBarBG, this.foodBarFill]);

		// Start passive food decay
		this.foodDecayTimer = this.scene.time.addEvent({
			delay: 2000,
			loop: true,
			callback: () => {
				this.setFood(this.foodValue - 1);
			}
		});
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

		// Keep food meter tracking alongside the pet and adapt width on resize
		const cam = this.scene.cameras.main;
		if (this.foodBarBG && this.foodBarFill && this.pet) {
			const rectHeight = this.baseRect.height as number;
			const petRadius = Math.floor(rectHeight * 0.30);
			const barHeight = this.foodBarBG.height;
			if (this.lastCamWidth !== cam.width) {
				this.lastCamWidth = cam.width;
				const newBarWidth = Math.max(6, Math.floor(cam.width * 0.03));
				this.foodBarBG.width = newBarWidth;
				// Recompute fill width based on new total
				const clamped = Phaser.Math.Clamp(this.foodValue, 0, 100);
				this.foodBarFill.width = Math.max(0, Math.floor(newBarWidth * (clamped / 100)) - 2);
			}
			const barX = this.pet.x + petRadius + 12;
			const barY = this.pet.y;
			this.foodBarBG.setPosition(barX, barY);
			this.foodBarFill.setPosition(barX - Math.floor(this.foodBarBG.width / 2), barY);
			this.foodLabel.setPosition(barX - 46, barY - 9);
		}
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
