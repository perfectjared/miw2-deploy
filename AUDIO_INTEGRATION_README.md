# Audio Integration - Tone.js Features

This document describes the enhanced audio system that integrates Tone.js features from the `making-it-worse` example app.

## Features Integrated

### 1. Enhanced AudioManager
The `AudioManager` class now includes:

- **Metronome functionality** with BPM control and beat tracking
- **Loop playing and switching** with crossfading
- **Volume controls** for both music and metronome
- **BPM synchronization** between metronome and loops
- **Downbeat transitions** for seamless loop switching

### 2. Metronome Features
- BPM control (default: 166 BPM)
- Beat and measure counting
- Downbeat emphasis (different sound for beat 1)
- Start/stop/pause/resume functionality
- Volume control

### 3. Loop System
- Multiple audio loops can be loaded simultaneously
- Crossfading between loops (time-based or downbeat-synchronized)
- BPM scaling to match metronome tempo
- Seamless switching without audio glitches

### 4. Volume Controls
- Separate volume controls for music and metronome
- Master mute functionality
- Real-time volume adjustment

## Usage

### Basic Setup
```typescript
import { AudioManager } from './src/utils/AudioManager';

const audioManager = AudioManager.getInstance();

// Initialize audio context (call after user interaction)
await audioManager.initializeAudioContext();

// Load music files
await audioManager.loadMusicFiles([
  '80s-noclick-166',
  'stressful-click-166',
  'regular-click-166'
]);

// Start metronome
audioManager.startMetronome();
```

### Controlling Audio
```typescript
// Set BPM
audioManager.setBpm(120);

// Switch loops
audioManager.setLoop('80s-noclick-166');

// Adjust volumes
audioManager.setMetronomeVolume(0.2);
audioManager.setMusicVolume(0.8);

// Control metronome
audioManager.startMetronome();
audioManager.stopMetronome();
audioManager.setMetronomeEnabled(false);
```

### Getting Status
```typescript
// Get current status
const status = {
  bpm: audioManager.getBpm(),
  beatCount: audioManager.getBeatCount(),
  measureCount: audioManager.getMeasureCount(),
  currentLoop: audioManager.getCurrentLoop(),
  availableLoops: audioManager.getAvailableLoops()
};
```

## Audio Files

To use the loop system, you'll need to add audio files to your assets. The system expects files in the format:
- `/assets/music/{filename}.m4a`

Example files from the making-it-worse app:
- `80s-noclick-166.m4a`
- `stressful-click-166.m4a`
- `regular-click-166.m4a`
- `regular-noclick-166.m4a`
- `stressful-noclick-166.m4a`

## Integration with Game Systems

The enhanced AudioManager can be integrated with your existing game systems:

1. **Menu System**: Add audio controls to your menu UI
2. **Game Scenes**: Use the metronome for rhythm-based gameplay
3. **Story System**: Switch loops to match narrative moments
4. **UI System**: Add volume sliders and loop selectors

## Example Implementation

See `src/examples/AudioExample.ts` for a complete example of how to use the enhanced AudioManager.

## Debug Menu

The app includes a built-in audio debug menu that can be accessed by pressing **F12**. This menu provides:

- **BPM Control**: Slider to adjust metronome tempo (40-240 BPM)
- **Volume Controls**: Separate sliders for metronome and music volume
- **Metronome Toggle**: Start/stop the metronome
- **Loop Selection**: Buttons to switch between available audio loops
- **Real-time Status**: Live display of beat count, measure count, and current loop

### Using the Debug Menu

1. **Press F12** to open/close the audio debug menu
2. **Adjust BPM** using the slider (default: 166 BPM)
3. **Control volumes** with the metronome and music sliders
4. **Start/stop metronome** with the toggle button
5. **Switch loops** by clicking the loop buttons
6. **Monitor status** in the real-time display

The debug menu is automatically initialized when the app starts and the metronome begins at 166 BPM.

## Browser Compatibility

- Requires user interaction to start audio context (browser autoplay policies)
- Works on desktop and mobile browsers
- Gracefully handles audio context suspension/resumption
- Includes error handling and recovery mechanisms

## Performance Notes

- All loops are preloaded and kept in memory
- Crossfading uses efficient volume ramping
- Metronome uses lightweight synthesizers
- BPM scaling maintains audio quality within reasonable limits (0.25x to 4x speed)
