import Phaser from 'phaser';
import { PreloadScene } from './scenes/PreloadScene';
import { BackgroundScene } from './scenes/BackgroundScene';
import { AppScene } from './scenes/AppScene';
import { MenuScene } from './scenes/MenuScene';
import { StoryScene } from './scenes/StoryScene';
import { GameScene } from './scenes/GameScene';
import { FrontseatScene } from './scenes/FrontseatScene';
import { BackseatScene } from './scenes/BackseatScene';
import { MapScene } from './scenes/MapScene';
import { InventoryScene } from './scenes/InventoryScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 360,
  height: 640,
  parent: 'game',
  backgroundColor: '#facade',
  scene: [PreloadScene, BackgroundScene, AppScene, MenuScene, StoryScene, GameScene, FrontseatScene, BackseatScene, MapScene, InventoryScene],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 360,
    height: 640,
    min: {
      width: 180,
      height: 320
    },
    max: {
      width: 720,
      height: 1280
    }
  },
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false
    }
  }
};

new Phaser.Game(config);
