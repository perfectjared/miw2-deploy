/**
 * MENU BUILDER - DYNAMIC MENU CONSTRUCTION UTILITY
 * 
 * This utility class provides a flexible way to build dynamic menus with
 * various UI elements. It's designed to work alongside the MenuManager
 * for more complex menu layouts and custom elements.
 * 
 * Key Features:
 * - Dynamic menu construction with configurable elements
 * - Support for buttons, text, and custom elements
 * - Flexible positioning and styling options
 * - Reusable menu templates
 * - Integration with Phaser's text and graphics systems
 * 
 * The MenuBuilder is used for creating complex menus that require
 * more customization than the standard MenuManager templates.
 */

import Phaser from 'phaser';

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
  private elements: Phaser.GameObjects.GameObject[] = [];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
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
      const titleX = centerX + 0;
      const titleY = centerY + -100;
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
      0x000000, 
      0.5
    );
    background.setScrollFactor(0);
    background.setDepth(1000);
    return background;
  }

  /**
   * Creates the layer text (e.g., "MENU LAYER", "PAUSE MENU LAYER")
   */
  private createLayerText(text: string): Phaser.GameObjects.Text {
    const layerText = this.scene.add.text(
      0, 
      0, 
      text, 
      { fontSize: '14px', color: '#ffffff', fontStyle: 'bold' }
    );
    layerText.setScrollFactor(0);
    layerText.setDepth(1001);
    return layerText;
  }

  /**
   * Creates a title text
   */
  private createTitle(text: string, x: number, y: number): Phaser.GameObjects.Text {
    const title = this.scene.add.text(x, y, text, { fontSize: '24px', color: '#ffffff', fontStyle: 'bold' });
    title.setOrigin(0.5);
    title.setScrollFactor(0);
    title.setDepth(1001);
    return title;
  }

  /**
   * Creates a text element
   */
  private createText(textConfig: MenuText): Phaser.GameObjects.Text {
    const x = textConfig.x || this.scene.cameras.main.width / 2;
    const y = textConfig.y || this.scene.cameras.main.height / 2;
    const style = textConfig.style || { fontSize: '16px', color: '#ffffff' };
    const origin = textConfig.origin || { x: 0.5, y: 0.5 };

    const text = this.scene.add.text(x, y, textConfig.text, style);
    text.setOrigin(origin.x, origin.y);
    text.setScrollFactor(0);
    text.setDepth(1001);
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
    const buttonSpacing = 60;
    const startY = centerY + 50;
    const x = buttonConfig.x || centerX;
    const y = buttonConfig.y || (startY + (index * buttonSpacing));

    const button = this.scene.add.text(x, y, buttonConfig.text, 
      buttonConfig.style || { fontSize: '18px', color: '#ffffff', backgroundColor: '#333333', padding: { x: 10, y: 5 } }
    );
    button.setOrigin(0.5);
    button.setScrollFactor(0);
    button.setDepth(1001);

    // Make button interactive
    button.setInteractive({ useHandCursor: true });

    // Add hover effects
    button.on('pointerover', () => {
      button.setStyle({ fontSize: '18px', color: '#ffffff', backgroundColor: '#555555', padding: { x: 10, y: 5 } });
    });

    button.on('pointerout', () => {
      button.setStyle(buttonConfig.style || { fontSize: '18px', color: '#ffffff', backgroundColor: '#333333', padding: { x: 10, y: 5 } });
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