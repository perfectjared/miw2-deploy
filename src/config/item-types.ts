import foodItemsConfig from './food-items.json';
import phoneItemsConfig from './phone-items.json';
import weedItemsConfig from './weed-items.json';
import drinkItemsConfig from './drink-items.json';
import decorationItemsConfig from './decoration-items.json';

export interface BaseItem {
  id: string;
  name: string;
  type: string;
  size: 'small' | 'medium' | 'large';
  price: number;
  description: string;
}

export interface FoodItem extends BaseItem {
  type: 'Food';
  subtypes: string[];
  uses: number;
  value: number;
}

export interface PhoneItem extends BaseItem {
  type: 'Phone';
  batteryCapacity: number;
  batteryDrainRate: number;
  rechargeRate: number;
  brokenPercent: number;
  holdTimeMin: number;
  holdTimeMax: number;
}

export interface WeedItem extends BaseItem {
  type: 'Weed';
  subtypes: string[];
  uses: number;
  value: number;
  canBreak: boolean;
  breakChance?: number;
}

export interface DrinkItem extends BaseItem {
  type: 'Energy Drink';
  subtypes: string[];
  uses: number;
  power: number;
  powerRange: [number, number];
}

export interface DecorationItem extends BaseItem {
  type: 'Decoration';
  subtypes: string[];
  rechargeTime: number;
  showEffect: string;
  effectValue: number;
}

export type GameItem = FoodItem | PhoneItem | WeedItem | DrinkItem | DecorationItem;

export interface SizeDefinition {
  radius: number;
  mass: number;
  restitution: number;
}

export interface ItemTypeConfig {
  color: number;
  effect: Record<string, number>;
}

export const ITEM_TYPES: Record<string, ItemTypeConfig> = {
  Food: { color: 0xff5555, effect: { hunger: +3 } },
  Phone: { color: 0x00aaff, effect: { focus: -1 } },
  Weed: { color: 0x33cc66, effect: { chill: +2 } },
  Drink: { color: 0xaa55ff, effect: { energy: +2 } },
  Decoration: { color: 0xff69b4, effect: { spectacle: +5 } }
};

export const SIZE_DEFINITIONS: Record<string, SizeDefinition> = {
  small: { radius: 15, mass: 0.5, restitution: 0.3 },
  medium: { radius: 20, mass: 1.0, restitution: 0.4 },
  large: { radius: 25, mass: 1.5, restitution: 0.5 }
};

export const FOOD_ITEMS: FoodItem[] = Object.values(foodItemsConfig.items.food);
export const PHONE_ITEMS: PhoneItem[] = Object.values(phoneItemsConfig.items.phone);
export const WEED_ITEMS: WeedItem[] = Object.values(weedItemsConfig.items.weed);
export const DRINK_ITEMS: DrinkItem[] = Object.values(drinkItemsConfig.items.energyDrink);
export const DECORATION_ITEMS: DecorationItem[] = Object.values(decorationItemsConfig.items.decoration);

export const ALL_ITEMS: GameItem[] = [
  ...FOOD_ITEMS,
  ...PHONE_ITEMS,
  ...WEED_ITEMS,
  ...DRINK_ITEMS,
  ...DECORATION_ITEMS
];

export function getItemById(id: string): GameItem | undefined {
  return ALL_ITEMS.find(item => item.id === id);
}

export function getItemsByType(type: string): GameItem[] {
  return ALL_ITEMS.filter(item => item.type === type);
}

export function getSizeDefinition(size: string): SizeDefinition {
  return SIZE_DEFINITIONS[size] || SIZE_DEFINITIONS.medium;
}

export function getItemTypeConfig(type: string): ItemTypeConfig {
  return ITEM_TYPES[type] || ITEM_TYPES.Food;
}

// Random name generators
export function generateStrainName(): string {
  const prefixes = weedItemsConfig.strainNames.prefixes;
  const suffixes = weedItemsConfig.strainNames.suffixes;
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
  return `${prefix} ${suffix}`;
}

export function generateEnergyDrinkName(): string {
  const prefixes = drinkItemsConfig.energyDrinkNames.prefixes;
  const suffixes = drinkItemsConfig.energyDrinkNames.suffixes;
  const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
  const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
  return `${prefix} ${suffix}`;
}

// Random value generators
export function getRandomPowerValue(drinkItem: DrinkItem): number {
  const [min, max] = drinkItem.powerRange;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
