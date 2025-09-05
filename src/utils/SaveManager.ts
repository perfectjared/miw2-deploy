export interface SaveData {
  steps: number;
  timestamp: string;
  version: string;
}

export class SaveManager {
  private static instance: SaveManager;
  private readonly SAVE_KEY = 'game-fast-save';
  private readonly SAVE_VERSION = '1.0.0';

  private constructor() {}

  public static getInstance(): SaveManager {
    if (!SaveManager.instance) {
      SaveManager.instance = new SaveManager();
    }
    return SaveManager.instance;
  }

  public save(steps: number): boolean {
    try {
      const saveData: SaveData = {
        steps: steps,
        timestamp: new Date().toISOString(),
        version: this.SAVE_VERSION
      };

      const jsonString = JSON.stringify(saveData, null, 2);
      localStorage.setItem(this.SAVE_KEY, jsonString);
      
      console.log('Game saved successfully:', saveData);
      return true;
    } catch (error) {
      console.error('Failed to save game:', error);
      return false;
    }
  }

  public load(): SaveData | null {
    try {
      const savedData = localStorage.getItem(this.SAVE_KEY);
      if (!savedData) {
        console.log('No save data found');
        return null;
      }

      const saveData: SaveData = JSON.parse(savedData);
      
      // Check if save version is compatible
      if (saveData.version !== this.SAVE_VERSION) {
        console.warn('Save version mismatch. Expected:', this.SAVE_VERSION, 'Found:', saveData.version);
        // For now, we'll still load it, but in the future we might want to handle version migration
      }

      console.log('Game loaded successfully:', saveData);
      return saveData;
    } catch (error) {
      console.error('Failed to load game:', error);
      return null;
    }
  }

  public clearSave(): boolean {
    try {
      localStorage.removeItem(this.SAVE_KEY);
      console.log('Save data cleared successfully');
      return true;
    } catch (error) {
      console.error('Failed to clear save data:', error);
      return false;
    }
  }

  public hasSave(): boolean {
    return localStorage.getItem(this.SAVE_KEY) !== null;
  }

  public getSaveInfo(): { exists: boolean; timestamp?: string; steps?: number } {
    const saveData = this.load();
    if (saveData) {
      return {
        exists: true,
        timestamp: saveData.timestamp,
        steps: saveData.steps
      };
    }
    return { exists: false };
  }
}
