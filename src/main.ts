/**
 * MAIN GAME ENTRY POINT
 * 
 * This file initializes the Phaser game engine and sets up all the scenes.
 * It configures the game window, physics, UI plugins, and scene management.
 * 
 * Game Architecture:
 * - PreloadScene: Loads all assets before the game starts
 * - BackgroundScene: Handles background rendering and camera movement
 * - AppScene: Main application controller, manages game state and step counter
 * - MenuScene: Handles all menu interactions (start, pause, save, etc.)
 * - StoryScene: Manages story/narrative elements
 * - GameScene: Core gameplay logic, physics, UI, and interactions
 * 
 * The game uses Matter.js physics for realistic object interactions and
 * RexUI plugin for advanced UI components like sliders and dialogs.
 */

// Import Phaser as ES module
import Phaser from 'phaser';
import rexuiplugin from 'phaser3-rex-plugins/dist/rexuiplugin.js';
import { PreloadScene } from './scenes/PreloadScene';
import { BackgroundScene } from './scenes/BackgroundScene';
import { AppScene } from './scenes/AppScene';
import { MenuScene } from './scenes/MenuScene';
import { StoryScene } from './scenes/StoryScene';
import { GameScene } from './scenes/GameScene';

// Ensure single Phaser instance across Vite HMR reloads
declare global {
  interface Window { __phaserGame?: Phaser.Game; __ENABLE_LOGS?: boolean }
}

// Debug: Check if RexUI is available
//console.log('rexuiplugin available:', rexuiplugin);

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 360,
  height: 640,
  parent: 'game',
  backgroundColor: '#facade',
  scene: [PreloadScene, BackgroundScene, AppScene, MenuScene, StoryScene, GameScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 360,
    height: 640,
    min: {
      width: 180,
      height: 320
    },
    max: {
      width: 720,
      height: 1280
    }
  },
  physics: {
    default: 'matter',
    matter: {
      gravity: { x: 0, y: 0 },
      debug: false
    }
  },
  plugins: {
    scene: [
      {
        key: 'rexUI',
        plugin: rexuiplugin,
        mapping: 'rexUI'
      }
    ]
  },
  // Add proper tab visibility handling
  fps: {
    target: 60,
    forceSetTimeOut: true,
    // Add more robust timing settings
    limit: 60,
    deltaHistory: 10
  },
  // Pause the game when tab loses focus to prevent infinite loops
  // pauseOnBlur: true, // Removed - not a valid Phaser config property
  // pauseOnMinimize: true, // Removed - not a valid Phaser config property
  // Add additional stability settings
  disableContextMenu: true,
  powerPreference: 'high-performance'
};

if (!window.__phaserGame) {
  window.__phaserGame = new Phaser.Game(config);
}

if (import.meta && (import.meta as any).hot) {
  (import.meta as any).hot.dispose(() => {
    try {
      window.__phaserGame?.destroy(true);
    } catch {}
    window.__phaserGame = undefined;
  });
}

// Reduce dev-console overhead: disable verbose logs by default; enable via window.__ENABLE_LOGS=true
(() => {
  const originalLog = console.log.bind(console);
  if (typeof window !== 'undefined') {
    window.__ENABLE_LOGS = true; // Enable logs for debugging
  }
  console.log = (...args: any[]) => {
    if ((window as any)?.__ENABLE_LOGS) {
      originalLog(...args);
    }
  };
  
  // Test that console.log is working
  // console.log('Console.log is now enabled!');
})();
