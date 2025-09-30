/**
 * MENU STATE MANAGER
 * 
 * Handles all menu state management including:
 * - Menu stack management
 * - Queue management
 * - State tracking
 * - Priority checking
 */

import { MENU_PRIORITIES, MENU_CATEGORIES } from './MenuConstants';

export interface MenuStackItem {
  type: string;
  priority: number;
  config?: any;
}

export interface QueuedMenu {
  type: string;
  payload?: any;
}

export class MenuStateManager {
  private menuStack: MenuStackItem[] = [];
  private currentDisplayedMenuType: string | null = null;
  private queuedMenus: QueuedMenu[] = [];
  private userDismissedMenuType: string | null = null;
  private storySequenceInProgress: boolean = false;
  private destinationSequenceInProgress: boolean = false;
  private destinationTransitioning: boolean = false;
  private destinationSelectedName: string | null = null;
  private postShopSequenceActive: boolean = false;
  private postShopSequenceStage: string = 'idle';
  private lastClosedMenuType: string | null = null;
  private lastMenuCloseTime: number = 0;
  private lastMenuOpenedType: string | null = null;
  private lastMenuOpenTime: number = 0;
  private suppressPostCloseProcessingOnce: boolean = false;

  // Getters
  get stack(): MenuStackItem[] { return [...this.menuStack]; }
  get currentMenuType(): string | null { return this.currentDisplayedMenuType; }
  get queue(): QueuedMenu[] { return [...this.queuedMenus]; }
  get isStorySequenceActive(): boolean { return this.storySequenceInProgress; }
  get isDestinationSequenceActive(): boolean { return this.destinationSequenceInProgress; }
  get isDestinationTransitioning(): boolean { return this.destinationTransitioning; }
  get selectedDestinationName(): string | null { return this.destinationSelectedName; }
  get isPostShopSequenceActive(): boolean { return this.postShopSequenceActive; }
  get postShopStage(): string { return this.postShopSequenceStage; }

  // Stack management
  pushMenu(type: string, config?: any): void {
    const priority = MENU_PRIORITIES[type as keyof typeof MENU_PRIORITIES];
    if (priority) {
      this.menuStack.push({ type, priority, config });
      console.log(`📚 Pushed ${type} menu (priority ${priority}) to stack`);
    }
  }

  popMenu(): MenuStackItem | null {
    return this.menuStack.pop() || null;
  }

  popSpecificMenu(menuType: string): MenuStackItem | null {
    const index = this.menuStack.findIndex(menu => menu.type === menuType);
    if (index !== -1) {
      const popped = this.menuStack.splice(index, 1)[0];
      console.log(`🗑️ Popped ${menuType} menu from stack`);
      return popped;
    }
    return null;
  }

  clearMenusFromStack(menuType: string): void {
    const initialLength = this.menuStack.length;
    this.menuStack = this.menuStack.filter(menu => menu.type !== menuType);
    const removedCount = initialLength - this.menuStack.length;
    if (removedCount > 0) {
      console.log(`Cleared ${removedCount} ${menuType} menu(s) from stack`);
    }
  }

  // Queue management
  enqueueMenu(menuType: string, payload?: any): void {
    const alreadyQueued = this.queuedMenus.some(queued => queued.type === menuType);
    if (alreadyQueued) {
      console.log(`⏳ Menu '${menuType}' already queued, skipping duplicate`);
      return;
    }
    
    console.log(`⏳ Queueing menu '${menuType}'`);
    this.queuedMenus.push({ type: menuType, payload });
  }

  dequeueMenu(): QueuedMenu | null {
    return this.queuedMenus.shift() || null;
  }

  clearQueue(): void {
    this.queuedMenus = [];
  }

  // State management
  setCurrentMenuType(type: string | null): void {
    this.currentDisplayedMenuType = type;
  }

  setUserDismissedMenuType(type: string | null): void {
    this.userDismissedMenuType = type;
  }

  setStorySequenceInProgress(inProgress: boolean): void {
    this.storySequenceInProgress = inProgress;
  }

  setDestinationSequenceInProgress(inProgress: boolean): void {
    this.destinationSequenceInProgress = inProgress;
  }

  setDestinationTransitioning(transitioning: boolean): void {
    this.destinationTransitioning = transitioning;
  }

  setDestinationSelectedName(name: string | null): void {
    this.destinationSelectedName = name;
  }

  setPostShopSequenceActive(active: boolean): void {
    this.postShopSequenceActive = active;
  }

  setPostShopSequenceStage(stage: string): void {
    this.postShopSequenceStage = stage;
  }

  setLastClosedMenu(type: string | null, time: number): void {
    this.lastClosedMenuType = type;
    this.lastMenuCloseTime = time;
  }

  setLastOpenedMenu(type: string | null, time: number): void {
    this.lastMenuOpenedType = type;
    this.lastMenuOpenTime = time;
  }

  setSuppressPostCloseProcessingOnce(suppress: boolean): void {
    this.suppressPostCloseProcessingOnce = suppress;
  }

  // Utility methods
  canShowMenu(menuType: string): boolean {
    const newPriority = MENU_PRIORITIES[menuType as keyof typeof MENU_PRIORITIES];
    if (!newPriority) return true;
    
    const currentMenu = this.menuStack[this.menuStack.length - 1];
    
    // Special case: PAUSE menu
    if (menuType === 'PAUSE') {
      if (this.currentDisplayedMenuType || this.menuStack.length > 0) {
        console.log(`🚫 Cannot show PAUSE - menu active: '${this.currentDisplayedMenuType}'`);
        return false;
      }
    }
    
    if (currentMenu && currentMenu.priority > newPriority) {
      console.log(`🚫 Cannot show ${menuType} (priority ${newPriority}) - blocked by ${currentMenu.type} (priority ${currentMenu.priority})`);
      return false;
    }
    
    return true;
  }

  shouldRestorePreviousMenu(): boolean {
    if (this.menuStack.length === 0) return false;
    
    const menuToRestore = this.menuStack[this.menuStack.length - 1];
    
    // Never restore certain menu types
    if (['CYOA', 'PAUSE'].includes(menuToRestore.type)) {
      return false;
    }
    
    // Only restore persistent menus
    const isPersistent = MENU_CATEGORIES.PERSISTENT.includes(menuToRestore.type);
    const isExitAfterShop = menuToRestore.type === 'EXIT' && this.userDismissedMenuType === 'SHOP';
    
    if (!isPersistent && !isExitAfterShop) {
      return false;
    }
    
    // Don't restore if user explicitly dismissed this menu type
    if (menuToRestore.type === this.userDismissedMenuType) {
      return false;
    }
    
    return true;
  }

  isExitOrShopOpen(): boolean {
    return this.currentDisplayedMenuType === 'EXIT' || 
           this.currentDisplayedMenuType === 'SHOP' ||
           this.menuStack.some(m => m.type === 'EXIT' || m.type === 'SHOP');
  }

  getStackState(): string {
    if (this.menuStack.length === 0) return 'Empty stack';
    return this.menuStack.map(m => `${m.type}(${m.priority})`).join(' → ');
  }
}
