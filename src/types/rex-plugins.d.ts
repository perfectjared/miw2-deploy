/**
 * REX PLUGINS TYPE DEFINITIONS
 * 
 * This file provides TypeScript type definitions for the RexUI plugin
 * system. It extends Phaser's Scene interface to include RexUI functionality
 * and declares the module for the RexUI plugin.
 * 
 * Key Features:
 * - RexUI plugin type declarations
 * - Scene interface extensions for RexUI
 * - Module declarations for external plugin
 * - Type safety for RexUI components
 * 
 * These definitions ensure proper TypeScript support for RexUI components
 * like sliders, dialogs, and other advanced UI elements.
 */

declare namespace Phaser {
  interface Scene {
    rexUI: {
      add: {
        textPlayer: (config?: any) => any;
      };
    };
  }
}

declare module 'phaser3-rex-plugins/dist/rexuiplugin.js';
