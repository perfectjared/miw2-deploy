/**
 * STORY SCENE - NARRATIVE CONTENT DISPLAY
 * 
 * This scene handles the display of story content, narrative text, and
 * other non-interactive story elements. It provides a dedicated layer
 * for story content that can be overlaid on top of the game.
 * 
 * Key Features:
 * - Story text display
 * - Narrative content management
 * - Overlay camera setup for consistent positioning
 * - Non-intrusive story presentation
 * 
 * The scene is designed to work alongside the main game without
 * interfering with gameplay, providing context and narrative depth.
 */

import Phaser from 'phaser';

export class StoryScene extends Phaser.Scene {
  constructor() {
    super({ key: 'StoryScene' });
  }

  create() {
    // Set up overlay camera for this scene
    this.setupOverlayCamera();
    
    // Add story content (HUD is now handled by GameScene)
    const storyText = this.add.text(10, 70, 'Story content goes here...', {
      fontSize: '14px',
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 10, y: 5 }
    });
    storyText.setScrollFactor(0);
    storyText.setDepth(10000);
  }

  private setupOverlayCamera() {
    // Create overlay camera for this scene
    const overlayCamera = this.cameras.add(0, 0, this.cameras.main.width, this.cameras.main.height);
    overlayCamera.setName('storyOverlayCamera');
    overlayCamera.setScroll(0, 0);
    // Don't set background color - keep it transparent
    
    // Set this scene to use the overlay camera
    this.cameras.main = overlayCamera;
    
    console.log('StoryScene: Overlay camera set up');
  }
}
