/**
 * VIRTUAL PET - INTERACTIVE PET SIMULATION
 * 
 * This module implements interactive virtual pets that players can care for
 * during the driving sequence. Each pet has its own needs, emotions, and
 * interactive behaviors.
 * 
 * Key Features:
 * - Interactive pet care system
 * - Food bar management with decay
 * - Emotional state visualization (face sprites)
 * - Hover and click interactions
 * - Responsive positioning and scaling
 * - Visual feedback for pet states
 * 
 * Pet States:
 * - Hungry: Low food value, sad face
 * - Content: Medium food value, neutral face
 * - Happy: High food value, happy face
 * 
 * The pets are positioned in the rearview mirror area and provide
 * a secondary gameplay loop for player engagement.
 */

import Phaser from 'phaser';
import { PET_CONFIG } from '../config/GameConfig';

/**
 * Configuration interface for virtual pet creation
 */
export interface VirtualPetConfig {
	width?: number;           // Pet container width
	height?: number;          // Pet container height
	backgroundColor?: number; // Background color for pet container
	petColor?: number;        // Base color for pet body
	xPercent?: number;        // Horizontal position as percentage (0..1)
	yOffset?: number;         // Vertical offset in pixels from top
	depth?: number;           // Rendering depth/layer
	petIndex?: number;        // Index of this pet (0-4) for special initialization
	scale?: number;           // Scale multiplier for pet size
}

/**
 * VirtualPet class - Interactive pet simulation
 * 
 * Manages individual pet state, interactions, and visual feedback.
 * Each pet has its own food bar, emotional state, and interactive behaviors.
 */
export class VirtualPet {
	private scene: Phaser.Scene;
	private config: VirtualPetConfig;
	private container!: Phaser.GameObjects.Container;
	private baseRect!: Phaser.GameObjects.Rectangle;
	private pet!: Phaser.GameObjects.Ellipse;
	private faceSVG!: Phaser.GameObjects.Sprite; // Face emotion overlay
	private foodValue: number = 0; // 0..10 (10 = well fed, counts down)
	private bathroomValue: number = 10; // 0..10 (10 = empty bladder, counts down)
	private boredValue: number = 0; // 0..10 (10 = entertained, counts down)
	private foodBarBG!: Phaser.GameObjects.Rectangle;
	private foodBarFill!: Phaser.GameObjects.Rectangle;
	private foodLabel!: Phaser.GameObjects.Text;
	private bathroomBarBG!: Phaser.GameObjects.Rectangle;
	private bathroomBarFill!: Phaser.GameObjects.Rectangle;
	private bathroomLabel!: Phaser.GameObjects.Text;
	private boredBarBG!: Phaser.GameObjects.Rectangle;
	private boredBarFill!: Phaser.GameObjects.Rectangle;
	private boredLabel!: Phaser.GameObjects.Text;
	private lastCamWidth: number = 0;
	private debugGraphics?: Phaser.GameObjects.Graphics;
	private isHovering: boolean = false;
	private petBaseColor: number = PET_CONFIG.petColor;

	// Messaging system
	private messageSprite?: Phaser.GameObjects.Sprite;
	private messageText?: Phaser.GameObjects.Text;
	private hasActiveMessage: boolean = false;
	private messageThresholds: number[] = [3.0, 2.0, 1.5, 1.0, 0.5, 0.3, 0.2]; // 30%, 20%, 15%, 10%, 5%, 3%, 2%
	private lastMessageThreshold: number = 10.0; // Track last threshold that triggered a message
	private messageStepsRemaining: number = 0; // Half-steps until message disappears
	private messageStepTimer?: Phaser.Time.TimerEvent;
	private messageStartX: number = 0; // Starting X position for movement calculation
	private messageStartY: number = 0; // Starting Y position for movement calculation
	private messageType: string = ''; // Track which meter triggered the message

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
		
		// Initialize all meters to 100% (10.0)
		this.foodValue = 10.0;
		this.bathroomValue = 10.0;
		this.boredValue = 10.0;
		
		// Add controlled randomness: subtract 0.1-0.5 from all meters
		this.foodValue = Math.max(0, this.foodValue - Phaser.Math.FloatBetween(0.1, 0.5));
		this.bathroomValue = Math.max(0, this.bathroomValue - Phaser.Math.FloatBetween(0.1, 0.5));
		this.boredValue = Math.max(0, this.boredValue - Phaser.Math.FloatBetween(0.1, 0.5));
		
		// Apply special values for specific pets
		if (config.petIndex !== undefined) {
			this.applySpecialPetValues(config.petIndex);
		}
	}

	/**
	 * Apply special values for specific pets
	 * Pet 1 (index 0): boredom at 60%
	 * Pet 3 (index 2): bathroom at 60%
	 * Pet 5 (index 4): food at 60%
	 */
	private applySpecialPetValues(petIndex: number) {
		switch (petIndex) {
			case 0: // Pet 1: boredom at 60%
				this.boredValue = 6.0;
				break;
			case 2: // Pet 3: bathroom at 60%
				this.bathroomValue = 6.0;
				break;
			case 4: // Pet 5: food at 60%
				this.foodValue = 6.0;
				break;
		}
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

		// Create face SVG overlay (will be added to container after pet ellipse)
		this.faceSVG = this.scene.add.sprite(this.pet.x, this.pet.y, 'face-neutral');
		this.faceSVG.setScale(0.075); // 1/4 of previous size: was 0.3, now 0.075
		this.faceSVG.setOrigin(0.5, 0.5);
		this.faceSVG.setAlpha(0.9);
		this.faceSVG.setScrollFactor(0);
		this.faceSVG.setDepth(this.pet.depth + 1); // Ensure face is above the ellipse
		
		// Apply white fill and black stroke styling
		this.faceSVG.setTint(0xffffff); // White fill
		
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
		
		// Add face SVG after pet ellipse to ensure it renders on top
		this.container.add(this.faceSVG);
		
		// Create a separate invisible interactive circle over the pet
		const clickArea = this.scene.add.circle(x - leftShift, y - Math.floor(height * 0.35), petRadius, 0x000000, 0);
		clickArea.setInteractive();
		clickArea.setScrollFactor(0);
		clickArea.setDepth(40001); // Above rearview mirror but below steering dial
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

		// Food/Bathroom/Bored meters (labels + bars) alongside the pet (track their positions)
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

		// Bathroom meter just below Food
		const bathY = barY + 14;
		this.bathroomLabel = this.scene.add.text(barX - 46, bathY - 9, 'BATH', {
			fontSize: '12px',
			color: '#ffffff',
			fontStyle: 'bold'
		});
		this.bathroomLabel.setScrollFactor(0);
		this.bathroomLabel.setVisible(false);
		this.bathroomBarBG = this.scene.add.rectangle(barX + Math.floor(barWidth / 2), bathY, barWidth, barHeight, 0x000000, 0.6);
		this.bathroomBarBG.setStrokeStyle(1, 0xffffff, 0.8);
		this.bathroomBarBG.setScrollFactor(0);
		this.bathroomBarBG.setVisible(false);
		this.bathroomBarFill = this.scene.add.rectangle(barX - Math.floor(barWidth / 2), bathY, Math.floor(barWidth * (this.bathroomValue / 10)), barHeight - 2, 0x3498db, 1).setOrigin(0, 0.5);
		this.bathroomBarFill.setScrollFactor(0);
		this.bathroomBarFill.setVisible(false);

		// Bored meter below Bathroom
		const boredY = bathY + 14;
		this.boredLabel = this.scene.add.text(barX - 46, boredY - 9, 'BORED', {
			fontSize: '12px',
			color: '#ffffff',
			fontStyle: 'bold'
		});
		this.boredLabel.setScrollFactor(0);
		this.boredLabel.setVisible(false);
		this.boredBarBG = this.scene.add.rectangle(barX + Math.floor(barWidth / 2), boredY, barWidth, barHeight, 0x000000, 0.6);
		this.boredBarBG.setStrokeStyle(1, 0xffffff, 0.8);
		this.boredBarBG.setScrollFactor(0);
		this.boredBarBG.setVisible(false);
		this.boredBarFill = this.scene.add.rectangle(barX - Math.floor(barWidth / 2), boredY, Math.floor(barWidth * (this.boredValue / 10)), barHeight - 2, 0x9b59b6, 1).setOrigin(0, 0.5);
		this.boredBarFill.setScrollFactor(0);
		this.boredBarFill.setVisible(false);

		this.container.add([this.foodLabel, this.foodBarBG, this.foodBarFill, this.bathroomLabel, this.bathroomBarBG, this.bathroomBarFill, this.boredLabel, this.boredBarBG, this.boredBarFill]);

		// Debug graphics (hidden by default)
		this.debugGraphics = this.scene.add.graphics();
		this.debugGraphics.setScrollFactor(0);
		this.container.add(this.debugGraphics);

		// --- Matter.js sway setup ---
		this.setupMatterSway(petStartX, petStartY, petRadius);

		// Listen to steering input to drive sway
		this.steeringListenerBound = (value: number) => this.applySteeringSway(value);
		this.scene.events.on('steeringInput', this.steeringListenerBound, this);

		// Listen for countdown events to trigger meter decay
		this.scene.events.on('countdownChanged', () => {
			this.processCountdownDecay();
		});
	}

	/**
	 * Process meter decay on each countdown tick using individual pet decay rates
	 */
	private processCountdownDecay() {
		// Get individual decay rates for this pet from config
		const petIndex = this.config.petIndex || 0;
		const decayRates = PET_CONFIG.petDecayRates[petIndex];
		
		if (!decayRates) {
			console.warn(`VirtualPet: No decay rates found for pet index ${petIndex}, using defaults`);
			// Fallback to default rates if config is missing
			this.setFood(this.foodValue - 0.05);
			this.setBathroom(this.bathroomValue - 0.04);
			this.setBored(this.boredValue - 0.045);
			return;
		}

		// Apply individual decay rates for this pet
		this.setFood(this.foodValue - decayRates.food);
		this.setBathroom(this.bathroomValue - decayRates.bathroom);
		this.setBored(this.boredValue - decayRates.boredom);
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
		
		// Cleanup message sprite
		this.removeMessageSprite();
		
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
				// Resize other bars
				if (this.bathroomBarBG && this.bathroomBarFill) {
					this.bathroomBarBG.width = newBarWidth;
					const bclamped = Phaser.Math.Clamp(this.bathroomValue, 0, 10);
					this.bathroomBarFill.width = Math.max(0, Math.floor(newBarWidth * (bclamped / 10)) - 2);
				}
				if (this.boredBarBG && this.boredBarFill) {
					this.boredBarBG.width = newBarWidth;
					const xclamped = Phaser.Math.Clamp(this.boredValue, 0, 10);
					this.boredBarFill.width = Math.max(0, Math.floor(newBarWidth * (xclamped / 10)) - 2);
				}
			}
			const barX = this.pet.x + petRadius + 12;
			const barY = this.pet.y;
			this.foodBarBG.setPosition(barX, barY);
			this.foodBarFill.setPosition(barX - Math.floor(this.foodBarBG.width / 2), barY);
			this.foodLabel.setPosition(barX - 46, barY - 9);
			// Position other meters
			const bathY = barY + 14;
			this.bathroomBarBG?.setPosition(barX, bathY);
			this.bathroomBarFill?.setPosition(barX - Math.floor((this.bathroomBarBG?.width as number) / 2), bathY);
			this.bathroomLabel?.setPosition(barX - 46, bathY - 9);
			const boredY = bathY + 14;
			this.boredBarBG?.setPosition(barX, boredY);
			this.boredBarFill?.setPosition(barX - Math.floor((this.boredBarBG?.width as number) / 2), boredY);
			this.boredLabel?.setPosition(barX - 46, boredY - 9);
		}
	}

	// ---- Matter helpers ----
	private setupMatterSway(px: number, py: number, petRadius: number) {
		const m = (this.scene as any).matter;
		if (!m) return; // Matter disabled in this scene

		// Randomize parameters for unique pet movement
		const randomFactor = 0.7 + Math.random() * 0.6; // 0.7 to 1.3
		const dampingVariation = 0.5 + Math.random() * 0.4; // 0.5 to 0.9 (even higher damping)
		const stiffnessVariation = 0.02 + Math.random() * 0.03; // 0.02 to 0.05 (even higher stiffness)
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
			collisionFilter: { group: -2, category: 0, mask: 0 },
			mass: 10, // Much heavier mass to resist movement
			inertia: 1000 // High inertia to resist rotation
		});
		// Allow some vertical movement for bump effects, but keep it minimal
		(this.petBody as any).ignoreGravity = false;
		(this.petBody as any).gravityScale = 0.1; // Very light gravity

		// Soft constraint to make it sway with randomized parameters
		const constraintLength = Math.max(1, Math.floor(petRadius * 0.1 * randomFactor)); // Even shorter constraint (was 0.2)
		this.swayConstraint = m.add.constraint(this.anchorBody as any, this.petBody as any, constraintLength, stiffnessVariation, {
			damping: dampingVariation,
			stiffness: stiffnessVariation
		});
	}

	private applySteeringSway(steeringValue: number) {
		if (!this.petBody) return;
		// Map steering (-150..150) to a small lateral force
		// Reverse direction: left steering should push pets left (negative force)
		const norm = Phaser.Math.Clamp(steeringValue / 150, -1, 1); // Updated to match new range
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

	private refreshBathroomBar() {
		if (!this.bathroomBarBG || !this.bathroomBarFill) return;
		const totalWidth = this.bathroomBarBG.width;
		const clamped = Phaser.Math.Clamp(this.bathroomValue, 0, 10);
		this.bathroomBarFill.width = Math.max(0, Math.floor(totalWidth * (clamped / 10)) - 2);
		// Blue shades: high = fine, low = urgent
		const color = clamped > 6 ? 0x3498db : (clamped > 3 ? 0x5dade2 : 0x1f618d);
		this.bathroomBarFill.fillColor = color as any;
	}

	private refreshBoredBar() {
		if (!this.boredBarBG || !this.boredBarFill) return;
		const totalWidth = this.boredBarBG.width;
		const clamped = Phaser.Math.Clamp(this.boredValue, 0, 10);
		this.boredBarFill.width = Math.max(0, Math.floor(totalWidth * (clamped / 10)) - 2);
		// Purple shades: high = engaged, low = bored
		const color = clamped > 6 ? 0x9b59b6 : (clamped > 3 ? 0xbb8fce : 0x6c3483);
		this.boredBarFill.fillColor = color as any;
	}

	/**
	 * Create a message sprite below the pet when any meter is low
	 */
	private createMessageSprite() {
		if (this.hasActiveMessage || !this.pet) return;

		// Store starting position for movement calculation
		this.messageStartX = this.pet.x;
		this.messageStartY = this.pet.y + 40; // Position below the pet

		// Create a simple message sprite (using a circle for now)
		this.messageSprite = this.scene.add.circle(
			this.messageStartX, 
			this.messageStartY,
			8, // radius
			0xff0000, // red color
			0.8 // alpha
		);
		
		this.messageSprite.setScrollFactor(0); // Keep it on screen
		this.messageSprite.setDepth(this.config.depth ? this.config.depth + 1000 : 80000);
		
		// Create text label for the message
		this.messageText = this.scene.add.text(
			this.messageStartX,
			this.messageStartY,
			this.messageType.toUpperCase(), // Show which meter triggered the message
			{
				fontSize: '12px',
				color: '#ffffff',
				fontStyle: 'bold',
				align: 'center'
			}
		);
		this.messageText.setOrigin(0.5, 0.5); // Center the text
		this.messageText.setScrollFactor(0); // Keep it on screen
		this.messageText.setDepth(this.config.depth ? this.config.depth + 1001 : 80001); // Above the circle
		
		// Add to container if it exists
		if (this.container) {
			this.container.add(this.messageSprite);
			this.container.add(this.messageText);
		}

		this.hasActiveMessage = true;
		this.messageStepsRemaining = 8; // Message lasts 8 half-steps (4 full steps)

		console.log(`Pet ${this.config.petIndex}: Created ${this.messageType} message at threshold ${this.lastMessageThreshold}`);

		// Start half-step timer to animate message movement and fade
		this.messageStepTimer = this.scene.time.addEvent({
			delay: 1000, // Each half-step is 1 second
			loop: true,
			callback: () => {
				this.messageStepsRemaining--;
				this.updateMessageAnimation();
				
				if (this.messageStepsRemaining <= 0) {
					this.removeMessageSprite();
				}
			}
		});
	}

	/**
	 * Update message animation (movement and fade) on each half-step
	 */
	private updateMessageAnimation() {
		if (!this.messageSprite || !this.messageText) return;

		const totalSteps = 8; // Total half-steps
		const currentStep = totalSteps - this.messageStepsRemaining;
		const progress = currentStep / totalSteps; // 0 to 1

		// Calculate movement: slowly move down from pet
		const moveDistance = 30; // Total distance to move down
		const moveX = this.messageStartX; // Stay at same X position
		const moveY = this.messageStartY + (moveDistance * progress); // Move straight down

		// Calculate fade: gradually fade out
		const startAlpha = 0.8;
		const endAlpha = 0.0;
		const currentAlpha = startAlpha - (startAlpha - endAlpha) * progress;

		// Apply changes to both sprite and text
		this.messageSprite.setPosition(moveX, moveY);
		this.messageSprite.setAlpha(currentAlpha);
		this.messageText.setPosition(moveX, moveY);
		this.messageText.setAlpha(currentAlpha);
	}

	/**
	 * Remove the message sprite
	 */
	private removeMessageSprite() {
		console.log(`Pet ${this.config.petIndex}: Removing ${this.messageType} message (cleanup verification)`);
		
		if (this.messageSprite) {
			this.messageSprite.destroy();
			this.messageSprite = undefined;
			console.log(`  -> Message sprite destroyed`);
		}
		
		if (this.messageText) {
			this.messageText.destroy();
			this.messageText = undefined;
			console.log(`  -> Message text destroyed`);
		}
		
		// Clean up step timer
		if (this.messageStepTimer) {
			this.messageStepTimer.remove();
			this.messageStepTimer = undefined;
			console.log(`  -> Message timer removed`);
		}
		
		this.hasActiveMessage = false;
		this.messageStepsRemaining = 0;
		this.messageType = '';
		
		console.log(`  -> Message cleanup completed for pet ${this.config.petIndex}`);
	}

	/**
	 * Check if any meter has crossed a message threshold and show message if needed
	 */
	private checkAndShowMessage() {
		const lowestMeter = Math.min(this.foodValue, this.bathroomValue, this.boredValue);
		
		// Determine which meter is the lowest
		let lowestMeterType = '';
		if (this.foodValue === lowestMeter) {
			lowestMeterType = 'food';
		} else if (this.bathroomValue === lowestMeter) {
			lowestMeterType = 'bath';
		} else if (this.boredValue === lowestMeter) {
			lowestMeterType = 'bored';
		}
		
		// Find the first threshold we've crossed under (first time going under each threshold)
		let crossedThreshold = -1;
		for (let i = 0; i < this.messageThresholds.length; i++) {
			const threshold = this.messageThresholds[i];
			// Check if we're under this threshold AND we haven't triggered a message for it yet
			if (lowestMeter < threshold && threshold < this.lastMessageThreshold) {
				crossedThreshold = threshold;
				break; // Use the first (highest) threshold we cross under
			}
		}
		
		// Only show message if we've crossed a new threshold (to prevent spam)
		if (crossedThreshold > 0 && !this.hasActiveMessage) {
			this.lastMessageThreshold = crossedThreshold;
			this.messageType = lowestMeterType;
			this.createMessageSprite();
		}
		
		// Reset threshold tracking when meters recover above the highest threshold
		if (lowestMeter >= 3.0 && this.lastMessageThreshold < 10.0) {
			this.lastMessageThreshold = 10.0;
		}
	}

	/**
	 * Debug method to manually trigger a message for testing
	 */
	public triggerDebugMessage() {
		console.log(`Pet ${this.config.petIndex}: Triggering debug message`);
		this.messageType = 'debug'; // Set a debug message type
		this.createMessageSprite();
	}

	public setFood(value: number) {
		this.foodValue = Phaser.Math.Clamp(value, 0, 10);
		this.refreshFoodBar();
		this.updateFaceEmotion(); // Update face based on new food value
		this.checkAndShowMessage(); // Check if we need to show a message
	}

	public setBathroom(value: number) {
		this.bathroomValue = Phaser.Math.Clamp(value, 0, 10);
		this.refreshBathroomBar();
		this.updateFaceEmotion(); // Update face based on new bathroom value
		this.checkAndShowMessage(); // Check if we need to show a message
	}

	public setBored(value: number) {
		this.boredValue = Phaser.Math.Clamp(value, 0, 10);
		this.refreshBoredBar();
		this.updateFaceEmotion(); // Update face based on new boredom value
		this.checkAndShowMessage(); // Check if we need to show a message
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
				
				// Also reduce bathroom value (feeding helps with bathroom needs)
				const bathroomReduction = amount * 0.5; // Half the food amount
				const bathroomStart = this.bathroomValue;
				const bathroomTarget = Phaser.Math.Clamp(bathroomStart - bathroomReduction, 0, 10);
				const bathroomValue = Phaser.Math.Linear(bathroomStart, bathroomTarget, eased);
				this.setBathroom(bathroomValue);
				
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

	public getBathroomMeterElements(): { label: Phaser.GameObjects.Text, background: Phaser.GameObjects.Rectangle, fill: Phaser.GameObjects.Rectangle } {
		return {
			label: this.bathroomLabel,
			background: this.bathroomBarBG,
			fill: this.bathroomBarFill
		};
	}

	public getBoredMeterElements(): { label: Phaser.GameObjects.Text, background: Phaser.GameObjects.Rectangle, fill: Phaser.GameObjects.Rectangle } {
		return {
			label: this.boredLabel,
			background: this.boredBarBG,
			fill: this.boredBarFill
		};
	}

	/**
	 * Get current food value
	 */
	public getFoodValue(): number {
		return this.foodValue;
	}

	/**
	 * Get current bathroom value
	 */
	public getBathroomValue(): number {
		return this.bathroomValue;
	}

	/**
	 * Get current bored value
	 */
	public getBoredValue(): number {
		return this.boredValue;
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
	 * Update face emotion based on lowest meter (overall pet state)
	 * Uses the lowest of food, bathroom, or boredom meters
	 * 0-3: sad (frown), 4-6: neutral, 7-10: happy (smile)
	 */
	private updateFaceEmotion() {
		if (!this.faceSVG) return;

		// Find the lowest meter to determine overall pet state
		const lowestMeter = Math.min(this.foodValue, this.bathroomValue, this.boredValue);

		let faceTexture: string;
		if (lowestMeter <= 3) {
			faceTexture = 'face-frown'; // Sad - any meter is low
		} else if (lowestMeter <= 6) {
			faceTexture = 'face-neutral'; // Neutral - any meter is medium
		} else {
			faceTexture = 'face-smile'; // Happy - all meters are high
		}

		this.faceSVG.setTexture(faceTexture);
	}
}
