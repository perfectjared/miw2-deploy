/**
 * GAME CONFIGURATION - CENTRALIZED PARAMETERS
 * 
 * This file contains all configurable parameters for the game.
 * Values are organized by system and can be easily modified here.
 * 
 * Key Benefits:
 * - Single source of truth for all game parameters
 * - Easy to find and modify values
 * - Consistent configuration across all systems
 * - Clear documentation of what each parameter does
 */

import { gameElements, GameElementsConfig } from './GameElements';

// Re-export for convenience
export { gameElements, type GameElementsConfig };

// ============================================================================
// GREYSCALE COLOR PALETTE
// ============================================================================

export const GREYSCALE_PALETTE = {
  // 8 different shades of grey from lightest to darkest
  white: 0xffffff,      // Pure white
  lightGray: 0xcccccc,   // Very light grey
  mediumLightGray: 0x999999, // Medium light grey
  mediumGray: 0x666666,  // Medium grey
  mediumDarkGray: 0x444444, // Medium dark grey
  darkGray: 0x333333,    // Dark grey
  darkerGray: 0x222222,  // Darker grey
  black: 0x000000       // Pure black
} as const;

// ============================================================================
// CAR MECHANICS CONFIGURATION
// ============================================================================

export const CAR_CONFIG = {
  // Car Movement
  carMaxSpeed: 5,
  minCrankForSteering: 0.40,
  minSpeedForSteering: 0.01,
  steeringSensitivity: 1.0,
  maxTurn: 1.5, // Increased from 1.0 to allow more steering power
  turnResetMultiplier: 0.1,
  centrifugal: 2.0,
  
  // Steering Turn Gain (distance-based)
  baseTurnGain: 0.3,         // Minimum turn gain at center
  maxTurnGain: 2.0,          // Increased from 1.5 to 2.0 for easier extremes
  turnGainPower: 0.5,        // Power curve exponent (0.5 = square root - easier extremes)
  
  // Car Momentum & Stability
  turnDecayRate: 0.01,       // How quickly turn decays when not steering (much lower = more momentum)
  centerReturnForce: 0.0,    // Force pulling car back to center (0 = no center return)
  lateralFriction: 0.99,     // Lateral friction/drag (higher = less slidey)
  
  // Visual Appearance - using greyscale palette
  skyColor: GREYSCALE_PALETTE.black,
  roadColor: GREYSCALE_PALETTE.mediumGray,
  boundaryPadding: 50, // Increased to allow more car movement range
  roadDepth: -1000,
  lineWidth: 4,
  lineHeight: 30,
  lineGap: 40,
  centerLineYOffset: 50,
  lineDepth: -1000,
  
  // Obstacle Settings
  obstacleMinDelayMs: 9000,
  obstacleMaxDelayMs: 18000,
  potholeProbability: 0.5, // Temporarily lowered to test exit spawning
  potholeWidth: 0.3,
  potholeHeight: 0.08,
  potholeMinPos: 0.45,
  potholeMaxPos: 0.55,
  potholeSpawnY: 0.2,
  potholeColor: GREYSCALE_PALETTE.black,
  potholeSpeed: 1.2,
  
  // Exit Settings
  exitWidth: 30,
  exitHeight: 60,
  exitPosition: 0.9,
  exitSpawnY: 0.1,
  exitColor: GREYSCALE_PALETTE.white,
  exitSpeed: 1.0,
  
  // Debug/Radar Settings
  radarEnabled: false, // Disabled for cleaner UI
  radarX: 0, // Will be set dynamically
  radarY: 10,
  radarWidth: 33,
  radarHeight: 163,
  radarAlpha: 0.75,
  roadBendStrength: 200, // Increased from 140 to make road curves more pronounced
  lensStrength: 1.5, // Increased from 1.0 to create even stronger fisheye spread
  useLowRes: false,
  lowResScale: 0.5
} as const;

// ============================================================================
// TUTORIAL SYSTEM CONFIGURATION
// ============================================================================

export const TUTORIAL_CONFIG = {
  overlayColor: GREYSCALE_PALETTE.black,
  overlayAlpha: 0.7,
  overlayDepth: 90000,
  maskColor: GREYSCALE_PALETTE.white,
  keysHoleRadius: 30,
  targetHoleMultiplier: 1.5,
  magneticTargetX: 200,        // DEPRECATED: use gameElements.getMagneticTarget()
  magneticTargetY: 550,        // DEPRECATED: use gameElements.getMagneticTarget()
  magneticTargetRadius: 25     // DEPRECATED: use gameElements.getMagneticTarget()
} as const;

// ============================================================================
// UI LAYOUT & POSITIONING - ALL UI ELEMENT PLACEMENT IN ONE PLACE
// ============================================================================

export const UI_LAYOUT = {
  // ============================================================================
  // POSITIONING (Percentages of screen dimensions)
  // ============================================================================
  
  // Top-left corner elements
  gameLayerX: 0.02,           // 2% from left edge
  gameLayerY: 0.02,           // 2% from top edge
  moneyX: 0.02,               // 2% from left edge
  moneyY: 0.98,               // 8% from top edge
  healthX: 0.02,              // 2% from left edge
  healthY: 0.12,              // 12% from top edge
  
  // Top-right corner elements
  managerValuesX: 0.98,       // 98% from left edge (right-aligned)
  managerValuesY: 0.02,       // 2% from top edge
  
  // Center elements
  countdownX: 0.5,            // 50% from left edge (centered)
  countdownY: 0.15,           // 15% from top edge (moved up from 20%)
  
  // Bottom elements
  progressX: 0.02,            // 2% from left edge
  progressY: 0.92,            // 92% from top edge (moved up from 95%)
  
  // Rearview rectangle (virtual pets) - now managed by GameElements config
  rearviewX: 0.55,             // 50% from left edge (centered) - DEPRECATED: use gameElements.getRearviewMirror()
  rearviewY: 0.035,            // 3.5% from top edge (30% less low than 5%) - DEPRECATED: use gameElements.getRearviewMirror()
  rearviewWidth: 0.92,        // 85% of screen width - DEPRECATED: use gameElements.getRearviewMirror()
  rearviewHeight: 0.4,       // 20% of screen height - DEPRECATED: use gameElements.getRearviewMirror()
  
  // ============================================================================
  // SIZING (Font sizes, dimensions, etc.)
  // ============================================================================
  
  // Font sizes
  gameLayerFontSize: '14px',
  moneyHealthFontSize: '16px',
  countdownFontSize: '36px',
  progressFontSize: '18px',
  managerValuesFontSize: '12px',
  
  // Depths (z-order)
  gameLayerDepth: 1000,
  moneyHealthDepth: 10000,
  countdownDepth: 10000,
  progressDepth: 10000,
  managerValuesDepth: 10000,
  rearviewDepth: 70000,
  
  // Padding and spacing
  managerValuesPadding: { x: 10, y: 5 },
  textPadding: { x: 4, y: 2 },
  
  // ============================================================================
  // COLORS & STYLING
  // ============================================================================
  
  // Text colors - using greyscale palette
  gameLayerColor: GREYSCALE_PALETTE.white,
  moneyColor: GREYSCALE_PALETTE.lightGray,
  healthColor: GREYSCALE_PALETTE.mediumGray,
  countdownColor: GREYSCALE_PALETTE.white,
  progressColor: GREYSCALE_PALETTE.white,
  
  // Background colors - using greyscale palette
  gameLayerBackgroundColor: GREYSCALE_PALETTE.black,
  managerValuesBackgroundColor: GREYSCALE_PALETTE.black,
  rearviewBackgroundColor: GREYSCALE_PALETTE.darkerGray,
  rearviewBackgroundAlpha: 0.9,
  rearviewStrokeColor: GREYSCALE_PALETTE.white,
  
  // Manager values colors - using greyscale palette
  managerValuesSkillColor: GREYSCALE_PALETTE.lightGray,
  managerValuesDifficultyColor: GREYSCALE_PALETTE.mediumGray,
  managerValuesMomentumColor: GREYSCALE_PALETTE.mediumLightGray,
  managerValuesPlotAColor: GREYSCALE_PALETTE.mediumGray,
  managerValuesPlotBColor: GREYSCALE_PALETTE.mediumLightGray,
  managerValuesPlotCColor: GREYSCALE_PALETTE.mediumDarkGray,
  managerValuesStopsColor: GREYSCALE_PALETTE.white,
  
  // Opacity
  managerValuesOpacity: 0.8,
  
  // ============================================================================
  // TEXT CONTENT
  // ============================================================================
  
  gameLayerText: '(game)',
  frontseatText: 'look up',
  backseatText: 'look down',
  
  // ============================================================================
  // BUTTON STYLING
  // ============================================================================
  
  buttonPadding: 10,
  buttonCornerRadius: 5,
  buttonBackgroundColor: GREYSCALE_PALETTE.darkGray,
  buttonHoverColor: GREYSCALE_PALETTE.mediumDarkGray,
  frontseatFontSize: '18px',
  backseatFontSize: '18px',
  frontseatColor: GREYSCALE_PALETTE.white,
  backseatColor: GREYSCALE_PALETTE.white,
  
  // Speed Crank Styling
  speedCrankOffsetX: 120,
  speedCrankOffsetY: -20,
  speedCrankWidth: 40,
  speedCrankHeight: 150,
  speedCrankTrackColor: GREYSCALE_PALETTE.darkGray,
  speedCrankTrackAlpha: 0.8,
  speedCrankTrackStrokeColor: GREYSCALE_PALETTE.white,
  speedCrankTrackStrokeWidth: 2,
  speedCrankTrackCornerRadius: 5,
  speedCrankHandleColor: GREYSCALE_PALETTE.mediumLightGray,
  speedCrankHandleAlpha: 0.9,
  speedCrankHandleStrokeColor: GREYSCALE_PALETTE.white,
  speedCrankHandleStrokeWidth: 1,
  speedCrankHandleCornerRadius: 3,
  speedCrankHandleMargin: 4,
  speedCrankHandleHeight: 20,
  speedCrankIndicatorColor: GREYSCALE_PALETTE.white,
  speedCrankIndicatorStrokeColor: GREYSCALE_PALETTE.black,
  speedCrankIndicatorRadius: 3,
  speedCrankTextOffsetX: 10,
  speedCrankTextFontSize: '16px',
  speedCrankTextColor: GREYSCALE_PALETTE.white,
  speedCrankSnapPositions: [0, 0.4, 0.7, 1.0],
  speedCrankDepthTrack: 1000,
  speedCrankDepthHandle: 1001,
  speedCrankDepthIndicator: 1002,
  speedCrankDepthText: 1003,
  speedCrankDepthArea: 1004
} as const;

// ============================================================================
// GAME UI CONFIGURATION (Legacy compatibility)
// ============================================================================

export const UI_CONFIG = {
  // Text Display
  gameLayerText: UI_LAYOUT.gameLayerText,
  gameLayerPositionX: UI_LAYOUT.gameLayerX,
  gameLayerPositionY: UI_LAYOUT.gameLayerY,
  gameLayerFontSize: UI_LAYOUT.gameLayerFontSize,
  gameLayerColor: UI_LAYOUT.gameLayerColor,
  gameLayerBackgroundColor: UI_LAYOUT.gameLayerBackgroundColor,
  gameLayerDepth: UI_LAYOUT.gameLayerDepth,
  
  // Text Player Configuration
  textDisplayDelayMs: 100, // Brief pause before showing all text at once (easily adjustable)
  
  // Countdown Timer
  countdownPositionX: UI_LAYOUT.countdownX,
  countdownPositionY: UI_LAYOUT.countdownY,
  countdownFontSize: UI_LAYOUT.countdownFontSize,
  countdownColor: UI_LAYOUT.countdownColor,
  
  // Money/Health Display
  moneyPositionX: UI_LAYOUT.moneyX,
  moneyPositionY: UI_LAYOUT.moneyY,
  healthPositionX: UI_LAYOUT.healthX,
  healthPositionY: UI_LAYOUT.healthY,
  moneyHealthFontSize: UI_LAYOUT.moneyHealthFontSize,
  moneyColor: UI_LAYOUT.moneyColor,
  healthColor: UI_LAYOUT.healthColor,
  
  // Progress Display
  progressPositionX: UI_LAYOUT.progressX,
  progressPositionY: UI_LAYOUT.progressY,
  progressFontSize: UI_LAYOUT.progressFontSize,
  progressColor: UI_LAYOUT.progressColor,
  
  // Manager Values
  managerValuesFontSize: UI_LAYOUT.managerValuesFontSize,
  managerValuesBackgroundColor: UI_LAYOUT.managerValuesBackgroundColor,
  managerValuesPadding: UI_LAYOUT.managerValuesPadding,
  managerValuesOpacity: UI_LAYOUT.managerValuesOpacity,
  managerValuesSkillColor: UI_LAYOUT.managerValuesSkillColor,
  managerValuesDifficultyColor: UI_LAYOUT.managerValuesDifficultyColor,
  managerValuesMomentumColor: UI_LAYOUT.managerValuesMomentumColor,
  managerValuesPlotAColor: UI_LAYOUT.managerValuesPlotAColor,
  managerValuesPlotBColor: UI_LAYOUT.managerValuesPlotBColor,
  managerValuesPlotCColor: UI_LAYOUT.managerValuesPlotCColor,
  managerValuesStopsColor: UI_LAYOUT.managerValuesStopsColor,
  
  // Navigation Buttons
  frontseatText: UI_LAYOUT.frontseatText,
  frontseatPositionX: 0,
  frontseatPositionY: 0,
  frontseatFontSize: UI_LAYOUT.frontseatFontSize,
  frontseatColor: UI_LAYOUT.frontseatColor,
  
  backseatText: UI_LAYOUT.backseatText,
  backseatPositionX: 0,
  backseatPositionY: 0,
  backseatFontSize: UI_LAYOUT.backseatFontSize,
  backseatColor: UI_LAYOUT.backseatColor,
  
  // Button Styling
  buttonPadding: UI_LAYOUT.buttonPadding,
  buttonCornerRadius: UI_LAYOUT.buttonCornerRadius,
  buttonBackgroundColor: UI_LAYOUT.buttonBackgroundColor,
  buttonHoverColor: UI_LAYOUT.buttonHoverColor,
  
  // Speed Crank Properties
  speedCrankOffsetX: UI_LAYOUT.speedCrankOffsetX,
  speedCrankOffsetY: UI_LAYOUT.speedCrankOffsetY,
  speedCrankWidth: UI_LAYOUT.speedCrankWidth,
  speedCrankHeight: UI_LAYOUT.speedCrankHeight,
  speedCrankTrackColor: UI_LAYOUT.speedCrankTrackColor,
  speedCrankTrackAlpha: UI_LAYOUT.speedCrankTrackAlpha,
  speedCrankTrackStrokeColor: UI_LAYOUT.speedCrankTrackStrokeColor,
  speedCrankTrackStrokeWidth: UI_LAYOUT.speedCrankTrackStrokeWidth,
  speedCrankTrackCornerRadius: UI_LAYOUT.speedCrankTrackCornerRadius,
  speedCrankHandleColor: UI_LAYOUT.speedCrankHandleColor,
  speedCrankHandleAlpha: UI_LAYOUT.speedCrankHandleAlpha,
  speedCrankHandleStrokeColor: UI_LAYOUT.speedCrankHandleStrokeColor,
  speedCrankHandleStrokeWidth: UI_LAYOUT.speedCrankHandleStrokeWidth,
  speedCrankHandleCornerRadius: UI_LAYOUT.speedCrankHandleCornerRadius,
  speedCrankHandleMargin: UI_LAYOUT.speedCrankHandleMargin,
  speedCrankHandleHeight: UI_LAYOUT.speedCrankHandleHeight,
  speedCrankIndicatorColor: UI_LAYOUT.speedCrankIndicatorColor,
  speedCrankIndicatorStrokeColor: UI_LAYOUT.speedCrankIndicatorStrokeColor,
  speedCrankIndicatorRadius: UI_LAYOUT.speedCrankIndicatorRadius,
  speedCrankTextOffsetX: UI_LAYOUT.speedCrankTextOffsetX,
  speedCrankTextFontSize: UI_LAYOUT.speedCrankTextFontSize,
  speedCrankTextColor: UI_LAYOUT.speedCrankTextColor,
  speedCrankSnapPositions: UI_LAYOUT.speedCrankSnapPositions,
  speedCrankDepthTrack: UI_LAYOUT.speedCrankDepthTrack,
  speedCrankDepthHandle: UI_LAYOUT.speedCrankDepthHandle,
  speedCrankDepthIndicator: UI_LAYOUT.speedCrankDepthIndicator,
  speedCrankDepthText: UI_LAYOUT.speedCrankDepthText,
  speedCrankDepthArea: UI_LAYOUT.speedCrankDepthArea
} as const;

// ============================================================================
// MENU SYSTEM CONFIGURATION
// ============================================================================

export const MENU_CONFIG = {
  // Slider Parameters
  sliderWidth: 200,
  sliderHeight: 20,
  sliderYOffset: 50,
  sliderTrackColor: 0x333333,
  sliderCornerRadius: 10,
  sliderHandleWidth: 20,
  sliderHandleHeight: 20,
  sliderHandleColor: 0x666666,
  sliderHandleCornerRadius: 10,
  
  // Depths
  sliderTrackDepth: 1000,
  sliderHandleDepth: 1001,
  labelsDepth: 1002,
  meterDepth: 1003,
  
  // Labels
  startLabelOffset: 30,
  turnKeyLabelOffset: -30,
  labelsFontSize: '16px',
  labelsColor: '#ffffff',
  
  // Meter Parameters
  meterWidth: 150,
  meterHeight: 10,
  meterYOffset: 80,
  meterBackgroundColor: 0x222222,
  meterCornerRadius: 5,
  meterFillColor: 0x00ff00,
  meterTextOffset: 20,
  
  // Physics Parameters
  momentumDecay: 0.95,
  maxVelocity: 15,
  gravity: 0.3,
  sensitivity: 0.5,
  startThreshold: 0.9,
  startIncrement: 0.5,
  startMax: 20
} as const;

// ============================================================================
// VIRTUAL PET CONFIGURATION
// ============================================================================

export const PET_CONFIG = {
  // Pet Appearance
  petColor: 0xffcc66,
  petRadius: 25,
  petStrokeColor: 0x000000,
  petStrokeWidth: 2,
  
  // Container Settings (used in GameScene)
  containerWidth: 0.85, // Percentage of screen width
  containerHeight: 0.20, // Percentage of screen height
  containerBackgroundColor: 0x222222,
  containerBackgroundAlpha: 0.9,
  containerStrokeColor: 0xffffff,
  containerStrokeWidth: 2
} as const;

// ============================================================================
// GAME STATE CONFIGURATION
// ============================================================================

export const GAME_STATE_CONFIG = {
  // Initial Values
  initialGameTime: 8,
  initialMoney: 100,
  initialHealth: 100,
  initialPlayerSkill: 50,
  initialDifficulty: 50,
  initialMomentum: 50,
  initialPlotA: 0,
  initialPlotB: 0,
  initialPlotC: 0,
  initialKnobValue: 0,
  initialPosition: 0,
  initialRegion: 'midwest',
  
  // Validation Ranges
  minMoney: 0,
  maxMoney: 9999,
  minHealth: 0,
  maxHealth: 100,
  minSkill: 0,
  maxSkill: 100,
  minDifficulty: 0,
  maxDifficulty: 100,
  minMomentum: 0,
  maxMomentum: 100,
  minPlot: 0,
  maxPlot: 100,
  minKnobValue: 0,
  maxKnobValue: 100
} as const;

// ============================================================================
// PHYSICS CONFIGURATION
// ============================================================================

export const PHYSICS_CONFIG = {
  // World Settings
  gravityX: 0,
  gravityY: 0.5,
  worldBounds: true,
  
  // Object Properties - using greyscale palette
  keysMass: 1,
  keysFriction: 0.1,
  keysBounce: 0.3,
  keysColor: GREYSCALE_PALETTE.mediumGray,
  keysHoverColor: GREYSCALE_PALETTE.lightGray,
  keysDragColor: GREYSCALE_PALETTE.mediumLightGray,
  
  trashMass: 0.5,
  trashFriction: 0.2,
  trashBounce: 0.1,
  trashColor: GREYSCALE_PALETTE.darkGray,
  trashHoverColor: GREYSCALE_PALETTE.mediumDarkGray,
  trashDragColor: GREYSCALE_PALETTE.mediumGray,
  
  itemMass: 0.8,
  itemFriction: 0.15,
  itemBounce: 0.2,
  itemColor: GREYSCALE_PALETTE.mediumLightGray,
  itemHoverColor: GREYSCALE_PALETTE.lightGray,
  itemDragColor: GREYSCALE_PALETTE.white,
  
  // Magnetic Attraction
  magneticStrength: 0.005,
  magneticRadius: 50,
  magneticTargetRadius: 25,
  magneticTargetX: 200,
  magneticTargetY: 520, // Moved up 5% from 550
  magneticTargetColor: GREYSCALE_PALETTE.mediumGray,
  magneticTargetInactiveColor: GREYSCALE_PALETTE.mediumDarkGray,
  magneticSnapThreshold: 15,
  magneticConstraintStiffness: 1,
  magneticConstraintDamping: 0.1
} as const;

// ============================================================================
// REGION SYSTEM CONFIGURATION
// ============================================================================

export const REGION_CONFIG = {
  // Region definitions - using greyscale palette
  regions: {
    west: {
      name: 'West',
      displayName: 'West',
      color: GREYSCALE_PALETTE.mediumGray,
      description: 'The vast western frontier'
    },
    southwest: {
      name: 'Southwest',
      displayName: 'Southwest',
      color: GREYSCALE_PALETTE.mediumLightGray,
      description: 'Desert landscapes and canyons'
    },
    south: {
      name: 'South',
      displayName: 'South',
      color: GREYSCALE_PALETTE.lightGray,
      description: 'Southern hospitality and warmth'
    },
    midwest: {
      name: 'Midwest',
      displayName: 'Midwest',
      color: GREYSCALE_PALETTE.mediumDarkGray,
      description: 'Heartland of America'
    },
    northeast: {
      name: 'Northeast',
      displayName: 'Northeast',
      color: GREYSCALE_PALETTE.darkGray,
      description: 'Historic cities and coastlines'
    }
  },
  
  // Region connectivity map
  connections: {
    west: ['southwest', 'south', 'midwest'],
    southwest: ['west', 'south'],
    south: ['midwest', 'west', 'southwest'],
    midwest: ['west', 'south', 'northeast'],
    northeast: ['midwest', 'south']
  },
  
  // Game progression settings
  showsPerRegion: 3,
  startingRegion: 'midwest',
  
  // UI settings for region selection
  regionChoiceUI: {
    leftRegionOffset: -150,  // Pixels from center for left region
    rightRegionOffset: 150,  // Pixels from center for right region
    regionChoiceY: 0.6,      // Percentage of screen height
    regionChoiceDepth: 50000,
    regionChoiceFontSize: '24px',
    regionChoiceColor: GREYSCALE_PALETTE.white,
    regionChoiceBackgroundColor: GREYSCALE_PALETTE.black,
    regionChoiceBackgroundAlpha: 0.8,
    regionChoicePadding: 20,
    regionChoiceCornerRadius: 10,
    regionChoiceStrokeColor: GREYSCALE_PALETTE.white,
    regionChoiceStrokeWidth: 2
  }
} as const;

// ============================================================================
// DEBUG CONFIGURATION
// ============================================================================

export const DEBUG_CONFIG = {
  // Console Logging
  enableConsoleLogs: true,
  enableMenuLogs: false,
  enablePhysicsLogs: false,
  enableTutorialLogs: false,
  
  // Visual Debug
  showDebugBounds: false,
  showPhysicsBodies: false,
  showCollisionBounds: false,
  
  // Performance
  enablePerformanceMonitoring: false,
  logFrameRate: false,
  logMemoryUsage: false
} as const;
