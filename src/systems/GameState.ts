/**
 * GAME STATE - STATE MANAGEMENT AND PERSISTENCE
 * 
 * This module handles all game state management including:
 * - Game progression tracking
 * - Save/load functionality
 * - State validation and restoration
 * - Game session management
 * - Progress milestones and achievements
 * 
 * Key Features:
 * - Centralized state management
 * - Automatic state validation
 * - Save/load with error handling
 * - State change notifications
 * - Progress tracking and milestones
 */

import Phaser from 'phaser';

export interface GameStateData {
  // Core Game State
  gameStarted: boolean;
  gameTime: number;
  step: number;
  
  // Tutorial State
  tutorialPhase: 'none' | 'keys_placement' | 'initial_driving' | 'countdown' | 'interrupt' | 'normal';
  tutorialStep: number;
  
  // Player Stats
  money: number;
  health: number;
  playerSkill: number;
  difficulty: number;
  momentum: number;
  
  // Monthly Listeners System
  monthlyListeners: number;
  buzz: number;
  
  // Plot Progress
  plotA: number;
  plotB: number;
  plotC: number;
  plotAEnum: string;
  plotBEnum: string;
  plotCEnum: string;
  
  // Game Progress
  stops: number;
  progress: number;
  position: number;
  
  // Region System
  currentRegion: string;
  showsInCurrentRegion: number;
  regionHistory: string[];
  sequencesInCurrentRegion: number; // Store the sequence count for current region
  
  // Car State
  carStarted: boolean;
  keysInIgnition: boolean;
  hasOpenMenu: boolean;
  speedCrankPercentage: number;
  knobValue: number;
  
  // UI State
  currentPosition: string; // 'frontseat' | 'backseat'
  currentView: string; // 'main' | 'overlay'
  
  // Timestamps
  lastSaveTime: string;
  sessionStartTime: string;
}

export interface GameStateConfig {
  // Initial Values
  initialGameTime: number;
  initialMoney: number;
  initialHealth: number;
  initialPlayerSkill: number;
  initialDifficulty: number;
  initialMomentum: number;
  initialPlotA: number;
  initialPlotB: number;
  initialPlotC: number;
  initialKnobValue: number;
  initialPosition: number;
  initialRegion: string;
  
  // Monthly Listeners System
  initialMonthlyListeners: number;
  initialBuzz: number;
  minBuzz: number;
  maxBuzz: number;
  minMonthlyListeners: number;
  maxMonthlyListeners: number;
  
  // Validation
  minMoney: number;
  maxMoney: number;
  minHealth: number;
  maxHealth: number;
  minSkill: number;
  maxSkill: number;
  minDifficulty: number;
  maxDifficulty: number;
  minMomentum: number;
  maxMomentum: number;
  minPlot: number;
  maxPlot: number;
  minKnobValue: number;
  maxKnobValue: number;
}

export class GameState {
  private scene: Phaser.Scene;
  private config: GameStateConfig;
  
  // Current State
  private state: GameStateData;
  
  // Event Callbacks
  private onStateChange?: (state: GameStateData) => void;
  private onSaveComplete?: (success: boolean) => void;
  private onLoadComplete?: (success: boolean, state?: GameStateData) => void;

  constructor(scene: Phaser.Scene, config: GameStateConfig) {
    this.scene = scene;
    this.config = config;
    
    // Initialize state with default values
    this.state = this.createInitialState();
  }

  /**
   * Initialize game state
   */
  public initialize() {
    this.state = this.createInitialState();
    this.notifyStateChange();
  }

  /**
   * Set event callbacks
   */
  public setEventCallbacks(callbacks: {
    onStateChange?: (state: GameStateData) => void;
    onSaveComplete?: (success: boolean) => void;
    onLoadComplete?: (success: boolean, state?: GameStateData) => void;
  }) {
    this.onStateChange = callbacks.onStateChange;
    this.onSaveComplete = callbacks.onSaveComplete;
    this.onLoadComplete = callbacks.onLoadComplete;
  }

  /**
   * Get current state
   */
  public getState(): GameStateData {
    return { ...this.state };
  }

  /**
   * Check if game has started
   */
  public isGameStarted(): boolean {
    return this.state.gameStarted;
  }

  /**
   * Update specific state values
   */
  public updateState(updates: Partial<GameStateData>) {
    const oldState = { ...this.state };
    
    // Apply updates with validation
    Object.keys(updates).forEach(key => {
      const value = (updates as any)[key];
      if (value !== undefined) {
        (this.state as any)[key] = this.validateValue(key, value);
      }
    });
    
    // Update timestamp
    this.state.lastSaveTime = new Date().toISOString();
    
    // Notify if state changed
    if (JSON.stringify(oldState) !== JSON.stringify(this.state)) {
      this.notifyStateChange();
    }
  }

  /**
   * Start the tutorial sequence
   */
  public startTutorial() {
    this.updateState({
      tutorialPhase: 'keys_placement',
      tutorialStep: 0
    });
    
    console.log('Tutorial started: keys placement phase');
  }
  
  /**
   * Advance tutorial to next phase
   */
  public advanceTutorial() {
    const currentPhase = this.state.tutorialPhase;
    let nextPhase: GameStateData['tutorialPhase'];
    let nextStep = this.state.tutorialStep + 1;
    
    switch (currentPhase) {
      case 'keys_placement':
        // Only advance when keys are placed in ignition
        if (this.state.keysInIgnition) {
          nextPhase = 'initial_driving';
          nextStep = 0;
        } else {
          nextPhase = 'keys_placement';
        }
        break;
      case 'initial_driving':
        if (nextStep >= 4) {
          nextPhase = 'countdown';
          nextStep = 0;
        } else {
          nextPhase = 'initial_driving';
        }
        break;
      case 'countdown':
        nextPhase = 'interrupt';
        nextStep = 0;
        break;
      case 'interrupt':
        nextPhase = 'normal';
        nextStep = 0;
        break;
      default:
        nextPhase = 'normal';
        nextStep = 0;
    }
    
    this.updateState({
      tutorialPhase: nextPhase,
      tutorialStep: nextStep
    });
    
    console.log(`Tutorial advanced: ${currentPhase} -> ${nextPhase} (step: ${nextStep})`);
  }
  
  /**
   * Check if currently in tutorial
   */
  public isInTutorial(): boolean {
    return this.state.tutorialPhase !== 'none' && this.state.tutorialPhase !== 'normal';
  }
  
  /**
   * Get current tutorial phase
   */
  public getTutorialPhase(): GameStateData['tutorialPhase'] {
    return this.state.tutorialPhase;
  }
  
  /**
   * Get current tutorial step
   */
  public getTutorialStep(): number {
    return this.state.tutorialStep;
  }

  /**
   * Start the game
   */
  public startGame() {
    this.updateState({
      gameStarted: true,
      sessionStartTime: new Date().toISOString()
    });
    
    console.log('Game started');
  }

  /**
   * Stop the game
   */
  public stopGame() {
    this.updateState({
      gameStarted: false
    });
    
    console.log('Game stopped');
  }

  /**
   * Load game from save data
   */
  public loadGame(steps: number) {
    console.log(`Loading game from step ${steps}`);
    
    try {
      // Load steps from AppScene
      this.loadSteps(steps);
      
      // Start game if not already started
      if (!this.state.gameStarted) {
        this.startGame();
      }
      
      // TODO: Implement proper game state restoration based on steps
      // This would involve restoring:
      // - Game time
      // - Player position
      // - Money, health, etc.
      // - Car state
      // - Current view/position
      
      console.log('Game loaded successfully');
      
      if (this.onLoadComplete) {
        this.onLoadComplete(true, this.state);
      }
    } catch (error) {
      console.error('Failed to load game:', error);
      
      if (this.onLoadComplete) {
        this.onLoadComplete(false);
      }
    }
  }

  /**
   * Save game state
   */
  public saveGame(): boolean {
    try {
      // Update save timestamp
      this.updateState({
        lastSaveTime: new Date().toISOString()
      });
      
      // Get current step from AppScene
      const appScene = this.scene.scene.get('AppScene');
      const currentStep = appScene ? (appScene as any).getStep() : 0;
      
      // Save to localStorage
      const saveData = {
        ...this.state,
        step: currentStep,
        saveTime: new Date().toISOString(),
        version: '1.0.0'
      };
      
      localStorage.setItem('game-fast-save', JSON.stringify(saveData));
      
      console.log('Game saved successfully');
      
      if (this.onSaveComplete) {
        this.onSaveComplete(true);
      }
      
      return true;
    } catch (error) {
      console.error('Failed to save game:', error);
      
      if (this.onSaveComplete) {
        this.onSaveComplete(false);
      }
      
      return false;
    }
  }

  /**
   * Load game from localStorage
   */
  public loadFromStorage(): GameStateData | null {
    try {
      const savedData = localStorage.getItem('game-fast-save');
      if (!savedData) {
        console.log('No save data found');
        return null;
      }
      
      const parsedData = JSON.parse(savedData);
      
      // Validate save data
      if (!this.validateSaveData(parsedData)) {
        console.warn('Invalid save data found');
        return null;
      }
      
      // Update state with loaded data
      this.state = {
        ...this.state,
        ...parsedData
      };
      
      console.log('Game loaded from storage successfully');
      
      if (this.onLoadComplete) {
        this.onLoadComplete(true, this.state);
      }
      
      return this.state;
    } catch (error) {
      console.error('Failed to load from storage:', error);
      
      if (this.onLoadComplete) {
        this.onLoadComplete(false);
      }
      
      return null;
    }
  }

  /**
   * Check if save data exists
   */
  public hasSaveData(): boolean {
    return localStorage.getItem('game-fast-save') !== null;
  }

  /**
   * Clear save data
   */
  public clearSaveData(): boolean {
    try {
      localStorage.removeItem('game-fast-save');
      console.log('Save data cleared successfully');
      return true;
    } catch (error) {
      console.error('Failed to clear save data:', error);
      return false;
    }
  }

  /**
   * Get save data info
   */
  public getSaveInfo(): { exists: boolean; timestamp?: string; steps?: number } {
    try {
      const savedData = localStorage.getItem('game-fast-save');
      if (!savedData) {
        return { exists: false };
      }
      
      const parsedData = JSON.parse(savedData);
      return {
        exists: true,
        timestamp: parsedData.saveTime || parsedData.lastSaveTime,
        steps: parsedData.step
      };
    } catch (error) {
      console.error('Failed to get save info:', error);
      return { exists: false };
    }
  }

  /**
   * Load steps from AppScene
   */
  private loadSteps(steps: number) {
    const appScene = this.scene.scene.get('AppScene');
    if (appScene) {
      (appScene as any).setStep(steps);
    }
  }

  /**
   * Create initial state
   */
  private createInitialState(): GameStateData {
    return {
      // Core Game State
      gameStarted: false,
      gameTime: this.config.initialGameTime,
      step: 0,
      
      // Tutorial State
      tutorialPhase: 'none',
      tutorialStep: 0,
      
      // Player Stats
      money: this.config.initialMoney,
      health: this.config.initialHealth,
      playerSkill: this.config.initialPlayerSkill,
      difficulty: this.config.initialDifficulty,
      momentum: this.config.initialMomentum,
      
      // Monthly Listeners System
      monthlyListeners: this.config.initialMonthlyListeners,
      buzz: this.config.initialBuzz,
      
      // Plot Progress
      plotA: this.config.initialPlotA,
      plotB: this.config.initialPlotB,
      plotC: this.config.initialPlotC,
      plotAEnum: 'none',
      plotBEnum: 'none',
      plotCEnum: 'none',
      
      // Game Progress
      stops: 0,
      progress: 0,
      position: this.config.initialPosition,
      
      // Region System
      currentRegion: this.config.initialRegion,
      showsInCurrentRegion: 0,
      regionHistory: [this.config.initialRegion],
      sequencesInCurrentRegion: this.calculateSequencesForRegion(this.config.initialRegion, 1),
      
      // Car State
      carStarted: false,
      keysInIgnition: false,
      hasOpenMenu: false,
      speedCrankPercentage: 0,
      knobValue: this.config.initialKnobValue,
      
      // UI State
      currentPosition: 'frontseat',
      currentView: 'main',
      
      // Timestamps
      lastSaveTime: new Date().toISOString(),
      sessionStartTime: new Date().toISOString()
    };
  }

  /**
   * Validate a specific value
   */
  private validateValue(key: string, value: any): any {
    switch (key) {
      case 'money':
        return Phaser.Math.Clamp(value, this.config.minMoney, this.config.maxMoney);
      case 'health':
        return Phaser.Math.Clamp(value, this.config.minHealth, this.config.maxHealth);
      case 'playerSkill':
        return Phaser.Math.Clamp(value, this.config.minSkill, this.config.maxSkill);
      case 'difficulty':
        return Phaser.Math.Clamp(value, this.config.minDifficulty, this.config.maxDifficulty);
      case 'momentum':
        return Phaser.Math.Clamp(value, this.config.minMomentum, this.config.maxMomentum);
      case 'plotA':
      case 'plotB':
      case 'plotC':
        return Phaser.Math.Clamp(value, this.config.minPlot, this.config.maxPlot);
      case 'knobValue':
        return Phaser.Math.Clamp(value, this.config.minKnobValue, this.config.maxKnobValue);
      case 'monthlyListeners':
        return Phaser.Math.Clamp(value, this.config.minMonthlyListeners, this.config.maxMonthlyListeners);
      case 'buzz':
        return Phaser.Math.Clamp(value, this.config.minBuzz, this.config.maxBuzz);
      case 'currentPosition':
        return ['frontseat', 'backseat'].includes(value) ? value : 'frontseat';
      case 'currentView':
        return ['main', 'overlay'].includes(value) ? value : 'main';
      default:
        return value;
    }
  }

  /**
   * Validate save data
   */
  private validateSaveData(data: any): boolean {
    // Check required fields
    const requiredFields = ['gameStarted', 'money', 'health', 'step'];
    for (const field of requiredFields) {
      if (data[field] === undefined) {
        return false;
      }
    }
    
    // Check data types
    if (typeof data.gameStarted !== 'boolean') return false;
    if (typeof data.money !== 'number') return false;
    if (typeof data.health !== 'number') return false;
    if (typeof data.step !== 'number') return false;
    
    return true;
  }

  /**
   * Notify state change
   */
  private notifyStateChange() {
    if (this.onStateChange) {
      this.onStateChange(this.state);
    }
  }

  /**
   * Reset state to initial values
   */
  public resetState() {
    this.state = this.createInitialState();
    this.notifyStateChange();
    console.log('Game state reset to initial values');
  }

  /**
   * Get state summary for debugging
   */
  public getStateSummary(): string {
    return `Game: ${this.state.gameStarted ? 'Started' : 'Stopped'} | ` +
           `Step: ${this.state.step} | ` +
           `Money: $${this.state.money} | ` +
           `Health: ${this.state.health} | ` +
           `Position: ${this.state.currentPosition} | ` +
           `Region: ${this.state.currentRegion} | ` +
           `Shows: ${this.state.showsInCurrentRegion}`;
  }

  /**
   * Get current region
   */
  public getCurrentRegion(): string {
    return this.state.currentRegion;
  }

  /**
   * Get shows completed in current region
   */
  public getShowsInCurrentRegion(): number {
    return this.state.showsInCurrentRegion;
  }

  /**
   * Increment shows in current region
   */
  public incrementShowsInCurrentRegion(): void {
    this.updateState({
      showsInCurrentRegion: this.state.showsInCurrentRegion + 1
    });
  }

  /**
   * Change to a new region
   */
  public changeRegion(newRegion: string): void {
    const oldRegion = this.state.currentRegion;
    const newVisitCount = this.getRegionVisitCount(newRegion) + 1; // +1 because we're about to add it to history
    const newSequences = this.calculateSequencesForRegion(newRegion, newVisitCount);
    
    this.updateState({
      currentRegion: newRegion,
      showsInCurrentRegion: 0, // Reset to 0 (will display as 1/3, 2/3, etc.)
      regionHistory: [...this.state.regionHistory, newRegion],
      sequencesInCurrentRegion: newSequences
    });
    console.log(`Region changed from ${oldRegion} to ${newRegion} - sequence count reset to 0, total sequences: ${newSequences}`);
  }

  /**
   * Get region history
   */
  public getRegionHistory(): string[] {
    return [...this.state.regionHistory];
  }

  /**
   * Calculate the number of driving sequences for a region (deterministic)
   * All regions: 2-3 sequences (randomized but deterministic)
   */
  private calculateSequencesForRegion(region: string, visitCount: number): number {
    // Use a deterministic seed based on region name and visit count
    const seed = this.hashString(`${region}-${visitCount}`);
    return (seed % 2) + 2; // Either 2 or 3 sequences
  }

  /**
   * Simple hash function for deterministic random-like behavior
   */
  private hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash);
  }

  /**
   * Get the number of driving sequences for the current region (cached)
   */
  public getSequencesForCurrentRegion(): number {
    return this.state.sequencesInCurrentRegion;
  }

  /**
   * Get how many times a region has been visited
   */
  private getRegionVisitCount(region: string): number {
    return this.state.regionHistory.filter(r => r === region).length;
  }

  /**
   * Check if current sequence is the final one for this region
   */
  public isFinalSequenceForRegion(): boolean {
    const totalSequences = this.getSequencesForCurrentRegion();
    return this.state.showsInCurrentRegion >= totalSequences - 1;
  }

  /**
   * Update buzz value
   */
  public updateBuzz(buzzChange: number): void {
    const newBuzz = this.state.buzz + buzzChange;
    this.updateState({ buzz: newBuzz });
  }

  /**
   * Update monthly listeners based on buzz during countdown
   */
  public updateListenersOnCountdown(): void {
    const buzzMultiplier = this.state.buzz;
    const listenerChange = Math.floor(buzzMultiplier * 10); // Buzz affects listeners by 10x
    const newListeners = this.state.monthlyListeners + listenerChange;
    this.updateState({ monthlyListeners: newListeners });
    
    console.log(`Buzz: ${this.state.buzz}, Listener change: ${listenerChange}, New total: ${newListeners}`);
  }

  /**
   * Get current monthly listeners
   */
  public getMonthlyListeners(): number {
    return this.state.monthlyListeners;
  }

  /**
   * Get current buzz value
   */
  public getBuzz(): number {
    return this.state.buzz;
  }

  /**
   * Check if player should choose next region (after completing all sequences)
   */
  public shouldChooseNextRegion(): boolean {
    const totalSequences = this.getSequencesForCurrentRegion();
    return this.state.showsInCurrentRegion >= totalSequences;
  }
}
