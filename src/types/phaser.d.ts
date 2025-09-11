/**
 * PHASER TYPE DEFINITIONS
 * 
 * This file provides TypeScript type definitions for Phaser.js and the
 * RexUI plugin. It extends the global Window interface to include
 * the Phaser engine and RexUI plugin that are loaded via script tags.
 * 
 * Key Features:
 * - Global Phaser type declarations
 * - RexUI plugin type extensions
 * - Scene interface extensions for RexUI
 * - Type safety for external libraries
 * 
 * These definitions ensure proper TypeScript support for the Phaser
 * game engine and RexUI plugin throughout the application.
 */

// Phaser is loaded globally via script tag

declare global {
  interface Window {
    rexuiplugin: any;
    Phaser: any;
  }
}

declare module 'phaser' {
  namespace Scene {
    interface Scene {
      rexUI: any;
    }
  }
}

// Make Phaser available globally
declare const Phaser: any;
