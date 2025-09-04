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
