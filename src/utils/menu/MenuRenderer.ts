/**
 * MENU RENDERER
 * 
 * Handles the visual creation and rendering of menu dialogs
 */

import Phaser from 'phaser';
import { WindowShapes } from '../WindowShapes';
import { MenuConfig, MenuButton } from './MenuConstants';

export class MenuRenderer {
  private scene: Phaser.Scene;
  private windowShapes?: WindowShapes;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  private getWindowShapes(): WindowShapes | null {
    try {
      const gameScene = this.scene.scene.get('GameScene');
      const ws = (gameScene && (gameScene as any).windowShapes) || this.windowShapes;
      if (ws) this.windowShapes = ws;
      return ws || null;
    } catch {
      return this.windowShapes || null;
    }
  }

  createDialog(menuConfig: MenuConfig, menuType?: string): Phaser.GameObjects.Container {
    const gameWidth = this.scene.cameras.main.width;
    const gameHeight = this.scene.cameras.main.height;
    
    const dialogWidth = menuConfig.width || 300;
    const dialogHeight = menuConfig.height || 350;
    
    const dialog = this.scene.add.container(gameWidth / 2, gameHeight / 2);
    dialog.setScrollFactor(0);
    dialog.setDepth(80000);
    
    // Set container dimensions
    (dialog as any).setSize(dialogWidth, dialogHeight);
    (dialog as any).containerWidth = dialogWidth;
    (dialog as any).containerHeight = dialogHeight;
    
    // Create background
    this.createBackground(dialog, dialogWidth, dialogHeight, menuType);
    
    // Create title
    if (menuConfig.title) {
      this.createTitle(dialog, menuConfig.title, dialogWidth, dialogHeight);
    }
    
    // Create subtitle
    if (menuConfig.subtitle) {
      this.createSubtitle(dialog, menuConfig.subtitle, dialogWidth, dialogHeight);
    }
    
    // Create content
    if (menuConfig.content) {
      this.createContent(dialog, menuConfig.content, dialogWidth, dialogHeight, menuType);
    }
    
    // Create buttons
    if (menuConfig.buttons && menuConfig.buttons.length > 0) {
      this.createButtons(dialog, menuConfig.buttons, dialogWidth, dialogHeight);
    }
    
    return dialog;
  }

  private createBackground(dialog: Phaser.GameObjects.Container, width: number, height: number, menuType?: string): void {
    const halfW = width / 2;
    const halfH = height / 2;
    
    try {
      const windowShapes = this.getWindowShapes();
      if (windowShapes && (windowShapes as any).createCollageRect) {
        const collageBackground = (windowShapes as any).createCollageRect({
          x: -halfW,
          y: -halfH,
          width: width,
          height: height,
          fillColor: 0xffffff,
          fillAlpha: 1.0
        }, false, 'window');

        if (collageBackground) {
          collageBackground.setDepth(-1);
          collageBackground.setPosition(0, 0);
          dialog.add(collageBackground);
          
          // Store reference for cleanup
          (dialog as any).collageWindow = collageBackground;
          
          // Opening animation
          collageBackground.setScale(0.01);
          this.scene.tweens.add({
            targets: collageBackground,
            scaleX: 1,
            scaleY: 1,
            duration: 200,
            ease: 'Back.easeOut'
          });
        }
      }
    } catch (error) {
      console.error('Error creating collage background:', error);
      // Fallback background
      const fallback = this.scene.add.graphics();
      fallback.fillStyle(0x333333, 0.9);
      fallback.fillRoundedRect(-halfW, -halfH, width, height, 10);
      fallback.lineStyle(2, 0xffffff, 1);
      fallback.strokeRoundedRect(-halfW, -halfH, width, height, 10);
      fallback.setDepth(-1);
      dialog.add(fallback);
    }
  }

  private createTitle(dialog: Phaser.GameObjects.Container, title: string, width: number, height: number): void {
    const halfW = width / 2;
    const halfH = height / 2;
    const titleText = `<< ${title} >>`;
    
    try {
      const ws = this.getWindowShapes();
      if (ws && (ws as any).createNarrativeText) {
        const nx = -halfW - 20;
        const ny = height < 120 ? -halfH + 5 : -halfH - 12;
        const nwidth = width - 80;
        
        const titleElement = this.scene.add.text(nx, ny, titleText, {
          fontSize: '20px',
          color: '#ffffff',
          align: 'left',
          fontFamily: 'Arial',
          padding: { x: 8, y: 6 },
          wordWrap: { width: nwidth, useAdvancedWrap: true }
        });
        titleElement.setOrigin(0, 0.5);
        titleElement.setWordWrapWidth(nwidth);
        titleElement.setAlign('left');
        titleElement.setDepth(11);
        
        const textBounds = titleElement.getBounds();
        const titleBackground = (ws as any).createNarrativeBackground({
          x: textBounds.x - 8,
          y: textBounds.y - 8,
          width: textBounds.width + 16,
          height: textBounds.height + 16,
          fillColor: 0x000000,
          shapeType: 'narrativeBackground'
        }, true);
        titleBackground.setDepth(10);
        
        dialog.add(titleBackground);
        dialog.add(titleElement);
      } else {
        // Fallback
        const titleElement = this.scene.add.text(-halfW - 3, -halfH - 3, titleText, {
          fontSize: '20px', color: '#000000', fontStyle: 'bold'
        }).setOrigin(0, 0);
        dialog.add(titleElement);
      }
    } catch (error) {
      console.error('Error creating title:', error);
    }
  }

  private createSubtitle(dialog: Phaser.GameObjects.Container, subtitle: string, width: number, height: number): void {
    // Implementation for subtitle creation
    // This would be similar to title creation but with different positioning and styling
  }

  private createContent(dialog: Phaser.GameObjects.Container, content: string, width: number, height: number, menuType?: string): void {
    const halfW = width / 2;
    const halfH = height / 2;
    
    if (menuType === 'POTHOLE') {
      // Special handling for pothole menus
      const padding = 6;
      const textWidth = width - padding * 2;
      const text = String(content || '').trim();
      const t = this.scene.add.text(0, 0, text, {
        fontSize: '12px',
        color: '#000000',
        wordWrap: { width: textWidth, useAdvancedWrap: true },
        align: 'center'
      }).setOrigin(0.5);
      t.setPosition(0, 0);
      dialog.add(t);
    } else {
      // Regular content rendering
      const lines = String(content || '').split('\n').map(s => s.trim()).filter(Boolean);
      const totalTexts = Math.max(1, lines.length);
      const topMargin = 40;
      const bottomMargin = 110;
      const availableHeight = height - topMargin - bottomMargin;
      
      const leftX = -halfW + 10;
      const rightX = halfW - 10;
      const blockWidth = width - 20;

      const getYForIndex = (idx: number): number => {
        if (totalTexts === 1) return -halfH + topMargin + availableHeight / 2;
        const spacing = availableHeight / (totalTexts - 1);
        return -halfH + topMargin + idx * spacing;
      };

      for (let i = 0; i < totalTexts; i++) {
        const text = lines[i] || lines[0];
        const y = getYForIndex(i);
        const useRight = (totalTexts === 2 && i === 1);
        const x = useRight ? (rightX - blockWidth) : leftX;
        
        try {
          const ws = this.getWindowShapes();
          if (ws && (ws as any).createNarrativeText) {
            (ws as any).createNarrativeText(x, y, text, blockWidth, dialog);
          } else {
            const fontSize = menuType === 'VIRTUAL_PET' ? '10px' : '16px';
            const t = this.scene.add.text(0, 0, text, {
              fontSize: fontSize, color: '#000000', wordWrap: { width: blockWidth }, align: useRight ? 'right' : 'left'
            }).setOrigin(useRight ? 1 : 0, 0.5);
            t.setPosition(useRight ? rightX : leftX, y);
            dialog.add(t);
          }
        } catch (error) {
          console.error('Error creating content text:', error);
        }
      }
    }
  }

  private createButtons(dialog: Phaser.GameObjects.Container, buttons: MenuButton[], width: number, height: number): void {
    const halfH = height / 2;
    const buttonBaseY = halfH - 70;
    const buttonSpacing = 50;
    
    buttons.forEach((button, index) => {
      const btnY = buttonBaseY - (buttons.length - 1 - index) * buttonSpacing;
      const btnContainer = this.scene.add.container(0, btnY);
      btnContainer.setDepth((dialog.depth || 0) + 2);
      btnContainer.setScrollFactor(0);
      dialog.add(btnContainer);
      
      const isCloseButton = /Close/i.test(button.text);
      const btnWidth = isCloseButton ? 120 : 160;
      const btnHeight = isCloseButton ? 30 : 34;
      const halfBtnW = btnWidth / 2;
      const halfBtnH = btnHeight / 2;
      
      // Create button graphic
      let btnGraphic: Phaser.GameObjects.Graphics | null = null;
      try {
        const windowShapes = this.getWindowShapes();
        if (windowShapes && windowShapes.createCollageButton) {
          btnGraphic = windowShapes.createCollageButton(-halfBtnW, -halfBtnH, btnWidth, btnHeight);
          if (btnGraphic) {
            btnContainer.add(btnGraphic);
          }
        }
      } catch (error) {
        console.error('Error creating button graphic:', error);
      }
      
      // Create button label
      const label = this.scene.add.text(0, 0, button.text, {
        fontSize: '14px',
        color: '#000000',
        fontStyle: 'bold'
      }).setOrigin(0.5);
      btnContainer.add(label);
      
      // Create hit target
      const hitTarget = this.scene.add.rectangle(0, 0, btnWidth, btnHeight, 0x000000, 0);
      hitTarget.setOrigin(0.5);
      hitTarget.setScrollFactor(0);
      hitTarget.setDepth((btnContainer.depth || 1) + 1);
      btnContainer.add(hitTarget);
      hitTarget.setInteractive({ useHandCursor: true })
        .on('pointerup', () => {
          try { button.onClick(); } catch (e) { console.warn('button onClick error', e); }
        });
      
      // Fallback styling
      if (!btnGraphic) {
        const fallback = this.scene.add.graphics();
        fallback.fillStyle(0x34495e, 1);
        fallback.fillRoundedRect(-halfBtnW, -halfBtnH, btnWidth, btnHeight, 6);
        fallback.lineStyle(2, 0xffffff, 1);
        fallback.strokeRoundedRect(-halfBtnW, -halfBtnH, btnWidth, btnHeight, 6);
        btnContainer.addAt(fallback, 0);
        label.setColor('#ffffff');
      }
      
      // Cursor hints
      hitTarget.on('pointerover', () => { try { (this.scene.input as any).setDefaultCursor('pointer'); } catch {} });
      hitTarget.on('pointerout', () => { try { (this.scene.input as any).setDefaultCursor('default'); } catch {} });
    });
  }
}