/**
 * POLKA ANIMATION CONTROLLER
 * 
 * Utility functions to control polka dot animations from within Phaser scenes
 */

import { polkaBackground } from './PolkaBackground';

export class PolkaController {
  /**
   * Trigger a step animation
   */
  static triggerWave() {
    polkaBackground.step();
  }

  /**
   * Pulse all dots simultaneously
   */
  static pulse() {
    polkaBackground.step();
  }

  /**
   * Trigger wave on game events
   */
  static onGameStart() {
    polkaBackground.step();
  }

  /**
   * Pulse on menu interactions
   */
  static onMenuClick() {
    polkaBackground.step();
  }

  /**
   * Custom animation for specific game events
   */
  static onScoreIncrease() {
    // Quick pulse with shorter duration
    polkaBackground.step();
  }

  /**
   * Gentle pulse for background ambience
   */
  static ambientPulse() {
    // This could be called on a timer for ambient animation
    setTimeout(() => {
      polkaBackground.step();
    }, Math.random() * 10000 + 5000); // Random delay 5-15 seconds
  }
}

// Auto-start ambient animations
setInterval(() => {
  PolkaController.ambientPulse();
}, 15000); // Every 15 seconds
