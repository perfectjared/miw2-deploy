/**
 * MENU TYPES - Shared interfaces and types for the menu system
 * 
 * This module defines all the shared interfaces, types, and constants
 * used across the menu system components.
 */

import Phaser from 'phaser';

export interface MenuButton {
  text: string;
  onClick: () => void;
  style?: any;
}

export interface MenuConfig {
  title: string;
  subtitle?: string;
  content?: string;
  buttons: MenuButton[];
  width?: number;
  height?: number;
  texts?: string[];
}

export interface MenuStackItem {
  type: string;
  priority: number;
  config?: any;
}

export interface QueuedMenu {
  type: string;
  payload?: any;
}

export interface MenuState {
  currentDialog: any;
  currentDisplayedMenuType: string | null;
  menuStack: MenuStackItem[];
  queuedMenus: QueuedMenu[];
  storySequenceInProgress: boolean;
  destinationSequenceInProgress: boolean;
  postShopSequenceActive: boolean;
  destinationSelectedName: string | null;
  destinationTransitioning: boolean;
  suppressPostCloseProcessingOnce: boolean;
  lastMenuOpenedType: string | null;
  lastMenuOpenTime: number;
  lastClosedMenuType: string | null;
  lastMenuCloseTime: number;
}

// Menu priority ordering (higher number preempts lower)
export const MENU_PRIORITIES = {
  TURN_KEY: 110,       // Highest priority - ignition
  START: 100,          // Start game
  TUTORIAL_INTERRUPT: 95, // Tutorial interrupt modal should preempt lower menus
  PAUSE: 90,           // Pause
  SAVE: 85,            // Save/load menu (high priority for user control)
  REGION_CHOICE: 80,   // Region change choice
  GAME_OVER: 75,       // Game over
  STORY: 74,           // Story content (should NOT be preempted by exit)
  NOVEL_STORY: 74,     // Long-form story; treated same as STORY
  STORY_OUTCOME: 74,   // Story outcome/epilogue; same tier as STORY
  EXIT: 73,            // Exit choice (should interrupt CYOA only)
  CYOA: 70,            // Choose-your-own-adventure
  DESTINATION: 65,     // Trip planning
  DESTINATION_INFO: 66, // "you went to the …" confirmation window
  SHOW: 66,            // Simple show window after destination
  BAND_SLIDE: 66,      // Band members slow slide
  OBSTACLE: 60,        // Collision/obstacle
  POTHOLE: 55,         // Pothole collision (lower than obstacle)
  SHOP: 73,            // Shop (paired with exit flow)
  VIRTUAL_PET: 45,     // Pet UI
  MORAL_DECISION: 45,  // Moral decision
  PET_STORY: 40,       // Pet story overlay
  TUTORIAL: 20         // Passive tutorial overlay
} as const;

// Menu Categories - Simplified cleanup rules
export const MENU_CATEGORIES = {
  PERSISTENT: ['START', 'PAUSE', 'GAME_OVER', 'TURN_KEY'], // Menus that should be restored
  TEMPORARY: ['OBSTACLE', 'EXIT', 'SHOP', 'SAVE'], // Menus that can be restored but are context-dependent
  ONE_TIME: ['CYOA', 'STORY', 'NOVEL_STORY', 'STORY_OUTCOME', 'DESTINATION', 'DESTINATION_INFO', 'SHOW', 'BAND_SLIDE', 'MORAL_DECISION', 'REGION_CHOICE'], // Menus that should never be restored
  OVERLAY: ['TUTORIAL', 'PET_STORY'] // Non-blocking overlays
} as const;

export type MenuType = keyof typeof MENU_PRIORITIES;
export type MenuCategory = keyof typeof MENU_CATEGORIES;
