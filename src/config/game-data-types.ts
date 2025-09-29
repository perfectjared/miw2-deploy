import bandMembersData from './band-members.json';
import itemsData from './items.json';
import destinationActivitiesData from './destination-activities.json';
import connectionsData from './connections.json';

// Band Member Types
export interface BandMemberPreferences {
  food: {
    hotDog: number;
    salty: number;
    sweet: number;
    spicy: number;
    mixed: number;
  };
  weed: {
    joint: number;
    blunt: number;
    bowl: number;
    bong: number;
    vape: number;
    edible: number;
    dab: number;
    pipe: number;
  };
  energyDrink: {
    basic: number;
    premium: number;
    sugarFree: number;
    natural: number;
    vitamin: number;
    herbal: number;
    protein: number;
    focus: number;
    recovery: number;
    thermogenic: number;
    electrolyte: number;
    organic: number;
    keto: number;
    coldBrew: number;
    ultra: number;
  };
  phone: {
    basic: number;
    smartphone: number;
    cracked: number;
    vintage: number;
    broken: number;
    gaming: number;
  };
  decoration: {
    banner: number;
    lighting: number;
    atmosphere: number;
    celebration: number;
    fireworks: number;
    visual: number;
  };
}

export interface MoodSystem {
  current: string;
  priority: string[];
  thresholds: {
    bathroom: number;
    food: number;
    bored: number;
  };
}

export interface StoryProgression {
  current: number;
  max: number;
  unlockThresholds: number[];
}

export interface SpecialTraits {
  boredomDecayRate?: number;
  bathroomDecayRate?: number;
  canCallWife?: boolean;
  phoneEffect?: 'relieveBoredom' | 'addBuzz' | 'callWife';
  sleepProbability?: number;
  awakeReactionFrequency?: number;
  lovesAllSnacks?: boolean;
}

export interface BandMember {
  name: string;
  role: string;
  index: number;
  sprite: string;
  description: string;
  mood: MoodSystem;
  storyProgression: StoryProgression;
  preferences: BandMemberPreferences;
  specialTraits: SpecialTraits;
}

export interface DestinationActivityConfig {
  name: string;
  description: string;
  availableTo: string[];
  effects: {
    bored: number;
    food: number;
  };
  partnerRequired?: boolean;
  bothDoItBonus?: {
    bored: number;
    food: number;
  };
  aloneBonus?: {
    bored: number;
    food: number;
  };
  withOthersPenalty?: {
    bored: number;
    food: number;
  };
}

// Item Types
export interface FoodItem {
  name: string;
  type: string;
  subtypes: string[];
  size: string;
  price: number;
  uses: number;
  value: number;
  rarity: string;
  regional: string;
  description: string;
  sideEffects?: string[];
}

export interface WeedItem {
  name: string;
  type: string;
  subtypes: string[];
  size: string;
  price: number;
  uses: number;
  value: number;
  rarity: string;
  regional: string;
  canBreak: boolean;
  breakChance: number;
  description: string;
  sideEffects?: string[];
}

export interface EnergyDrinkItem {
  name: string;
  type: string;
  subtypes: string[];
  size: string;
  price: number;
  uses: number;
  power: number;
  powerRange: [number, number];
  rarity: string;
  regional: string;
  description: string;
  sideEffects?: string[];
}

export interface PhoneItem {
  name: string;
  type: string;
  size: string;
  price: number;
  batteryCapacity: number;
  batteryDrainRate: number;
  rechargeRate: number;
  brokenPercent: number;
  holdTimeRange: [number, number];
  rarity: string;
  regional: string;
  description: string;
  sideEffects?: string[];
}

export interface DecorationItem {
  name: string;
  type: string;
  subtypes: string[];
  size: string;
  price: number;
  uses: number;
  value: number;
  rechargeTime: number;
  rarity: string;
  regional: string;
  description: string;
  sideEffects?: string[];
}

export type AnyItem = FoodItem | WeedItem | EnergyDrinkItem | PhoneItem | DecorationItem;

// Game Data Structure
export interface GameData {
  bandMembers: Record<string, BandMember>;
  items: {
    food: Record<string, FoodItem>;
    weed: Record<string, WeedItem>;
    energyDrink: Record<string, EnergyDrinkItem>;
    phone: Record<string, PhoneItem>;
    decoration: Record<string, DecorationItem>;
  };
  destinationActivities: Record<string, DestinationActivityConfig>;
  connections: any; // Will be typed based on connections.json structure
}

// Export the loaded data
export const GAME_DATA: GameData = {
  bandMembers: bandMembersData.bandMembers,
  items: itemsData.items,
  destinationActivities: destinationActivitiesData.destinationActivities,
  connections: connectionsData.connections
};

// Helper functions
export function getBandMemberById(id: string): BandMember | undefined {
  return GAME_DATA.bandMembers[id];
}

export function getBandMemberByIndex(index: number): BandMember | undefined {
  return Object.values(GAME_DATA.bandMembers).find(member => member.index === index);
}

export function getDestinationActivityById(id: string): DestinationActivityConfig | undefined {
  return GAME_DATA.destinationActivities[id];
}

export function getAvailableActivitiesForMember(memberId: string): Array<DestinationActivityConfig & { id: string }> {
  return Object.entries(GAME_DATA.destinationActivities)
    .filter(([_, activity]) => activity.availableTo.includes(memberId))
    .map(([id, activity]) => ({ id, ...activity }));
}

// Item helper functions
export function getFoodItem(id: string): FoodItem | undefined {
  return GAME_DATA.items.food[id];
}

export function getWeedItem(id: string): WeedItem | undefined {
  return GAME_DATA.items.weed[id];
}

export function getEnergyDrinkItem(id: string): EnergyDrinkItem | undefined {
  return GAME_DATA.items.energyDrink[id];
}

export function getPhoneItem(id: string): PhoneItem | undefined {
  return GAME_DATA.items.phone[id];
}

export function getDecorationItem(id: string): DecorationItem | undefined {
  return GAME_DATA.items.decoration[id];
}

export function getAllItems(): Record<string, AnyItem> {
  return {
    ...GAME_DATA.items.food,
    ...GAME_DATA.items.weed,
    ...GAME_DATA.items.energyDrink,
    ...GAME_DATA.items.phone,
    ...GAME_DATA.items.decoration
  };
}

// Preference helper functions
export function applyFoodPreference(member: BandMember, itemType: string, baseValue: number): number {
  const preference = member.preferences.food[itemType as keyof typeof member.preferences.food];
  return baseValue * (preference || 1.0);
}

export function applyWeedPreference(member: BandMember, itemType: string, baseValue: number): number {
  const preference = member.preferences.weed[itemType as keyof typeof member.preferences.weed];
  return baseValue * (preference || 1.0);
}

export function applyEnergyDrinkPreference(member: BandMember, itemType: string, baseValue: number): number {
  const preference = member.preferences.energyDrink[itemType as keyof typeof member.preferences.energyDrink];
  return baseValue * (preference || 1.0);
}

export function applyPhonePreference(member: BandMember, itemType: string, baseValue: number): number {
  const preference = member.preferences.phone[itemType as keyof typeof member.preferences.phone];
  return baseValue * (preference || 1.0);
}

export function applyDecorationPreference(member: BandMember, itemType: string, baseValue: number): number {
  const preference = member.preferences.decoration[itemType as keyof typeof member.preferences.decoration];
  return baseValue * (preference || 1.0);
}

// Mood system helper functions
export function calculateMood(member: BandMember, foodValue: number, bathroomValue: number, boredValue: number): string {
  const { priority, thresholds } = member.mood;
  
  for (const priorityType of priority) {
    const threshold = thresholds[priorityType as keyof typeof thresholds];
    const currentValue = priorityType === 'bathroom' ? bathroomValue : 
                        priorityType === 'food' ? foodValue : 
                        priorityType === 'bored' ? boredValue : 1.0;
    
    if (currentValue < threshold) {
      return priorityType;
    }
  }
  
  return 'content';
}

// Story progression helper functions
export function getStoryProgressionForMember(memberId: string): StoryProgression | undefined {
  const member = getBandMemberById(memberId);
  return member?.storyProgression;
}

export function getNextStoryThreshold(memberId: string, currentShow: number): number | undefined {
  const progression = getStoryProgressionForMember(memberId);
  if (!progression) return undefined;
  
  return progression.unlockThresholds.find(threshold => threshold > currentShow);
}

// Level system helper functions
export function getLevelThresholds(): number[] {
  return [3000, 5000, 10000, 20000, 50000];
}

export function getCurrentLevel(monthlyListeners: number): number {
  const thresholds = getLevelThresholds();
  return thresholds.findIndex(threshold => monthlyListeners < threshold) + 1;
}

export function getNextLevelThreshold(monthlyListeners: number): number | undefined {
  const thresholds = getLevelThresholds();
  return thresholds.find(threshold => threshold > monthlyListeners);
}

// Side effects helper functions
export function hasSideEffects(item: AnyItem): boolean {
  return !!(item as any).sideEffects && (item as any).sideEffects.length > 0;
}

export function getSideEffects(item: AnyItem): string[] {
  return (item as any).sideEffects || [];
}

// Regional helper functions
export function getItemsByRegion(region: string): AnyItem[] {
  const allItems = getAllItems();
  return Object.values(allItems).filter(item => item.regional === region);
}

export function getItemsByRarity(rarity: string): AnyItem[] {
  const allItems = getAllItems();
  return Object.values(allItems).filter(item => item.rarity === rarity);
}