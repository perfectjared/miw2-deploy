import Phaser from 'phaser';
import { GameConfig } from '../config/ConfigLoader';

export interface MenuButton {
  text: string;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  onClick: () => void;
  style?: Phaser.Types.GameObjects.Text.TextStyle;
}

export interface MenuText {
  text: string;
  x?: number;
  y?: number;
  style?: Phaser.Types.GameObjects.Text.TextStyle;
  origin?: { x: number; y: number };
}

export interface MenuConfig {
  title?: string;
  layerText?: string;
  buttons?: MenuButton[];
  texts?: MenuText[];
  customElements?: () => Phaser.GameObjects.GameObject[];
}

export class MenuBuilder {
  private scene: Phaser.Scene;
  private config: GameConfig;
  private elements: Phaser.GameObjects.GameObject[] = [];

  constructor(scene: Phaser.Scene, config: GameConfig) {
    this.scene = scene;
    this.config = config;
  }

  /**
   * Creates a complete menu with background and all elements
   */
  public createMenu(menuConfig: MenuConfig): Phaser.GameObjects.GameObject[] {
    this.clearElements();
    
    const gameWidth = this.scene.cameras.main.width;
    const gameHeight = this.scene.cameras.main.height;
    const centerX = gameWidth / 2;
    const centerY = gameHeight / 2;

    // Create background
    const background = this.createBackground(centerX, centerY, gameWidth, gameHeight);
    this.elements.push(background);

    // Create layer text if specified
    if (menuConfig.layerText) {
      const layerText = this.createLayerText(menuConfig.layerText);
      this.elements.push(layerText);
    }

    // Create title if specified
    if (menuConfig.title) {
      const titleX = centerX + this.config.menus.positions.titleOffset.x;
      const titleY = centerY + this.config.menus.positions.titleOffset.y;
      const title = this.createTitle(menuConfig.title, titleX, titleY);
      this.elements.push(title);
    }

    // Create custom texts
    if (menuConfig.texts) {
      menuConfig.texts.forEach(textConfig => {
        const text = this.createText(textConfig);
        this.elements.push(text);
      });
    }

    // Create buttons
    if (menuConfig.buttons) {
      menuConfig.buttons.forEach((buttonConfig, index) => {
        const button = this.createButton(buttonConfig, index);
        this.elements.push(button);
      });
    }

    // Create custom elements
    if (menuConfig.customElements) {
      const customElements = menuConfig.customElements();
      this.elements.push(...customElements);
    }

    return [...this.elements];
  }

  /**
   * Creates the standard menu background
   */
  private createBackground(x: number, y: number, width: number, height: number): Phaser.GameObjects.Rectangle {
    const background = this.scene.add.rectangle(x, y, width, height, 
      parseInt(this.config.menus.background.color.replace('0x', ''), 16), 
      this.config.menus.background.alpha
    );
    background.setScrollFactor(0);
    background.setDepth(this.config.menus.depths.background);
    return background;
  }

  /**
   * Creates the layer text (e.g., "MENU LAYER", "PAUSE MENU LAYER")
   */
  private createLayerText(text: string): Phaser.GameObjects.Text {
    const layerText = this.scene.add.text(
      this.config.menus.positions.layerText.x, 
      this.config.menus.positions.layerText.y, 
      text, 
      this.config.menus.styles.layerText
    );
    layerText.setScrollFactor(0);
    layerText.setDepth(this.config.menus.depths.content);
    return layerText;
  }

  /**
   * Creates a title text
   */
  private createTitle(text: string, x: number, y: number): Phaser.GameObjects.Text {
    const title = this.scene.add.text(x, y, text, this.config.menus.styles.title);
    title.setOrigin(0.5);
    title.setScrollFactor(0);
    title.setDepth(this.config.menus.depths.content);
    return title;
  }

  /**
   * Creates a text element
   */
  private createText(textConfig: MenuText): Phaser.GameObjects.Text {
    const x = textConfig.x || this.scene.cameras.main.width / 2;
    const y = textConfig.y || this.scene.cameras.main.height / 2;
    const style = textConfig.style || this.config.menus.styles.bodyText;
    const origin = textConfig.origin || { x: 0.5, y: 0.5 };

    const text = this.scene.add.text(x, y, textConfig.text, style);
    text.setOrigin(origin.x, origin.y);
    text.setScrollFactor(0);
    text.setDepth(this.config.menus.depths.content);
    return text;
  }

  /**
   * Creates an interactive button
   */
  private createButton(buttonConfig: MenuButton, index: number): Phaser.GameObjects.Text {
    const gameWidth = this.scene.cameras.main.width;
    const gameHeight = this.scene.cameras.main.height;
    const centerX = gameWidth / 2;
    const centerY = gameHeight / 2;

    // Calculate button position (stacked vertically)
    const buttonSpacing = this.config.menus.positions.buttonSpacing;
    const startY = centerY + this.config.menus.positions.buttonStartOffset;
    const x = buttonConfig.x || centerX;
    const y = buttonConfig.y || (startY + (index * buttonSpacing));

    const button = this.scene.add.text(x, y, buttonConfig.text, 
      buttonConfig.style || this.config.menus.styles.button
    );
    button.setOrigin(0.5);
    button.setScrollFactor(0);
    button.setDepth(this.config.menus.depths.content);

    // Make button interactive
    button.setInteractive({ useHandCursor: true });

    // Add hover effects
    button.on('pointerover', () => {
      button.setStyle(this.config.menus.styles.buttonHover);
    });

    button.on('pointerout', () => {
      button.setStyle(buttonConfig.style || this.config.menus.styles.button);
    });

    // Add click handler
    button.on('pointerdown', buttonConfig.onClick);

    return button;
  }

  /**
   * Clears all created elements
   */
  public clearElements(): void {
    this.elements.forEach(element => {
      if (element && element.destroy) {
        element.destroy();
      }
    });
    this.elements = [];
  }

  /**
   * Destroys the menu builder and all elements
   */
  public destroy(): void {
    this.clearElements();
  }
}