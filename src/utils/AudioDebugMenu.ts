/**
 * AUDIO DEBUG MENU - METRONOME AND LOOP CONTROLS
 * 
 * This class provides a debug menu for controlling the enhanced AudioManager
 * with metronome, BPM, and loop functionality. It integrates with the existing
 * MenuManager system and provides real-time controls for audio features.
 */

import { AudioManager } from './AudioManager';

export class AudioDebugMenu {
  private audioManager: AudioManager;
  private isVisible: boolean = false;
  private menuContainer?: Phaser.GameObjects.Container;
  private scene?: Phaser.Scene;
  private updateTimer?: Phaser.Time.TimerEvent;

  // UI Elements
  private bpmSlider?: any;
  private metronomeVolumeSlider?: any;
  private musicVolumeSlider?: any;
  private loopSelector?: any;
  private metronomeToggle?: any;
  private statusText?: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.audioManager = AudioManager.getInstance();
    this.createMenu();
  }

  private createMenu(): void {
    if (!this.scene) return;

    // Create main container
    this.menuContainer = this.scene.add.container(0, 0);
    this.menuContainer.setVisible(false);

    // Create background
    const background = this.scene.add.rectangle(0, 0, 300, 400, 0x000000, 0.8);
    background.setOrigin(0, 0);
    this.menuContainer.add(background);

    // Create title
    const title = this.scene.add.text(10, 10, 'Audio Debug Menu', {
      fontSize: '16px',
      color: '#ffffff',
      fontFamily: 'Arial'
    });
    this.menuContainer.add(title);

    // Create status display
    this.statusText = this.scene.add.text(10, 40, '', {
      fontSize: '12px',
      color: '#cccccc',
      fontFamily: 'Arial'
    });
    this.menuContainer.add(this.statusText);

    // Create BPM control
    const bpmLabel = this.scene.add.text(10, 70, 'BPM:', {
      fontSize: '14px',
      color: '#ffffff',
      fontFamily: 'Arial'
    });
    this.menuContainer.add(bpmLabel);

    // Create BPM slider using rexUI
    if (this.scene.rexUI) {
      this.bpmSlider = this.scene.rexUI.add.slider({
        x: 150,
        y: 85,
        width: 120,
        height: 20,
        orientation: 'horizontal',
        value: this.audioManager.getBpm(),
        valuechangeCallback: (value: number) => {
          this.audioManager.setBpm(Math.round(value));
        }
      });
      this.bpmSlider.setValue(166, 40, 240); // Min 40, Max 240, Default 166
      this.menuContainer.add(this.bpmSlider);

      // BPM value display
      const bpmValue = this.scene.add.text(280, 70, '166', {
        fontSize: '14px',
        color: '#ffff00',
        fontFamily: 'Arial'
      });
      this.menuContainer.add(bpmValue);

      // Update BPM display
      this.bpmSlider.on('valuechange', (value: number) => {
        bpmValue.setText(Math.round(value).toString());
      });
    }

    // Create metronome volume control
    const metronomeVolLabel = this.scene.add.text(10, 110, 'Metronome Volume:', {
      fontSize: '14px',
      color: '#ffffff',
      fontFamily: 'Arial'
    });
    this.menuContainer.add(metronomeVolLabel);

    if (this.scene.rexUI) {
      this.metronomeVolumeSlider = this.scene.rexUI.add.slider({
        x: 150,
        y: 125,
        width: 120,
        height: 20,
        orientation: 'horizontal',
        value: this.audioManager.getMetronomeVolume(),
        valuechangeCallback: (value: number) => {
          this.audioManager.setMetronomeVolume(value);
        }
      });
      this.metronomeVolumeSlider.setValue(0.1, 0, 1); // Min 0, Max 1, Default 0.1
      this.menuContainer.add(this.metronomeVolumeSlider);

      // Metronome volume value display
      const metronomeVolValue = this.scene.add.text(280, 110, '0.1', {
        fontSize: '14px',
        color: '#ffff00',
        fontFamily: 'Arial'
      });
      this.menuContainer.add(metronomeVolValue);

      // Update metronome volume display
      this.metronomeVolumeSlider.on('valuechange', (value: number) => {
        metronomeVolValue.setText(value.toFixed(2));
      });
    }

    // Create music volume control
    const musicVolLabel = this.scene.add.text(10, 150, 'Music Volume:', {
      fontSize: '14px',
      color: '#ffffff',
      fontFamily: 'Arial'
    });
    this.menuContainer.add(musicVolLabel);

    if (this.scene.rexUI) {
      this.musicVolumeSlider = this.scene.rexUI.add.slider({
        x: 150,
        y: 165,
        width: 120,
        height: 20,
        orientation: 'horizontal',
        value: this.audioManager.getMusicVolume(),
        valuechangeCallback: (value: number) => {
          this.audioManager.setMusicVolume(value);
        }
      });
      this.musicVolumeSlider.setValue(0.7, 0, 1); // Min 0, Max 1, Default 0.7
      this.menuContainer.add(this.musicVolumeSlider);

      // Music volume value display
      const musicVolValue = this.scene.add.text(280, 150, '0.7', {
        fontSize: '14px',
        color: '#ffff00',
        fontFamily: 'Arial'
      });
      this.menuContainer.add(musicVolValue);

      // Update music volume display
      this.musicVolumeSlider.on('valuechange', (value: number) => {
        musicVolValue.setText(value.toFixed(2));
      });
    }

    // Create metronome toggle button
    const metronomeToggleBg = this.scene.add.rectangle(150, 200, 100, 30, 0x333333);
    this.menuContainer.add(metronomeToggleBg);

    this.metronomeToggle = this.scene.add.text(150, 200, 'Start Metronome', {
      fontSize: '14px',
      color: '#ffffff',
      fontFamily: 'Arial'
    }).setOrigin(0.5, 0.5);
    this.menuContainer.add(this.metronomeToggle);

    // Make metronome toggle interactive
    metronomeToggleBg.setInteractive();
    metronomeToggleBg.on('pointerdown', () => {
      this.toggleMetronome();
    });

    // Create loop selector
    const loopLabel = this.scene.add.text(10, 240, 'Current Loop:', {
      fontSize: '14px',
      color: '#ffffff',
      fontFamily: 'Arial'
    });
    this.menuContainer.add(loopLabel);

    const currentLoop = this.scene.add.text(10, 260, 'No Loop', {
      fontSize: '12px',
      color: '#ffff00',
      fontFamily: 'Arial'
    });
    this.menuContainer.add(currentLoop);

    // Create loop buttons
    const availableLoops = this.audioManager.getAvailableLoops();
    availableLoops.forEach((loop, index) => {
      const loopButton = this.scene.add.rectangle(10 + (index * 60), 290, 50, 25, 0x444444);
      this.menuContainer.add(loopButton);

      const loopButtonText = this.scene.add.text(10 + (index * 60), 290, loop, {
        fontSize: '10px',
        color: '#ffffff',
        fontFamily: 'Arial'
      }).setOrigin(0.5, 0.5);
      this.menuContainer.add(loopButtonText);

      // Make loop button interactive
      loopButton.setInteractive();
      loopButton.on('pointerdown', () => {
        this.audioManager.setLoop(loop);
        currentLoop.setText(loop);
      });
    });

    // Create close button
    const closeButton = this.scene.add.rectangle(280, 20, 20, 20, 0xff0000);
    this.menuContainer.add(closeButton);

    const closeButtonText = this.scene.add.text(280, 20, 'X', {
      fontSize: '14px',
      color: '#ffffff',
      fontFamily: 'Arial'
    }).setOrigin(0.5, 0.5);
    this.menuContainer.add(closeButtonText);

    // Make close button interactive
    closeButton.setInteractive();
    closeButton.on('pointerdown', () => {
      this.hide();
    });

    // Start update timer
    this.startUpdateTimer();
  }

  private startUpdateTimer(): void {
    if (!this.scene) return;

    this.updateTimer = this.scene.time.addEvent({
      delay: 100, // Update every 100ms
      callback: this.updateStatus,
      callbackScope: this,
      loop: true
    });
  }

  private updateStatus(): void {
    if (!this.statusText) return;

    const status = {
      bpm: this.audioManager.getBpm(),
      beatCount: this.audioManager.getBeatCount(),
      measureCount: this.audioManager.getMeasureCount(),
      beatInMeasure: this.audioManager.getBeatInMeasure(),
      currentLoop: this.audioManager.getCurrentLoop(),
      metronomeRunning: this.audioManager.isMetronomeRunning()
    };

    const statusString = `BPM: ${status.bpm}\nBeat: ${status.beatCount} (${status.beatInMeasure + 1}/4)\nMeasure: ${status.measureCount}\nLoop: ${status.currentLoop}\nMetronome: ${status.metronomeRunning ? 'ON' : 'OFF'}`;
    this.statusText.setText(statusString);

    // Update metronome toggle text
    if (this.metronomeToggle) {
      this.metronomeToggle.setText(status.metronomeRunning ? 'Stop Metronome' : 'Start Metronome');
    }
  }

  private toggleMetronome(): void {
    if (this.audioManager.isMetronomeRunning()) {
      this.audioManager.stopMetronome();
    } else {
      this.audioManager.startMetronome();
    }
  }

  public show(): void {
    if (this.menuContainer) {
      this.menuContainer.setVisible(true);
      this.isVisible = true;
    }
  }

  public hide(): void {
    if (this.menuContainer) {
      this.menuContainer.setVisible(false);
      this.isVisible = false;
    }
  }

  public toggle(): void {
    if (this.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  public destroy(): void {
    if (this.updateTimer) {
      this.updateTimer.destroy();
    }
    if (this.menuContainer) {
      this.menuContainer.destroy();
    }
  }
}
