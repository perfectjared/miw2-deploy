import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import gameDataSchema from './game-data-schema.json';

const ajv = new Ajv({ allErrors: true, useDefaults: true });
addFormats(ajv);

export interface ValidationResult {
  valid: boolean;
  errors?: string[];
  data?: any;
}

export interface DefaultValues {
  bandMembers: Record<string, any>;
  items: Record<string, any>;
  destinationActivities: Record<string, any>;
}

/**
 * Validates game data against schema and applies default values
 */
export function validateGameData(data: any): ValidationResult {
  const validate = ajv.compile(gameDataSchema);
  const valid = validate(data);
  
  if (!valid) {
    return {
      valid: false,
      errors: validate.errors?.map(error => `${error.instancePath}: ${error.message}`) || []
    };
  }
  
  return {
    valid: true,
    data: data
  };
}

/**
 * Loads and validates game data with fallback to defaults
 */
export function loadGameDataWithDefaults(
  bandMembersData: any,
  itemsData: any,
  destinationActivitiesData: any
): ValidationResult {
  const combinedData = {
    bandMembers: bandMembersData.bandMembers || {},
    items: itemsData.items || {},
    destinationActivities: destinationActivitiesData.destinationActivities || {}
  };
  
  return validateGameData(combinedData);
}

/**
 * Applies default values to missing or invalid data
 */
export function applyDefaults(data: any): any {
  const defaults: DefaultValues = {
    bandMembers: {},
    items: {
      food: {},
      weed: {},
      energyDrink: {},
      phone: {},
      decoration: {}
    },
    destinationActivities: {}
  };
  
  // Apply defaults for band members
  for (const [id, member] of Object.entries(data.bandMembers || {})) {
    defaults.bandMembers[id] = {
      name: (member as any).name || `Band Member ${id}`,
      role: (member as any).role || 'Unknown',
      index: (member as any).index || 0,
      sprite: (member as any).sprite || 'x.png',
      description: (member as any).description || '',
      mood: {
        current: (member as any).mood?.current || 'content',
        priority: (member as any).mood?.priority || ['bathroom', 'food', 'bored'],
        thresholds: {
          bathroom: (member as any).mood?.thresholds?.bathroom || 0.3,
          food: (member as any).mood?.thresholds?.food || 0.5,
          bored: (member as any).mood?.thresholds?.bored || 0.5
        }
      },
      storyProgression: {
        current: (member as any).storyProgression?.current || 1,
        max: (member as any).storyProgression?.max || 3,
        unlockThresholds: (member as any).storyProgression?.unlockThresholds || [1, 5, 10]
      },
      preferences: {
        food: {
          hotDog: (member as any).preferences?.food?.hotDog || 1.0,
          salty: (member as any).preferences?.food?.salty || 1.0,
          sweet: (member as any).preferences?.food?.sweet || 1.0,
          spicy: (member as any).preferences?.food?.spicy || 1.0,
          mixed: (member as any).preferences?.food?.mixed || 1.0
        },
        weed: {
          joint: (member as any).preferences?.weed?.joint || 1.0,
          blunt: (member as any).preferences?.weed?.blunt || 1.0,
          bowl: (member as any).preferences?.weed?.bowl || 1.0,
          bong: (member as any).preferences?.weed?.bong || 1.0,
          vape: (member as any).preferences?.weed?.vape || 1.0,
          edible: (member as any).preferences?.weed?.edible || 1.0,
          dab: (member as any).preferences?.weed?.dab || 1.0,
          pipe: (member as any).preferences?.weed?.pipe || 1.0
        },
        energyDrink: {
          basic: (member as any).preferences?.energyDrink?.basic || 1.0,
          premium: (member as any).preferences?.energyDrink?.premium || 1.0,
          sugarFree: (member as any).preferences?.energyDrink?.sugarFree || 1.0,
          natural: (member as any).preferences?.energyDrink?.natural || 1.0,
          vitamin: (member as any).preferences?.energyDrink?.vitamin || 1.0,
          herbal: (member as any).preferences?.energyDrink?.herbal || 1.0,
          protein: (member as any).preferences?.energyDrink?.protein || 1.0,
          focus: (member as any).preferences?.energyDrink?.focus || 1.0,
          recovery: (member as any).preferences?.energyDrink?.recovery || 1.0,
          thermogenic: (member as any).preferences?.energyDrink?.thermogenic || 1.0,
          electrolyte: (member as any).preferences?.energyDrink?.electrolyte || 1.0,
          organic: (member as any).preferences?.energyDrink?.organic || 1.0,
          keto: (member as any).preferences?.energyDrink?.keto || 1.0,
          coldBrew: (member as any).preferences?.energyDrink?.coldBrew || 1.0,
          ultra: (member as any).preferences?.energyDrink?.ultra || 1.0
        },
        phone: {
          basic: (member as any).preferences?.phone?.basic || 1.0,
          smartphone: (member as any).preferences?.phone?.smartphone || 1.0,
          cracked: (member as any).preferences?.phone?.cracked || 1.0,
          vintage: (member as any).preferences?.phone?.vintage || 1.0,
          broken: (member as any).preferences?.phone?.broken || 1.0,
          gaming: (member as any).preferences?.phone?.gaming || 1.0
        },
        decoration: {
          banner: (member as any).preferences?.decoration?.banner || 1.0,
          lighting: (member as any).preferences?.decoration?.lighting || 1.0,
          atmosphere: (member as any).preferences?.decoration?.atmosphere || 1.0,
          celebration: (member as any).preferences?.decoration?.celebration || 1.0,
          fireworks: (member as any).preferences?.decoration?.fireworks || 1.0,
          visual: (member as any).preferences?.decoration?.visual || 1.0
        }
      },
      specialTraits: {
        boredomDecayRate: (member as any).specialTraits?.boredomDecayRate || 1.0,
        bathroomDecayRate: (member as any).specialTraits?.bathroomDecayRate || 1.0,
        canCallWife: (member as any).specialTraits?.canCallWife || false,
        phoneEffect: (member as any).specialTraits?.phoneEffect || 'normal',
        sleepProbability: (member as any).specialTraits?.sleepProbability || 0.0,
        awakeReactionFrequency: (member as any).specialTraits?.awakeReactionFrequency || 1.0,
        lovesAllSnacks: (member as any).specialTraits?.lovesAllSnacks || false
      }
    };
  }
  
  // Apply defaults for items
  const itemCategories = ['food', 'weed', 'energyDrink', 'phone', 'decoration'];
  for (const category of itemCategories) {
    for (const [id, item] of Object.entries((data.items || {})[category] || {})) {
      defaults.items[category][id] = {
        name: (item as any).name || `Item ${id}`,
        type: (item as any).type || category,
        subtypes: (item as any).subtypes || [],
        size: (item as any).size || 'medium',
        price: (item as any).price || 0,
        uses: (item as any).uses || 1,
        value: (item as any).value || 0,
        rarity: (item as any).rarity || 'common',
        regional: (item as any).regional || 'midwest',
        description: (item as any).description || '',
        sideEffects: (item as any).sideEffects || [],
        // Category-specific defaults
        ...(category === 'weed' && {
          canBreak: (item as any).canBreak || false,
          breakChance: (item as any).breakChance || 0
        }),
        ...(category === 'energyDrink' && {
          power: (item as any).power || 0,
          powerRange: (item as any).powerRange || [0, 0]
        }),
        ...(category === 'phone' && {
          batteryCapacity: (item as any).batteryCapacity || 100,
          batteryDrainRate: (item as any).batteryDrainRate || 10,
          rechargeRate: (item as any).rechargeRate || 2,
          brokenPercent: (item as any).brokenPercent || 0,
          holdTimeRange: (item as any).holdTimeRange || [10, 20]
        }),
        ...(category === 'decoration' && {
          rechargeTime: (item as any).rechargeTime || 300
        })
      };
    }
  }
  
  // Apply defaults for destination activities
  for (const [id, activity] of Object.entries(data.destinationActivities || {})) {
    defaults.destinationActivities[id] = {
      name: (activity as any).name || `Activity ${id}`,
      description: (activity as any).description || '',
      availableTo: (activity as any).availableTo || [],
      effects: {
        bored: (activity as any).effects?.bored || 0,
        food: (activity as any).effects?.food || 0
      },
      partnerRequired: (activity as any).partnerRequired || false,
      bothDoItBonus: (activity as any).bothDoItBonus || undefined,
      aloneBonus: (activity as any).aloneBonus || undefined,
      withOthersPenalty: (activity as any).withOthersPenalty || undefined
    };
  }
  
  return defaults;
}

/**
 * Safely loads game data with validation and defaults
 */
export function safeLoadGameData(
  bandMembersData: any,
  itemsData: any,
  destinationActivitiesData: any
): any {
  const validation = loadGameDataWithDefaults(bandMembersData, itemsData, destinationActivitiesData);
  
  if (validation.valid) {
    return validation.data;
  }
  
  console.warn('Game data validation failed, applying defaults:', validation.errors);
  return applyDefaults({
    bandMembers: bandMembersData.bandMembers || {},
    items: itemsData.items || {},
    destinationActivities: destinationActivitiesData.destinationActivities || {}
  });
}
