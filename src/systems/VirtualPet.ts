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
	private faceSVG!: Phaser.GameObjects.Sprite; // Face emotion overlay
	private foodValue: number = 0; // 0..10
	private foodBarBG!: Phaser.GameObjects.Rectangle;
	private foodBarFill!: Phaser.GameObjects.Rectangle;
	private foodLabel!: Phaser.GameObjects.Text;
	private foodDecayTimer?: Phaser.Time.TimerEvent;
	private lastCamWidth: number = 0;
	private debugGraphics?: Phaser.GameObjects.Graphics;
	private isHovering: boolean = false;
	private petBaseColor: number = PET_CONFIG.petColor;

	// Matter.js integration
	private petBody?: MatterJS.BodyType;
	private anchorBody?: MatterJS.BodyType;
	private swayConstraint?: MatterJS.ConstraintType;
	private anchorX: number = 0;
	private anchorY: number = 0;
	private steeringListenerBound?: (value: number) => void;

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
		
		// Make container interactive to handle pet clicks (define hit area)
		// Use a rectangle covering the intended pet area
		const hitW = width > 0 ? width : Math.floor(this.scene.cameras.main.width * 0.5);
		const hitH = height > 0 ? height : Math.floor(this.scene.cameras.main.height * 0.25);
		this.container.setSize(hitW, hitH);
		this.container.setInteractive(new Phaser.Geom.Rectangle(-hitW / 2, -hitH / 2, hitW, hitH), Phaser.Geom.Rectangle.Contains);

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
		const petStartX = x - leftShift;
		const petStartY = y - Math.floor(height * 0.35);
		this.pet = this.scene.add.ellipse(petStartX, petStartY, petRadius * 2, petRadius * 2, this.petBaseColor, 1);
		this.pet.setStrokeStyle(2, 0x000000, 1);
		this.pet.setScrollFactor(0);

		// Bobbing animation removed - pets now stay in fixed positions

		// Create face SVG overlay
		this.faceSVG = this.scene.add.sprite(this.pet.x, this.pet.y, 'face-neutral');
		this.faceSVG.setScale(0.075); // 1/4 of previous size: was 0.3, now 0.075
		this.faceSVG.setOrigin(0.5, 0.5);
		this.faceSVG.setAlpha(0.9);
		this.faceSVG.setScrollFactor(0);
		this.faceSVG.setDepth(this.pet.depth + 1); // Ensure face is above the ellipse
		this.container.add(this.faceSVG);
		
		// Face SVG bobbing animation removed - face now stays in fixed position
		
		// Update face based on initial food value
		this.updateFaceEmotion();

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

		// --- Matter.js sway setup ---
		this.setupMatterSway(petStartX, petStartY, petRadius);

		// Listen to steering input to drive sway
		this.steeringListenerBound = (value: number) => this.applySteeringSway(value);
		this.scene.events.on('steeringInput', this.steeringListenerBound, this);

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
		// Cleanup Matter bodies/constraints and event listener
		if (this.steeringListenerBound) {
			this.scene.events.off('steeringInput', this.steeringListenerBound, this);
			this.steeringListenerBound = undefined;
		}
		if ((this.scene as any).matter) {
			if (this.swayConstraint) (this.scene as any).matter.world.removeConstraint(this.swayConstraint);
			if (this.petBody) (this.scene as any).matter.world.remove(this.petBody);
			if (this.anchorBody) (this.scene as any).matter.world.remove(this.anchorBody);
		}
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

		// Sync visuals to Matter body if present
		if (this.petBody) {
			const px = (this.petBody.position as any).x;
			const py = (this.petBody.position as any).y;
			this.pet.setPosition(px, py);
			this.faceSVG.setPosition(px, py);
		}

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

	// ---- Matter helpers ----
	private setupMatterSway(px: number, py: number, petRadius: number) {
		const m = (this.scene as any).matter;
		if (!m) return; // Matter disabled in this scene

		// Randomize parameters for unique pet movement
		const randomFactor = 0.7 + Math.random() * 0.6; // 0.7 to 1.3
		const dampingVariation = 0.3 + Math.random() * 0.4; // 0.3 to 0.7 (increased from 0.1-0.3)
		const stiffnessVariation = 0.01 + Math.random() * 0.02; // 0.01 to 0.03 (increased from 0.001-0.004)
		const frictionVariation = 0.03 + Math.random() * 0.06; // 0.03 to 0.09

		// Anchor is a static body at the initial pet position
		this.anchorX = px;
		this.anchorY = py;
		this.anchorBody = m.add.circle(px, py, Math.max(1, Math.floor(petRadius * 0.2)), { isStatic: true, isSensor: true, collisionFilter: { group: -2, category: 0, mask: 0 } });

		// Pet physics body (small/light, no gravity) with randomized properties
		this.petBody = m.add.circle(px, py, Math.max(6, Math.floor(petRadius * 0.5)), {
			frictionAir: frictionVariation,
			friction: 0,
			restitution: 0.2,
			isSensor: true,
			collisionFilter: { group: -2, category: 0, mask: 0 }
		});
		// Allow some vertical movement for bump effects, but keep it minimal
		(this.petBody as any).ignoreGravity = false;
		(this.petBody as any).gravityScale = 0.1; // Very light gravity

		// Soft constraint to make it sway with randomized parameters
		const constraintLength = Math.max(1, Math.floor(petRadius * 0.2 * randomFactor)); // Reduced from 0.4 to 0.2
		this.swayConstraint = m.add.constraint(this.anchorBody as any, this.petBody as any, constraintLength, stiffnessVariation, {
			damping: dampingVariation,
			stiffness: stiffnessVariation
		});
	}

	private applySteeringSway(steeringValue: number) {
		if (!this.petBody) return;
		// Map steering (-100..100) to a small lateral force
		// Reverse direction: left steering should push pets left (negative force)
		const norm = Phaser.Math.Clamp(steeringValue / 100, -1, 1);
		// Tunables for sway responsiveness
		const maxForce = 0.0008; // keep very small for subtle sway
		const forceX = -maxForce * norm; // Negative to reverse direction
		const forceY = 0;
		const m = (this.scene as any).matter;
		if (m && m.body && this.petBody) {
			m.body.applyForce(this.petBody, this.petBody.position, { x: forceX, y: forceY });
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
		this.updateFaceEmotion(); // Update face based on new food value
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

	/**
	 * Update face emotion based on food value (thirds system)
	 * 0-3: sad (frown), 4-6: neutral, 7-10: happy (smile)
	 */
	private updateFaceEmotion() {
		if (!this.faceSVG) return;

		let faceTexture: string;
		if (this.foodValue <= 3) {
			faceTexture = 'face-frown'; // Sad - low food
		} else if (this.foodValue <= 6) {
			faceTexture = 'face-neutral'; // Neutral - middle food
		} else {
			faceTexture = 'face-smile'; // Happy - high food
		}

		this.faceSVG.setTexture(faceTexture);
	}
}
