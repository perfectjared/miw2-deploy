import bandMembersConfig from './band-members.json';

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

export interface SpecialTraits {
  boredomDecayRate?: number;
  bathroomDecayRate?: number;
  canCallWife?: boolean;
  phoneEffect?: 'relieveBoredom' | 'addBuzz' | 'callWife';
  sleepProbability?: number;
  awakeReactionFrequency?: number;
  lovesAllSnacks?: boolean;
}

export interface DestinationActivity {
  id: string;
  name: string;
  description: string;
  effects: {
    bored: number;
    food: number;
  };
  requiresPartner?: string;
  partnerActivity?: string;
  aloneBonus?: {
    bored: number;
    food: number;
  };
  withOthersPenalty?: {
    bored: number;
    food: number;
  };
}

export interface BandMember {
  id: string;
  name: string;
  role: string;
  index: number;
  preferences: BandMemberPreferences;
  specialTraits: SpecialTraits;
  destinationActivities: DestinationActivity[];
}

export interface DestinationActivityConfig {
  id: string;
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

export const BAND_MEMBERS: BandMember[] = Object.values(bandMembersConfig.bandMembers);
// Note: destinationActivities moved to separate file
export const DESTINATION_ACTIVITIES: DestinationActivityConfig[] = [];

export function getBandMemberById(id: string): BandMember | undefined {
  return BAND_MEMBERS.find(member => member.id === id);
}

export function getBandMemberByIndex(index: number): BandMember | undefined {
  return BAND_MEMBERS.find(member => member.index === index);
}

export function getDestinationActivityById(id: string): DestinationActivityConfig | undefined {
  return DESTINATION_ACTIVITIES.find(activity => activity.id === id);
}

export function getAvailableActivitiesForMember(memberId: string): DestinationActivityConfig[] {
  return DESTINATION_ACTIVITIES.filter(activity => 
    activity.availableTo.includes(memberId)
  );
}

// Helper functions for applying preferences
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
