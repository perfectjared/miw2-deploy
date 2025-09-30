/**
 * AUDIO MANAGER - TONE.JS INTEGRATION
 * 
 * This class manages the Tone.js audio context and ensures it's properly
 * initialized after user interaction to comply with browser autoplay policies.
 * 
 * Key Responsibilities:
 * - Initialize Tone.js audio context on first user interaction
 * - Provide a singleton instance for global audio access
 * - Handle audio context state management
 * - Metronome management with BPM control and beat tracking
 * - Loop playing and switching with crossfading
 * - Volume controls for music and metronome
 * - Ensure proper cleanup on app shutdown
 */

import * as Tone from 'tone';

export class AudioManager {
  private static instance: AudioManager | null = null;
  public isInitialized: boolean = false;
  private initializationPromise: Promise<void> | null = null;
  private muted: boolean = false;
  private contextLost: boolean = false;
  private recoveryTimeout: number = 5000; // 5 seconds timeout for recovery
  private stateChangeCallbacks: Array<(state: 'off' | 'muted' | 'on') => void> = [];

  // Metronome properties
  private bpm: number = 166;
  private beatsPerMeasure: number = 4;
  private beatCount: number = 0;
  private measureCount: number = 0;
  private intervalId?: number;
  private nextBeatTime: number = 0;
  private _isMetronomeRunning: boolean = false;
  private audioSynth?: Tone.MembraneSynth;
  private audioDownbeatSynth?: Tone.MembraneSynth;
  private metronomeVolume: number = 0.1;
  private lastSoundTime: number = 0;
  private metronomeEnabled: boolean = true;

  // App-level metronome (silent, always running for steps)
  private appBpm: number = 166;
  private appBeatCount: number = 0;
  private appMeasureCount: number = 0;
  private appIntervalId?: number;
  private appNextBeatTime: number = 0;
  private _isAppMetronomeRunning: boolean = false;
  private stepCallbacks: Array<(step: number) => void> = [];
  private halfStepCallbacks: Array<(halfStep: number) => void> = [];

  // Loop system properties
  private musicPlayers: Map<string, Tone.Player> = new Map();
  private currentLoop: string = 'No Loop';
  private availableLoops: string[] = ['No Loop'];
  private crossfadeDuration: number = 1.33; // Crossfade duration in seconds
  private allLoopsStarted: boolean = false;
  private musicVolume: number = 0.7;
  private transitionSpeed: number = 0.3; // Multiplier for transition speed
  private transitionType: 'time' | 'downbeat' = 'downbeat';
  private pendingLoopSelection?: string;
  private loopsStartedOnDownbeat: boolean = false;
  private startedLoops: Set<string> = new Set();

  private constructor() {
    // Private constructor for singleton pattern
  }

  /**
   * Get the singleton instance of AudioManager
   */
  public static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  /**
   * Initialize the audio context after user interaction
   * This method is safe to call multiple times - it will only initialize once
   */
  public async initializeAudioContext(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    // If the document is hidden, defer initialization until visible to avoid Tone.start() timeout
    if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
      this.initializationPromise = new Promise<void>((resolve) => {
        const onVisible = () => {
          document.removeEventListener('visibilitychange', onVisible);
          setTimeout(() => {
            this.initializeAudioContext().then(() => resolve());
          }, 0);
        };
        document.addEventListener('visibilitychange', onVisible);
      });
      return this.initializationPromise;
    }

    this.initializationPromise = this._doInitialize();
    return this.initializationPromise;
  }

  /**
   * Force initialize audio context without timeout (for user interaction fallback)
   */
  public async forceInitializeAudioContext(): Promise<boolean> {
    try {
      // Check if we already have a running context
      if (Tone.context.state === 'running') {
        this.isInitialized = true;
        this.contextLost = false;
        this.setupAudioDefaults();
        this.setupContextMonitoring();
        this.notifyStateChange();
        return true;
      }
      
      // If hidden, wait for visibility or a direct user gesture before starting
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
        await new Promise<void>((resolve) => {
          const onVisible = () => {
            document.removeEventListener('visibilitychange', onVisible);
            resolve();
          };
          document.addEventListener('visibilitychange', onVisible);
        });
      }

      // Try resuming existing context first
      try {
        if (Tone.context.state === 'suspended') {
          await (Tone.context as any).resume();
        }
      } catch {}

      // If resume didn't work, replace the context to recover from HMR-stuck states
      if (Tone.context.state !== 'running') {
        try {
          const FreshCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
          if (FreshCtx) {
            const newCtx = new FreshCtx();
            (Tone as any).setContext?.(newCtx);
          }
        } catch {}
      }

      // Try to start the audio context without timeout
      await Tone.start();
      
      this.isInitialized = true;
      this.contextLost = false;
      
      // Set up global audio settings
      this.setupAudioDefaults();
      
      // Set up metronome
      this.setupMetronome();
      
      // Set up app-level metronome for steps
      this.setupAppMetronome();
      
      // Set up context state monitoring
      this.setupContextMonitoring();
      
      // Notify listeners of state change
      this.notifyStateChange();
      
      return true;
      
    } catch (error) {
      console.error('🎵 AudioManager: Failed to force initialize audio context:', error);
      this.isInitialized = false;
      this.contextLost = true;
      return false;
    }
  }

  private async _doInitialize(): Promise<void> {
    try {
      
      // Check if we already have a running context
      if (Tone.context.state === 'running') {
        this.isInitialized = true;
        this.contextLost = false;
        this.setupAudioDefaults();
        this.setupContextMonitoring();
        this.notifyStateChange();
        return;
      }
      
      // If hidden, wait for visibility first, otherwise Tone.start can hang under HMR
      if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
        await new Promise<void>((resolve) => {
          const onVisible = () => {
            document.removeEventListener('visibilitychange', onVisible);
            resolve();
          };
          document.addEventListener('visibilitychange', onVisible);
        });
      }

      // Try resuming existing context first
      try {
        if (Tone.context.state === 'suspended') {
          await (Tone.context as any).resume();
        }
      } catch {}

      // If resume didn't work, replace the context to recover from HMR-stuck states
      if (Tone.context.state !== 'running') {
        try {
          const FreshCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
          if (FreshCtx) {
            const newCtx = new FreshCtx();
            (Tone as any).setContext?.(newCtx);
          }
        } catch {}
      }

      // Try to start the audio context with a shorter timeout for faster failure
      const startPromise = Tone.start();
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Tone.start() timeout after 2 seconds')), 2000);
      });
      
      await Promise.race([startPromise, timeoutPromise]);
      
      
      this.isInitialized = true;
      this.contextLost = false;
      
      // Set up global audio settings
      this.setupAudioDefaults();
      
      // Set up metronome
      this.setupMetronome();
      
      // Set up app-level metronome for steps
      this.setupAppMetronome();
      
      // Set up context state monitoring
      this.setupContextMonitoring();
      
      // Notify listeners of state change
      this.notifyStateChange();
      
      
    } catch (error) {
      console.error('🎵 AudioManager: Failed to initialize audio context:', error);
      // Don't throw - just mark as not initialized and let user interaction handle it
      this.isInitialized = false;
      this.contextLost = true;
      this.initializationPromise = null; // Allow retry
    }
  }

  /**
   * Set up default audio settings
   */
  private setupAudioDefaults(): void {
    // Set master volume to a reasonable level
    Tone.getDestination().volume.value = -6; // -6dB (about 50% volume)
    
    // Configure global audio settings
    Tone.getDestination().mute = this.muted;
    
  }

  /**
   * Set up context state monitoring
   */
  private setupContextMonitoring(): void {
    // Monitor context state changes
    const context = Tone.context as any;
    if (context.addEventListener) {
      context.addEventListener('statechange', () => {
        
        if (Tone.context.state === 'suspended' || Tone.context.state === 'closed') {
          this.contextLost = true;
        } else if (Tone.context.state === 'running') {
          this.contextLost = false;
        }
        
        // Notify all listeners of state change
        this.notifyStateChange();
      });
    }
  }

  /**
   * Add a callback for audio state changes
   */
  public onStateChange(callback: (state: 'off' | 'muted' | 'on') => void): void {
    this.stateChangeCallbacks.push(callback);
  }

  /**
   * Remove a state change callback
   */
  public offStateChange(callback: (state: 'off' | 'muted' | 'on') => void): void {
    const index = this.stateChangeCallbacks.indexOf(callback);
    if (index > -1) {
      this.stateChangeCallbacks.splice(index, 1);
    }
  }

  /**
   * Notify all listeners of state change
   */
  private notifyStateChange(): void {
    const state = this.getAudioState();
    this.stateChangeCallbacks.forEach(callback => {
      try {
        callback(state);
      } catch (error) {
        console.error('🎵 AudioManager: Error in state change callback:', error);
      }
    });
  }

  /**
   * Check if the audio context is initialized
   */
  public isAudioInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Get the Tone.js context (only available after initialization)
   */
  public getContext(): Tone.BaseContext | null {
    if (!this.isInitialized) {
      console.warn('🎵 AudioManager: Audio context not initialized yet');
      return null;
    }
    return Tone.context;
  }

  /**
   * Get the master destination for audio output
   */
  public getDestination(): any | null {
    if (!this.isInitialized) {
      console.warn('🎵 AudioManager: Audio context not initialized yet');
      return null;
    }
    return Tone.getDestination();
  }

  /**
   * Set master volume (in decibels)
   */
  public setMasterVolume(volumeDb: number): void {
    if (!this.isInitialized) {
      console.warn('🎵 AudioManager: Audio context not initialized yet');
      return;
    }
    Tone.getDestination().volume.value = volumeDb;
  }

  /**
   * Mute/unmute master audio
   */
  public setMute(muted: boolean): void {
    if (!this.isInitialized) {
      console.warn('🎵 AudioManager: Audio context not initialized yet');
      return;
    }
    this.muted = muted;
    Tone.getDestination().mute = muted;
    
    // Notify listeners of state change
    this.notifyStateChange();
  }

  /**
   * Check if audio is muted
   */
  public isMuted(): boolean {
    return this.muted;
  }

  /**
   * Check if audio context is lost
   */
  public isContextLost(): boolean {
    return this.contextLost;
  }

  /**
   * Attempt to recover the audio context
   */
  public async attemptRecovery(): Promise<boolean> {
    if (!this.contextLost) {
      return true; // Already working
    }

    try {
      
      // Try to resume the context
      if (Tone.context.state === 'suspended') {
        await Tone.context.resume();
      }
      
      // If still not working, try to reinitialize
      if (Tone.context.state !== 'running') {
        this.isInitialized = false;
        this.initializationPromise = null;
        await this.initializeAudioContext();
      }
      
      
      // Notify listeners of state change
      this.notifyStateChange();
      
      return true;
      
    } catch (error) {
      console.error('🎵 AudioManager: Audio context recovery failed:', error);
      return false;
    }
  }

  /**
   * Get the current audio state for UI display
   */
  public getAudioState(): 'off' | 'muted' | 'on' {
    if (!this.isInitialized || this.contextLost) {
      return 'off';
    }
    return this.muted ? 'muted' : 'on';
  }

  /**
   * Clean up audio resources
   */
  public dispose(): void {
    if (this.isInitialized) {
      try {
        // Tone.js doesn't have a global dispose method, just reset our state
      } catch (error) {
        console.error('🎵 AudioManager: Error disposing audio context:', error);
      }
    }
    this.isInitialized = false;
    this.initializationPromise = null;
  }

  /**
   * Create a simple test sound to verify audio is working
   */
  public async playTestSound(): Promise<void> {
    if (!this.isInitialized) {
      console.warn('🎵 AudioManager: Audio context not initialized yet');
      return;
    }

    try {
      // Create a simple oscillator for testing
      const oscillator = new Tone.Oscillator(440, 'sine').toDestination();
      oscillator.start();
      oscillator.stop('+0.1'); // Stop after 0.1 seconds
      
    } catch (error) {
      console.error('🎵 AudioManager: Error playing test sound:', error);
    }
  }

  // ===== METRONOME METHODS =====

  /**
   * Set up the metronome audio synthesizers
   */
  private setupMetronome(): void {
    try {
      this.audioSynth = new Tone.MembraneSynth().toDestination();
      this.audioDownbeatSynth = new Tone.MembraneSynth().toDestination();
      
      this.audioSynth.volume.value = Tone.gainToDb(this.metronomeVolume);
      this.audioDownbeatSynth.volume.value = Tone.gainToDb(this.metronomeVolume);
      
    } catch (error) {
      console.error('🎵 AudioManager: Failed to setup metronome:', error);
    }
  }

  /**
   * Start the metronome (syncs with app metronome)
   */
  public startMetronome(): void {
    if (this._isMetronomeRunning || !this.metronomeEnabled) return;
    
    console.log('🎵 AudioManager: Starting game metronome at', this.bpm, 'BPM');
    
    // Sync with app metronome - wait for next app beat
    const appBeatInMeasure = this.getAppBeatInMeasure();
    const beatsUntilNextAppBeat = (4 - appBeatInMeasure) % 4;
    const timeUntilNextAppBeat = (beatsUntilNextAppBeat * 60) / this.appBpm;
    
    console.log('🎵 AudioManager: Syncing game metronome - app beat in measure:', appBeatInMeasure, 'beats until next:', beatsUntilNextAppBeat, 'time until next:', timeUntilNextAppBeat);
    
    this._isMetronomeRunning = true;
    this.nextBeatTime = Date.now() + (timeUntilNextAppBeat * 1000);
    
    const beatInterval = (60 / this.bpm) * 1000;
    this.intervalId = window.setTimeout(() => {
      this.playBeat();
      this.scheduleNextBeat();
    }, timeUntilNextAppBeat * 1000);
    
  }

  /**
   * Stop the metronome
   */
  public stopMetronome(): void {
    if (this.intervalId) {
      clearTimeout(this.intervalId);
      this.intervalId = undefined;
    }
    this._isMetronomeRunning = false;
  }

  /**
   * Pause the metronome
   */
  public pauseMetronome(): void {
    this.stopMetronome();
  }

  /**
   * Resume the metronome (syncs with app metronome)
   */
  public resumeMetronome(): void {
    if (this.metronomeEnabled && !this._isMetronomeRunning) {
      // Sync with app metronome - wait for next app beat
      const appBeatInMeasure = this.getAppBeatInMeasure();
      const beatsUntilNextAppBeat = (4 - appBeatInMeasure) % 4;
      const timeUntilNextAppBeat = (beatsUntilNextAppBeat * 60) / this.appBpm;
      
      this._isMetronomeRunning = true;
      this.nextBeatTime = Date.now() + (timeUntilNextAppBeat * 1000);
      
      const delay = timeUntilNextAppBeat * 1000;
      if (delay > 0) {
        this.intervalId = window.setTimeout(() => {
          this.playBeat();
          this.scheduleNextBeat();
        }, delay);
      } else {
        this.playBeat();
        this.scheduleNextBeat();
      }
    }
  }

  /**
   * Schedule the next beat
   */
  private scheduleNextBeat(): void {
    if (!this._isMetronomeRunning) return;

    const beatInterval = (60 / this.bpm) * 1000;
    this.nextBeatTime += beatInterval;
    
    const delay = this.nextBeatTime - Date.now();
    
    if (delay > 0) {
      this.intervalId = window.setTimeout(() => {
        this.playBeat();
        this.scheduleNextBeat();
      }, delay);
    } else {
      this.playBeat();
      this.scheduleNextBeat();
    }
  }

  /**
   * Play a beat and update counters
   */
  private playBeat(): void {
    const beatInMeasure = this.beatCount % this.beatsPerMeasure;
    
    if (this.metronomeEnabled && !this.muted) {
      const isDownbeat = beatInMeasure === 0;
      this.playBeatSound(isDownbeat);
    }
    
    if (beatInMeasure === 3) {
      this.measureCount++;
    }
    
    this.beatCount++;
  }

  /**
   * Play the beat sound
   */
  private playBeatSound(isDownbeat: boolean): void {
    try {
      const now = Tone.now();
      
      if (now - this.lastSoundTime < 0.05) return;
      
      this.lastSoundTime = now;
      
      if (isDownbeat && this.audioDownbeatSynth) {
        this.audioDownbeatSynth.triggerAttackRelease('C4', '8n', now);
      } else if (!isDownbeat && this.audioSynth) {
        this.audioSynth.triggerAttackRelease('C2', '8n', now);
      }
    } catch (error) {
      console.warn('🎵 AudioManager: Failed to play beat sound:', error);
    }
  }

  /**
   * Set BPM (syncs both game and app metronomes)
   */
  public setBpm(bpm: number): void {
    this.bpm = bpm;
    this.appBpm = bpm; // Keep app metronome in sync
    
    if (this._isMetronomeRunning) {
      this.stopMetronome();
      this.startMetronome();
    }
    
    if (this._isAppMetronomeRunning) {
      this.stopAppMetronome();
      this.startAppMetronome();
    }
    
    this.scaleMusicPlayersToBpm(bpm);
  }

  /**
   * Set metronome volume
   */
  public setMetronomeVolume(volume: number): void {
    this.metronomeVolume = volume;
    if (this.audioSynth) {
      this.audioSynth.volume.value = Tone.gainToDb(volume);
    }
    if (this.audioDownbeatSynth) {
      this.audioDownbeatSynth.volume.value = Tone.gainToDb(volume);
    }
  }

  /**
   * Enable/disable metronome
   */
  public setMetronomeEnabled(enabled: boolean): void {
    this.metronomeEnabled = enabled;
    if (!enabled) {
      this.stopMetronome();
    } else if (this.isInitialized) {
      this.startMetronome();
    }
  }

  // ===== LOOP SYSTEM METHODS =====

  /**
   * Load music files into Tone.js players
   */
  public async loadMusicFiles(audioFiles: string[]): Promise<void> {
    if (!this.isInitialized) {
      console.warn('🎵 AudioManager: Audio context not initialized yet');
      return;
    }

    this.availableLoops = ['No Loop', ...audioFiles];

    for (const fileName of audioFiles) {
      try {
        // Create Tone.js player for each audio file
        const player = new Tone.Player({
          url: `/assets/music/${fileName}.m4a`, // Adjust path as needed
          loop: true,
          volume: -Infinity // Start muted
        }).toDestination();
        
        // Apply current BPM scaling
        const baseBpm = 166;
        const scaleFactor = this.bpm / baseBpm;
        const clampedScaleFactor = Math.max(0.25, Math.min(4.0, scaleFactor));
        player.playbackRate = clampedScaleFactor;
        
        this.musicPlayers.set(fileName, player);
      } catch (error) {
        console.error(`🎵 AudioManager: Failed to load music file: ${fileName}`, error);
      }
    }
  }

  /**
   * Set the current loop
   */
  public setLoop(loopName: string): void {
    if (!this.isInitialized) {
      this.pendingLoopSelection = loopName;
      return;
    }
    
    if (!this.allLoopsStarted && loopName !== 'No Loop') {
      this.startAllLoopsImmediately();
      this.currentLoop = loopName;
      this.performCrossfade(loopName);
      return;
    }
    
    this.performCrossfade(loopName);
  }

  /**
   * Start all loops immediately
   */
  private startAllLoopsImmediately(): void {
    if (this.allLoopsStarted) return;
    
    const beatInMeasure = this.getBeatInMeasure();
    const beatsUntilDownbeat = (4 - beatInMeasure) % 4;
    const timeUntilDownbeat = (beatsUntilDownbeat * 60) / this.bpm;
    
    this.musicPlayers.forEach((player, fileName) => {
      if (!this.startedLoops.has(fileName)) {
        player.start(Tone.now() + timeUntilDownbeat);
        this.startedLoops.add(fileName);
      }
    });
    
    this.allLoopsStarted = true;
    this.loopsStartedOnDownbeat = true;
  }

  /**
   * Perform crossfade between loops
   */
  private performCrossfade(targetLoop: string): void {
    const targetVolumeDb = Tone.gainToDb(this.musicVolume);
    const currentLoop = this.currentLoop;
    const isFromNoLoop = currentLoop === 'No Loop';
    const isToNoLoop = targetLoop === 'No Loop';
    
    if (this.transitionType === 'downbeat') {
      this.performDownbeatTransition(targetLoop, targetVolumeDb, isFromNoLoop, isToNoLoop, currentLoop);
    } else {
      this.performTimeBasedTransition(targetLoop, targetVolumeDb, isFromNoLoop, isToNoLoop, currentLoop);
    }
    
    this.currentLoop = targetLoop;
  }

  /**
   * Perform time-based transition
   */
  private performTimeBasedTransition(targetLoop: string, targetVolumeDb: number, isFromNoLoop: boolean, isToNoLoop: boolean, currentLoop: string): void {
    const fadeTime = this.crossfadeDuration / this.transitionSpeed;
    
    this.musicPlayers.forEach((player, fileName) => {
      if (fileName === targetLoop && !isToNoLoop) {
        player.volume.setValueAtTime(player.volume.value, Tone.now());
        player.volume.linearRampToValueAtTime(targetVolumeDb, Tone.now() + fadeTime);
      } else if (fileName === currentLoop && !isFromNoLoop && fileName !== targetLoop) {
        player.volume.setValueAtTime(player.volume.value, Tone.now());
        player.volume.linearRampToValueAtTime(-Infinity, Tone.now() + fadeTime);
      } else if (fileName !== targetLoop && fileName !== currentLoop) {
        player.volume.value = -Infinity;
      }
    });
  }

  /**
   * Perform downbeat transition
   */
  private performDownbeatTransition(targetLoop: string, targetVolumeDb: number, isFromNoLoop: boolean, isToNoLoop: boolean, currentLoop: string): void {
    const beatInMeasure = this.getBeatInMeasure();
    const beatsUntilDownbeat = (4 - beatInMeasure) % 4;
    const timeUntilDownbeat = (beatsUntilDownbeat * 60) / this.bpm;
    
    this.musicPlayers.forEach((player, fileName) => {
      if (fileName === targetLoop && !isToNoLoop) {
        player.volume.setValueAtTime(-Infinity, Tone.now());
        player.volume.setValueAtTime(targetVolumeDb, Tone.now() + timeUntilDownbeat);
      } else if (fileName === currentLoop && !isFromNoLoop && fileName !== targetLoop) {
        player.volume.setValueAtTime(player.volume.value, Tone.now());
        player.volume.setValueAtTime(-Infinity, Tone.now() + timeUntilDownbeat);
      } else if (fileName !== targetLoop && fileName !== currentLoop) {
        player.volume.value = -Infinity;
      }
    });
  }

  /**
   * Scale music players to match BPM
   */
  private scaleMusicPlayersToBpm(bpm: number): void {
    const baseBpm = 166;
    const scaleFactor = bpm / baseBpm;
    const clampedScaleFactor = Math.max(0.25, Math.min(4.0, scaleFactor));
    
    this.musicPlayers.forEach((player, fileName) => {
      try {
        player.playbackRate = clampedScaleFactor;
      } catch (error) {
        console.error(`🎵 AudioManager: Failed to scale ${fileName} playback rate:`, error);
      }
    });
  }

  /**
   * Set music volume
   */
  public setMusicVolume(volume: number): void {
    this.musicVolume = volume;
    if (this.currentLoop !== 'No Loop' && this.musicPlayers.has(this.currentLoop)) {
      const player = this.musicPlayers.get(this.currentLoop)!;
      player.volume.value = Tone.gainToDb(volume);
    }
  }

  // ===== GETTER METHODS =====

  public getBpm(): number { return this.bpm; }
  public getBeatCount(): number { return this.beatCount; }
  public getMeasureCount(): number { return this.measureCount; }
  public getBeatInMeasure(): number { return this.beatCount % this.beatsPerMeasure; }
  public getCurrentLoop(): string { return this.currentLoop; }
  public getAvailableLoops(): string[] { return this.availableLoops; }
  public isMetronomeRunning(): boolean { return this._isMetronomeRunning; }
  public getMetronomeVolume(): number { return this.metronomeVolume; }
  public getMusicVolume(): number { return this.musicVolume; }

  // ===== APP-LEVEL METRONOME METHODS =====

  /**
   * Set up the app-level metronome (silent, always running for steps)
   */
  private setupAppMetronome(): void {
    // App metronome is always running, no audio setup needed
  }

  /**
   * Start the app-level metronome
   */
  public startAppMetronome(): void {
    if (this._isAppMetronomeRunning) return;
    
    console.log('🎵 AudioManager: Starting app metronome at', this.appBpm, 'BPM');
    this._isAppMetronomeRunning = true;
    this.appNextBeatTime = Date.now();
    
    const beatInterval = (60 / this.appBpm) * 1000;
    this.appIntervalId = window.setTimeout(() => {
      this.playAppBeat();
      this.scheduleNextAppBeat();
    }, beatInterval);
    
  }

  /**
   * Stop the app-level metronome
   */
  public stopAppMetronome(): void {
    if (this.appIntervalId) {
      clearTimeout(this.appIntervalId);
      this.appIntervalId = undefined;
    }
    this._isAppMetronomeRunning = false;
  }

  /**
   * Schedule the next app beat
   */
  private scheduleNextAppBeat(): void {
    if (!this._isAppMetronomeRunning) return;

    const beatInterval = (60 / this.appBpm) * 1000;
    this.appNextBeatTime += beatInterval;
    
    const delay = this.appNextBeatTime - Date.now();
    
    if (delay > 0) {
      this.appIntervalId = window.setTimeout(() => {
        this.playAppBeat();
        this.scheduleNextAppBeat();
      }, delay);
    } else {
      this.playAppBeat();
      this.scheduleNextAppBeat();
    }
  }

  /**
   * Play an app beat and update counters
   */
  private playAppBeat(): void {
    const beatInMeasure = this.appBeatCount % this.beatsPerMeasure;
    
    // Increment measure count when we complete a measure
    if (beatInMeasure === 3) {
      this.appMeasureCount++;
    }
    
    // Increment beat count
    this.appBeatCount++;
    
    console.log('🎵 AudioManager: App beat', this.appBeatCount, 'measure', this.appMeasureCount, 'beat in measure', beatInMeasure);
    
    // Emit step event (every beat = 1 step)
    this.stepCallbacks.forEach(callback => {
      try {
        callback(this.appBeatCount);
      } catch (error) {
        console.error('🎵 AudioManager: Error in step callback:', error);
      }
    });
    
    // Emit half-step event (every beat = 2 half-steps)
    const halfStep = this.appBeatCount * 2;
    this.halfStepCallbacks.forEach(callback => {
      try {
        callback(halfStep);
      } catch (error) {
        console.error('🎵 AudioManager: Error in half-step callback:', error);
      }
    });
  }

  /**
   * Set app BPM (affects step timing)
   */
  public setAppBpm(bpm: number): void {
    this.appBpm = bpm;
    if (this._isAppMetronomeRunning) {
      this.stopAppMetronome();
      this.startAppMetronome();
    }
  }

  /**
   * Add a step callback
   */
  public onStep(callback: (step: number) => void): void {
    this.stepCallbacks.push(callback);
  }

  /**
   * Remove a step callback
   */
  public offStep(callback: (step: number) => void): void {
    const index = this.stepCallbacks.indexOf(callback);
    if (index > -1) {
      this.stepCallbacks.splice(index, 1);
    }
  }

  /**
   * Add a half-step callback
   */
  public onHalfStep(callback: (halfStep: number) => void): void {
    this.halfStepCallbacks.push(callback);
  }

  /**
   * Remove a half-step callback
   */
  public offHalfStep(callback: (halfStep: number) => void): void {
    const index = this.halfStepCallbacks.indexOf(callback);
    if (index > -1) {
      this.halfStepCallbacks.splice(index, 1);
    }
  }

  // ===== APP-LEVEL GETTER METHODS =====

  public getAppBpm(): number { return this.appBpm; }
  public getAppBeatCount(): number { return this.appBeatCount; }
  public getAppMeasureCount(): number { return this.appMeasureCount; }
  public getAppBeatInMeasure(): number { return this.appBeatCount % this.beatsPerMeasure; }
  public isAppMetronomeRunning(): boolean { return this._isAppMetronomeRunning; }
}

// Vite HMR support: ensure clean state on hot reload
if (typeof import.meta !== 'undefined' && (import.meta as any).hot) {
  (import.meta as any).hot.dispose(() => {
    const mgr = (AudioManager as any).instance as AudioManager | null;
    if (mgr) {
      try {
        (mgr as any).stopMetronome?.();
        (mgr as any).stopAppMetronome?.();
        (mgr as any).dispose?.();
      } catch {}
    }
    (AudioManager as any).instance = null;
  });
}
