import Phaser from 'phaser';
import { PET_CONFIG } from '../config/GameConfig';

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
	private foodValue: number = 0; // 0..10
	private foodBarBG!: Phaser.GameObjects.Rectangle;
	private foodBarFill!: Phaser.GameObjects.Rectangle;
	private foodLabel!: Phaser.GameObjects.Text;
	private foodDecayTimer?: Phaser.Time.TimerEvent;
	private lastCamWidth: number = 0;
	private debugGraphics?: Phaser.GameObjects.Graphics;
	private isHovering: boolean = false;
	private petBaseColor: number = PET_CONFIG.petColor;

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
		
		// Make container interactive to handle pet clicks
		this.container.setInteractive();

		// Only create rectangle if width/height are not 0 (shared rectangle mode)
		if (width > 0 && height > 0) {
			this.baseRect = this.scene.add.rectangle(x, y, width, height, this.config.backgroundColor ?? 0x222222, 0.9);
			this.baseRect.setStrokeStyle(2, 0xffffff, 1);
			this.baseRect.setScrollFactor(0);
		}

		// Simple "pet" body (ellipse), Tamagotchi-like
		// Use a fixed size when in shared rectangle mode
		const petRadius = width > 0 ? Math.floor(height * 0.27) : 25;
		this.petBaseColor = this.config.petColor ?? 0xffcc66;
		const leftShift = width > 0 ? Math.floor((this.baseRect?.width as number) * 0.30) : 0;
		this.pet = this.scene.add.ellipse(x - leftShift, y - Math.floor(height * 0.35), petRadius * 2, petRadius * 2, this.petBaseColor, 1);
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

		// Make pet interactive for menu opening
		this.pet.setInteractive();
		// Set a specific hit area for the pet
		this.pet.setInteractive(new Phaser.Geom.Circle(0, 0, petRadius), Phaser.Geom.Circle.Contains);
		this.pet.on('pointerdown', () => {
			console.log('Virtual pet pointerdown detected!');
		});
		this.pet.on('pointerup', () => {
			console.log('Virtual pet pointerup detected!');
			// Emit on MenuScene so the handler runs there
			const menuScene = this.scene.scene.get('MenuScene');
			menuScene?.events.emit('showVirtualPetMenu', this.pet);
		});

		// Add elements to container (only add baseRect if it exists)
		const elementsToAdd = this.baseRect ? [this.baseRect, this.pet] : [this.pet];
		this.container.add(elementsToAdd);
		
		// Create a separate invisible interactive circle over the pet
		const clickArea = this.scene.add.circle(x - leftShift, y - Math.floor(height * 0.35), petRadius, 0x000000, 0);
		clickArea.setInteractive();
		clickArea.setScrollFactor(0);
		clickArea.setDepth(70001); // Higher than pet
		clickArea.on('pointerdown', () => {
			console.log('Click area pointerdown detected!');
		});
		clickArea.on('pointerup', () => {
			console.log('Click area pointerup detected!');
			// Emit on MenuScene so the handler runs there
			const menuScene = this.scene.scene.get('MenuScene');
			menuScene?.events.emit('showVirtualPetMenu', this.pet);
		});
		
		// Also make container handle clicks as backup
		this.container.on('pointerdown', () => {
			console.log('Container pointerdown detected!');
		});
		this.container.on('pointerup', () => {
			console.log('Container pointerup detected!');
			// Emit on MenuScene so the handler runs there
			const menuScene = this.scene.scene.get('MenuScene');
			menuScene?.events.emit('showVirtualPetMenu', this.pet);
		});

		// Food meter (label + bar) alongside the pet (track its position)
		const camWidth = cam.width;
		this.lastCamWidth = camWidth;
		// Use the same pet radius as the ellipse above
		const barHeight = 10;
		const barWidth = Math.max(6, Math.floor(camWidth * 0.03));
		const barX = (x - leftShift) + petRadius + 12;
		const barY = y - Math.floor((height > 0 ? height : 80) * 0.35);

		this.foodLabel = this.scene.add.text(barX - 46, barY - 9, 'FOOD', {
			fontSize: '12px',
			color: '#ffffff',
			fontStyle: 'bold'
		});
		this.foodLabel.setScrollFactor(0);
		this.foodLabel.setVisible(false); // Hide from pet display

		this.foodBarBG = this.scene.add.rectangle(barX + Math.floor(barWidth / 2), barY, barWidth, barHeight, 0x000000, 0.6);
		this.foodBarBG.setStrokeStyle(1, 0xffffff, 0.8);
		this.foodBarBG.setScrollFactor(0);
		this.foodBarBG.setVisible(false); // Hide from pet display

		this.foodBarFill = this.scene.add.rectangle(barX - Math.floor(barWidth / 2), barY, Math.floor(barWidth * (this.foodValue / 10)), barHeight - 2, 0x2ecc71, 1).setOrigin(0, 0.5);
		this.foodBarFill.setScrollFactor(0);
		this.foodBarFill.setVisible(false); // Hide from pet display

		this.container.add([this.foodLabel, this.foodBarBG, this.foodBarFill]);

		// Debug graphics (hidden by default)
		this.debugGraphics = this.scene.add.graphics();
		this.debugGraphics.setScrollFactor(0);
		this.container.add(this.debugGraphics);

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

	public getBounds(): Phaser.Geom.Rectangle | undefined {
		if (!this.baseRect) return undefined;
		return this.baseRect.getBounds();
	}

	/** Camera-agnostic screen-space bounds using current x/y/width/height (no camera matrix) */
	public getScreenBounds(): Phaser.Geom.Rectangle | undefined {
		if (!this.baseRect) return undefined;
		const w = this.baseRect.width as number;
		const h = this.baseRect.height as number;
		return new Phaser.Geom.Rectangle(this.baseRect.x - w / 2, this.baseRect.y - h / 2, w, h);
	}

	public isPointerOver(px: number, py: number): boolean {
		const anchor = this.getFeedAnchor();
		if (!anchor) return false;
		const dx = px - anchor.x;
		const dy = py - anchor.y;
		const dist = Math.sqrt(dx * dx + dy * dy);
		const margin = 12; // allow slight forgiveness
		return dist <= (anchor.r + margin);
	}

	public setHover(hover: boolean) {
		if (!this.pet) return;
		if (hover === this.isHovering) return;
		this.isHovering = hover;
		// Visual feedback on the pet itself
		if (hover) {
			this.scene.tweens.add({ targets: this.pet, scaleX: 1.08, scaleY: 1.08, duration: 120, ease: 'Sine.easeOut' });
			(this.pet as any).fillColor = 0xffe08a;
		} else {
			this.scene.tweens.add({ targets: this.pet, scaleX: 1, scaleY: 1, duration: 120, ease: 'Sine.easeOut' });
			(this.pet as any).fillColor = this.petBaseColor as any;
		}
	}

	public setDebugBoundsVisible(visible: boolean) {
		if (!this.debugGraphics || !this.baseRect) return;
		this.debugGraphics.clear();
		if (!visible) return;
		const w = this.baseRect.width as number;
		const h = this.baseRect.height as number;
		this.debugGraphics.lineStyle(2, 0xff0000, 0.9);
		this.debugGraphics.strokeRect(this.baseRect.x - w / 2, this.baseRect.y - h / 2, w, h);
	}

	/** Point and radius for feeding proximity (pet body) */
	public getFeedAnchor(): { x: number; y: number; r: number } | undefined {
		if (!this.pet) return undefined;
		const rectH = this.baseRect?.height as number || 80; // Fallback height
		const r = Math.floor(rectH * 0.30);
		return { x: this.pet.x, y: this.pet.y, r };
	}

	public update() {
		if (!this.container) return;
		// Counter-rotate to keep HUD upright when main camera tilts
		const camAngle = (this.scene.cameras.main as any).angle ?? 0;
		(this.container as any).setAngle?.(-camAngle);

		// Keep food meter tracking alongside the pet and adapt width on resize
		const cam = this.scene.cameras.main;
		if (this.foodBarBG && this.foodBarFill && this.pet) {
			const rectHeight = this.baseRect?.height as number || 80; // Fallback height
			const petRadius = Math.floor(rectHeight * 0.30);
			const barHeight = this.foodBarBG.height;
			if (this.lastCamWidth !== cam.width) {
				this.lastCamWidth = cam.width;
				const newBarWidth = Math.max(6, Math.floor(cam.width * 0.03));
				this.foodBarBG.width = newBarWidth;
				// Recompute fill width based on new total (0..10 scale)
				const clamped = Phaser.Math.Clamp(this.foodValue, 0, 10);
				this.foodBarFill.width = Math.max(0, Math.floor(newBarWidth * (clamped / 10)) - 2);
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
		const clamped = Phaser.Math.Clamp(this.foodValue, 0, 10);
		this.foodBarFill.width = Math.max(0, Math.floor(totalWidth * (clamped / 10)) - 2);
		// Color shift based on value (green -> yellow -> red)
		const color = clamped > 6 ? 0x2ecc71 : (clamped > 3 ? 0xf1c40f : 0xe74c3c);
		this.foodBarFill.fillColor = color as any;
	}

	public setFood(value: number) {
		this.foodValue = Phaser.Math.Clamp(value, 0, 10);
		this.refreshFoodBar();
	}

	/** Gradually add food over a short duration */
	public feedOverTime(amount: number, ms: number, onTick?: (pct: number) => void, onDone?: () => void) {
		const start = this.foodValue;
		const target = Phaser.Math.Clamp(start + amount, 0, 10);
		const duration = Math.max(50, ms);
		const startTime = this.scene.time.now;
		const timer = this.scene.time.addEvent({
			delay: 16,
			loop: true,
			callback: () => {
				const t = Phaser.Math.Clamp((this.scene.time.now - startTime) / duration, 0, 1);
				const eased = Phaser.Math.Easing.Quadratic.Out(t);
				const value = Phaser.Math.Linear(start, target, eased);
				this.setFood(value);
				if (onTick) onTick(eased);
				if (t >= 1) {
					timer.remove(false);
					if (onDone) onDone();
				}
			}
		});
	}

	/**
	 * Get food meter elements for display in menu
	 */
	public getFoodMeterElements(): { label: Phaser.GameObjects.Text, background: Phaser.GameObjects.Rectangle, fill: Phaser.GameObjects.Rectangle } {
		return {
			label: this.foodLabel,
			background: this.foodBarBG,
			fill: this.foodBarFill
		};
	}

	/**
	 * Get current food value
	 */
	public getFoodValue(): number {
		return this.foodValue;
	}

	/**
	 * Get the pet body screen-space position (x, y) for anchoring UI.
	 * Since the pet uses setScrollFactor(0), its x/y are already in screen coords.
	 */
	public getPetScreenXY(): { x: number; y: number } {
		if (this.pet) {
			return { x: this.pet.x, y: this.pet.y };
		}
		// Fallback to center-top area of the baseRect
		if (this.baseRect) {
			return { x: this.baseRect.x, y: this.baseRect.y - (this.baseRect.height as number) * 0.35 };
		}
		const cam = this.scene.cameras.main;
		return { x: cam.width / 2, y: Math.floor(cam.height * 0.15) };
	}

	/** Expose the pet body ellipse for menus */
	public getPetSprite(): Phaser.GameObjects.Ellipse | undefined {
		return this.pet;
	}
}
