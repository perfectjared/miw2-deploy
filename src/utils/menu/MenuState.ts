/**
 * MENU STATE - Centralized state management for the menu system
 * 
 * This module manages all menu-related state in a centralized, predictable way.
 * It provides a clean interface for state updates and queries.
 */

import { MenuState as IMenuState, MenuType, MenuStackItem } from './MenuTypes';

export class MenuState {
  private state: IMenuState;

  constructor() {
    this.state = {
      currentDialog: null,
      currentDisplayedMenuType: null,
      menuStack: [],
      queuedMenus: [],
      storySequenceInProgress: false,
      destinationSequenceInProgress: false,
      postShopSequenceActive: false,
      destinationSelectedName: null,
      destinationTransitioning: false,
      suppressPostCloseProcessingOnce: false,
      lastMenuOpenedType: null,
      lastMenuOpenTime: 0,
      lastClosedMenuType: null,
      lastMenuCloseTime: 0
    };
  }

  // Dialog management
  getCurrentDialog(): any {
    return this.state.currentDialog;
  }

  setCurrentDialog(dialog: any): void {
    this.state.currentDialog = dialog;
  }

  clearCurrentDialog(): void {
    this.state.currentDialog = null;
  }

  // Current menu type
  getCurrentDisplayedMenuType(): string | null {
    return this.state.currentDisplayedMenuType;
  }

  setCurrentDisplayedMenuType(menuType: string | null): void {
    this.state.currentDisplayedMenuType = menuType;
  }

  // Menu stack
  getMenuStack(): MenuStackItem[] {
    return [...this.state.menuStack];
  }

  setMenuStack(stack: MenuStackItem[]): void {
    this.state.menuStack = [...stack];
  }

  // Queued menus
  getQueuedMenus(): any[] {
    return [...this.state.queuedMenus];
  }

  setQueuedMenus(queued: any[]): void {
    this.state.queuedMenus = [...queued];
  }

  // Story sequence
  isStorySequenceInProgress(): boolean {
    return this.state.storySequenceInProgress;
  }

  setStorySequenceInProgress(inProgress: boolean): void {
    this.state.storySequenceInProgress = inProgress;
  }

  // Destination sequence
  isDestinationSequenceInProgress(): boolean {
    return this.state.destinationSequenceInProgress;
  }

  setDestinationSequenceInProgress(inProgress: boolean): void {
    this.state.destinationSequenceInProgress = inProgress;
  }

  getDestinationSelectedName(): string | null {
    return this.state.destinationSelectedName;
  }

  setDestinationSelectedName(name: string | null): void {
    this.state.destinationSelectedName = name;
  }

  isDestinationTransitioning(): boolean {
    return this.state.destinationTransitioning;
  }

  setDestinationTransitioning(transitioning: boolean): void {
    this.state.destinationTransitioning = transitioning;
  }

  // Post-shop sequence
  isPostShopSequenceActive(): boolean {
    return this.state.postShopSequenceActive;
  }

  setPostShopSequenceActive(active: boolean): void {
    this.state.postShopSequenceActive = active;
  }

  // Suppression flags
  shouldSuppressPostCloseProcessingOnce(): boolean {
    return this.state.suppressPostCloseProcessingOnce;
  }

  setSuppressPostCloseProcessingOnce(suppress: boolean): void {
    this.state.suppressPostCloseProcessingOnce = suppress;
  }

  // Menu timing
  getLastMenuOpenedType(): string | null {
    return this.state.lastMenuOpenedType;
  }

  setLastMenuOpenedType(menuType: string | null): void {
    this.state.lastMenuOpenedType = menuType;
  }

  getLastMenuOpenTime(): number {
    return this.state.lastMenuOpenTime;
  }

  setLastMenuOpenTime(time: number): void {
    this.state.lastMenuOpenTime = time;
  }

  getLastClosedMenuType(): string | null {
    return this.state.lastClosedMenuType;
  }

  setLastClosedMenuType(menuType: string | null): void {
    this.state.lastClosedMenuType = menuType;
  }

  getLastMenuCloseTime(): number {
    return this.state.lastMenuCloseTime;
  }

  setLastMenuCloseTime(time: number): void {
    this.state.lastMenuCloseTime = time;
  }

  // Utility methods
  isExitOrShopOpen(): boolean {
    const active = this.state.currentDisplayedMenuType === 'EXIT' || 
                   this.state.currentDisplayedMenuType === 'SHOP';
    if (active) return true;
    return this.state.menuStack.some(m => m.type === 'EXIT' || m.type === 'SHOP');
  }

  canPauseNow(): boolean {
    const currentMenu = this.state.menuStack[this.state.menuStack.length - 1];
    const activeType = this.state.currentDisplayedMenuType || currentMenu?.type || null;
    const blockingTypes = ['EXIT', 'SHOP', 'CYOA', 'DESTINATION', 'REGION_CHOICE', 'STORY', 'NOVEL_STORY', 'STORY_OUTCOME', 'VIRTUAL_PET'];
    if (activeType && blockingTypes.includes(activeType)) {
      return false;
    }
    return true;
  }

  // Get full state for debugging
  getFullState(): IMenuState {
    return { ...this.state };
  }

  // Reset all state
  reset(): void {
    this.state = {
      currentDialog: null,
      currentDisplayedMenuType: null,
      menuStack: [],
      queuedMenus: [],
      storySequenceInProgress: false,
      destinationSequenceInProgress: false,
      postShopSequenceActive: false,
      destinationSelectedName: null,
      destinationTransitioning: false,
      suppressPostCloseProcessingOnce: false,
      lastMenuOpenedType: null,
      lastMenuOpenTime: 0,
      lastClosedMenuType: null,
      lastMenuCloseTime: 0
    };
  }
}
