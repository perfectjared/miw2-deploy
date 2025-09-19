/**
 * POLKA DOT BACKGROUND ANIMATION
 * 
 * Creates a step-based polka dot pattern with instant movement
 * Background: Pure white (#ffffff)
 * Dots: Pure black (#000000) with uniform size and even spacing
 * Movement: Every 4 steps, dots move up and right instantly
 */

interface PolkaDot {
  element: HTMLDivElement;
  size: number;
  x: number;
  y: number;
  originalX: number;
  originalY: number;
  stepOffset: number;
}

export class PolkaBackground {
  private container: HTMLElement;
  private dots: PolkaDot[] = [];
  private stepCounter: number = 0;
  private stepSize: number = 4; // Move every 4 steps
  private moveDistance: number = 2; // Pixels to move up and right

  constructor(containerId: string = 'polka-background') {
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`Container with id '${containerId}' not found`);
    }
    this.container = container;
  }

  /**
   * Initialize the polka dot pattern
   */
  init() {
    this.createDots();
    console.log(`Polka dot background initialized with ${this.dots.length} dots`);
  }

  /**
   * Increment step counter and move dots if needed
   */
  step() {
    this.stepCounter++;
    if (this.stepCounter % this.stepSize === 0) {
      this.moveDots();
      console.log(`Step ${this.stepCounter}: Moving dots up and right`);
    }
  }

  /**
   * Move all dots up and to the right instantly
   */
  private moveDots() {
    this.dots.forEach(dot => {
      dot.stepOffset += this.moveDistance;
      
      // Calculate new position (up and right)
      const newX = dot.originalX + dot.stepOffset;
      const newY = dot.originalY - dot.stepOffset;
      
      // Update position instantly (no animation)
      dot.element.style.left = `${newX - dot.size / 2}px`;
      dot.element.style.top = `${newY - dot.size / 2}px`;
      
      dot.x = newX;
      dot.y = newY;
    });
  }

  /**
   * Generate positions for evenly spaced polka dots
   */
  private generateDotPositions(): { x: number; y: number }[] {
    const positions: { x: number; y: number }[] = [];
    const spacing = 40; // Uniform spacing between dots
    const size = 8; // Uniform dot size
    const margin = size; // Margin from edges
    
    const containerRect = this.container.getBoundingClientRect();
    const maxX = containerRect.width - margin;
    const maxY = containerRect.height - margin;
    
    for (let x = margin; x <= maxX; x += spacing) {
      for (let y = margin; y <= maxY; y += spacing) {
        positions.push({ x, y });
      }
    }
    
    return positions;
  }

  /**
   * Create all polka dots
   */
  private createDots() {
    const positions = this.generateDotPositions();
    const size = 8; // Uniform size for all dots
    
    positions.forEach(position => {
      const dot = this.createDot(position.x, position.y, size);
      this.dots.push(dot);
    });
  }

  /**
   * Create a single polka dot element
   */
  private createDot(x: number, y: number, size: number): PolkaDot {
    const element = document.createElement('div');
    element.className = 'polka-dot';
    
    // Set initial properties - no entrance animation
    element.style.width = `${size}px`;
    element.style.height = `${size}px`;
    element.style.left = `${x - size / 2}px`;
    element.style.top = `${y - size / 2}px`;
    element.style.transform = 'scale(1)'; // Immediately visible
    element.style.transition = 'none'; // No smooth transitions
    
    this.container.appendChild(element);
    
    return {
      element,
      size,
      x,
      y,
      originalX: x,
      originalY: y,
      stepOffset: 0
    };
  }

  /**
   * Clean up elements
   */
  destroy() {
    this.dots.forEach(dot => {
      dot.element.remove();
    });
    this.dots = [];
    this.stepCounter = 0;
  }

  /**
   * Update dots on window resize
   */
  handleResize() {
    // Clear existing dots
    this.destroy();
    
    // Recreate dots for new dimensions
    this.init();
  }
}

// Export a singleton instance
export const polkaBackground = new PolkaBackground();
