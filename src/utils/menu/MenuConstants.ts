/**
 * MENU CONSTANTS
 * 
 * Centralized constants for menu priorities and categories
 */

export const MENU_PRIORITIES = {
  START: 200,
  GAME_OVER: 190,
  TURN_KEY: 110,
  PAUSE: 100,
  EXIT: 90,
  SHOP: 80,
  DESTINATION: 70,
  REGION_CHOICE: 60,
  OBSTACLE: 50,
  CYOA: 40,
  STORY: 30,
  NOVEL_STORY: 30,
  STORY_OUTCOME: 30,
  VIRTUAL_PET: 20,
  MORAL_DECISION: 20,
  SAVE: 10,
  POTHOLE: 5,
  TUTORIAL_INTERRUPT: 5,
  STORY_OVERLAY: 5,
  PET_STORY: 5,
  DESTINATION_INFO: 5,
  SHOW: 5,
  BAND_SLIDE: 5
} as const;

export const MENU_CATEGORIES = {
  PERSISTENT: ['START', 'PAUSE', 'GAME_OVER', 'TURN_KEY'],
  TEMPORARY: ['OBSTACLE', 'EXIT', 'SHOP', 'SAVE'],
  ONE_TIME: ['CYOA', 'STORY', 'MORAL_DECISION'],
  OVERLAY: ['TUTORIAL', 'PET_STORY']
} as const;

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
