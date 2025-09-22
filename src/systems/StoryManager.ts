/**
 * STORY MANAGER - NOVELJS INTEGRATION AND STORY PROGRESSION
 * 
 * This module handles all story-related functionality including:
 * - NovelJS integration for interactive storytelling
 * - Story progression tracking
 * - Choice outcome management
 * - Storyline selection and event management
 * 
 * Key Features:
 * - Integration with NovelJS library
 * - Dynamic story loading and progression
 * - Choice tracking and outcome management
 * - Seamless integration with existing game systems
 */

import Phaser from 'phaser';
import storyConfig from '../config/StoryConfig.json';

export interface StoryEvent {
  title: string;
  text: string;
  choices: Array<{
    text: string;
    outcome: string;
  }>;
}

export interface Storyline {
  name: string;
  description: string;
  events: Record<string, StoryEvent>;
  outcomes: Record<string, string>;
}

export interface StoryConfig {
  storylines: Record<string, Storyline>;
}

export interface StoryProgress {
  currentStoryline: string;
  currentEvent: number;
  choices: string[];
  completed: boolean;
}

export class StoryManager {
  private scene: Phaser.Scene;
  private config: StoryConfig;
  private currentProgress: StoryProgress | null = null;
  private novelElement: HTMLElement | null = null;
  private isStoryActive: boolean = false;
  private pendingCompletion: boolean = false;
  
  // Debug story system
  private debugStoryActive: boolean = false;
  private currentDebugStoryline: string = 'fauxchella';
  private currentDebugEvent: number = 1;
  private storylines: string[] = [];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.config = storyConfig as StoryConfig;
  }

  /**
   * Setup debug controls for story testing
   */
  private setupDebugControls(): void {
    // Listen for debug key presses
    this.scene.input.keyboard?.on('keydown-S', () => {
      this.toggleDebugStory();
    });
    
    this.scene.input.keyboard?.on('keydown-UP', () => {
      if (this.debugStoryActive) {
        this.changeDebugStoryline(-1);
      }
    });
    
    this.scene.input.keyboard?.on('keydown-DOWN', () => {
      if (this.debugStoryActive) {
        this.changeDebugStoryline(1);
      }
    });
    
    this.scene.input.keyboard?.on('keydown-LEFT', () => {
      if (this.debugStoryActive) {
        this.changeDebugEvent(-1);
      }
    });
    
    this.scene.input.keyboard?.on('keydown-RIGHT', () => {
      if (this.debugStoryActive) {
        this.changeDebugEvent(1);
      }
    });
  }

  /**
   * Initialize the story system
   */
  public initialize(): void {
    console.log('StoryManager: Initializing story system');
    this.setupNovelElement();
    this.setupDebugControls();
    
    // Initialize storylines array
    this.storylines = Object.keys(this.config.storylines);
    console.log('StoryManager: Available storylines:', this.storylines);
    console.log('StoryManager: Story config loaded:', Object.keys(this.config.storylines).length, 'storylines');
  }

  /**
   * Setup NovelJS element for story display
   */
  private setupNovelElement(): void {
    // Create a hidden novel element for story processing
    this.novelElement = document.createElement('div');
    this.novelElement.style.display = 'none';
    this.novelElement.style.position = 'absolute';
    this.novelElement.style.top = '-9999px';
    document.body.appendChild(this.novelElement);
  }

  /**
   * Toggle debug story window
   */
  private toggleDebugStory(): void {
    if (this.debugStoryActive) {
      this.closeDebugStory();
    } else {
      this.openDebugStory();
    }
  }

  /**
   * Open debug story window
   */
  private openDebugStory(): void {
    this.debugStoryActive = true;
    this.showDebugStory();
    console.log(`Debug Story: ${this.currentDebugStoryline}-${this.currentDebugEvent}`);
  }

  /**
   * Close debug story window
   */
  private closeDebugStory(): void {
    this.debugStoryActive = false;
    const menuScene = this.scene.scene.get('MenuScene');
    if (menuScene) {
      (menuScene as any).menuManager.closeCurrentDialog();
    }
  }

  /**
   * Show current debug story
   */
  private showDebugStory(): void {
    const storyline = this.config.storylines[this.currentDebugStoryline];
    const event = storyline.events[this.currentDebugEvent.toString()];
    
    // Validate data exists
    if (!storyline) {
      console.error(`Debug Story: Storyline '${this.currentDebugStoryline}' not found in config`);
      return;
    }
    
    if (!event) {
      console.error(`Debug Story: Event ${this.currentDebugEvent} not found in storyline '${this.currentDebugStoryline}'`);
      return;
    }
    
    console.log(`Debug Story: Showing ${this.currentDebugStoryline}-${this.currentDebugEvent}`);
    console.log(`Debug Story: Text: "${event.text}"`);
    console.log(`Debug Story: Choices: ${event.choices.length} choices`);
    
    const menuScene = this.scene.scene.get('MenuScene');
    if (menuScene) {
      (menuScene as any).events.emit('showNovelStory', {
        storyline: this.currentDebugStoryline,
        event: this.currentDebugEvent,
        eventData: event,
        storylineData: storyline
      });
      this.scene.scene.bringToTop('MenuScene');
    }
  }

  /**
   * Change debug storyline
   */
  private changeDebugStoryline(direction: number): void {
    const currentIndex = this.storylines.indexOf(this.currentDebugStoryline);
    let newIndex = currentIndex + direction;
    
    // Wrap around
    if (newIndex < 0) newIndex = this.storylines.length - 1;
    if (newIndex >= this.storylines.length) newIndex = 0;
    
    this.currentDebugStoryline = this.storylines[newIndex];
    this.showDebugStory();
    console.log(`Debug Story: ${this.currentDebugStoryline}-${this.currentDebugEvent}`);
  }

  /**
   * Change debug event number
   */
  private changeDebugEvent(direction: number): void {
    let newEvent = this.currentDebugEvent + direction;
    
    // Clamp between 1 and 4
    newEvent = Math.max(1, Math.min(4, newEvent));
    
    this.currentDebugEvent = newEvent;
    this.showDebugStory();
    console.log(`Debug Story: ${this.currentDebugStoryline}-${this.currentDebugEvent}`);
  }

  /**
   * Start a story sequence
   */
  public startStory(storylineName: string, eventNumber: number = 1): void {
    if (!this.config.storylines[storylineName]) {
      console.error(`StoryManager: Unknown storyline: ${storylineName}`);
      return;
    }

    // For fauxchella stories, determine which event to show based on progress
    let actualEventNumber = eventNumber;
    if (storylineName === 'fauxchella') {
      actualEventNumber = this.getNextFauxchellaEvent();
    }

    const storyline = this.config.storylines[storylineName];
    const eventKey = actualEventNumber.toString();
    
    if (!storyline.events[eventKey]) {
      console.error(`StoryManager: Event ${actualEventNumber} not found in storyline ${storylineName}`);
      return;
    }

    this.currentProgress = {
      currentStoryline: storylineName,
      currentEvent: actualEventNumber,
      choices: [],
      completed: false
    };

    this.isStoryActive = true;
    console.log(`StoryManager: Starting story ${storylineName}-${actualEventNumber}`);
    
    // Emit story start event to MenuScene (copying CYOA implementation)
    const storyEventData = {
      storyline: storylineName,
      event: actualEventNumber,
      eventData: storyline.events[eventKey],
      storylineData: storyline
    };
    console.log('StoryManager: Emitting showNovelStory event with data:', storyEventData);
    
    const menuScene = this.scene.scene.get('MenuScene');
    if (menuScene) {
      (menuScene as any).events.emit('showNovelStory', storyEventData);
      console.log('StoryManager: showNovelStory event emitted to MenuScene');
    } else {
      console.error('StoryManager: MenuScene not found');
    }
  }

  /**
   * Get the next fauxchella event based on game progress
   */
  private getNextFauxchellaEvent(): number {
    const gameScene = this.scene.scene.get('GameScene');
    if (!gameScene || !(gameScene as any).gameState) {
      return 1; // Default to first event
    }

    const gameState = (gameScene as any).gameState;
    const state = gameState.getState();
    
    // Check which fauxchella thresholds have been reached
    const thresholds = [
      { listeners: 0, event: 1 },      // First story (always)
      { listeners: 5000, event: 2 },  // Second story
      { listeners: 10000, event: 3 }, // Third story
      { listeners: 20000, event: 4 }  // Fourth story
    ];
    
    const monthlyListeners = state.monthlyListeners || 0;
    
    // Find the highest threshold reached
    let nextEvent = 1;
    for (const threshold of thresholds) {
      if (monthlyListeners >= threshold.listeners) {
        nextEvent = threshold.event;
      }
    }
    
    console.log(`StoryManager: Next fauxchella event: ${nextEvent} (${monthlyListeners} listeners)`);
    return nextEvent;
  }

  /**
   * Process a story choice
   */
  public makeChoice(choiceOutcome: string): void {
    if (!this.currentProgress || !this.isStoryActive) {
      console.warn('StoryManager: No active story to make choice for');
      return;
    }

    this.currentProgress.choices.push(choiceOutcome);
    
    const storyline = this.config.storylines[this.currentProgress.currentStoryline];
    const currentEvent = storyline.events[this.currentProgress.currentEvent.toString()];
    
    console.log(`StoryManager: Made choice ${choiceOutcome} in ${this.currentProgress.currentStoryline}-${this.currentProgress.currentEvent}`);

    // Check if this is the last event
    if (this.currentProgress.currentEvent >= 4) {
      // For the last event, don't complete immediately - wait for outcome window to be closed
      console.log(`StoryManager: Last event completed, waiting for outcome window to close before completing story`);
      this.pendingCompletion = true;
    } else {
      // Move to next event
      this.currentProgress.currentEvent++;
      this.continueStory();
    }
  }
  
  /**
   * Complete the story after the outcome window has been closed
   */
  public completeStoryAfterOutcome(): void {
    if (this.pendingCompletion) {
      this.pendingCompletion = false;
      this.completeStory();
    }
  }

  /**
   * Continue to the next event in the story
   */
  private continueStory(): void {
    if (!this.currentProgress) return;

    const storyline = this.config.storylines[this.currentProgress.currentStoryline];
    const nextEvent = storyline.events[this.currentProgress.currentEvent.toString()];
    
    console.log(`StoryManager: Continuing to ${this.currentProgress.currentStoryline}-${this.currentProgress.currentEvent}`);
    
    // Emit continue story event
    this.scene.events.emit('showNovelStory', {
      storyline: this.currentProgress.currentStoryline,
      event: this.currentProgress.currentEvent,
      eventData: nextEvent,
      storylineData: storyline
    });
  }

  /**
   * Complete the current story
   */
  private completeStory(): void {
    if (!this.currentProgress) return;

    this.currentProgress.completed = true;
    this.isStoryActive = false;
    
    const storyline = this.config.storylines[this.currentProgress.currentStoryline];
    const finalChoice = this.currentProgress.choices[this.currentProgress.choices.length - 1];
    const outcome = storyline.outcomes[finalChoice] || storyline.outcomes['a'];
    
    console.log(`StoryManager: Completed story ${this.currentProgress.currentStoryline}`);
    
    // Emit story completion event
    this.scene.events.emit('storyCompleted', {
      storyline: this.currentProgress.currentStoryline,
      outcome: outcome,
      choices: this.currentProgress.choices
    });

    this.currentProgress = null;
  }

  /**
   * Get available storylines
   */
  public getAvailableStorylines(): string[] {
    return Object.keys(this.config.storylines);
  }

  /**
   * Get storyline data
   */
  public getStoryline(storylineName: string): Storyline | null {
    return this.config.storylines[storylineName] || null;
  }

  /**
   * Check if a story is currently active
   */
  public isStoryRunning(): boolean {
    return this.isStoryActive;
  }

  /**
   * Check if debug story is currently active
   */
  public isDebugStoryActive(): boolean {
    return this.debugStoryActive;
  }

  /**
   * Get current story progress
   */
  public getCurrentProgress(): StoryProgress | null {
    return this.currentProgress;
  }

  /**
   * Clean up resources
   */
  public destroy(): void {
    if (this.novelElement) {
      document.body.removeChild(this.novelElement);
      this.novelElement = null;
    }
    this.currentProgress = null;
    this.isStoryActive = false;
  }
}
