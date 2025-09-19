# Game Elements Configuration System

This system provides a centralized way to configure important game elements through a simple JSON file, making it easy to adjust positions, scales, and sizes without diving into the code.

## Files

- **`src/config/GameElements.json`** - The main configuration file
- **`src/config/GameElements.ts`** - TypeScript interface and loader
- **`src/config/GameConfig.ts`** - Re-exports the system for easy access

## Quick Configuration Guide

### Rearview Mirror Position
```json
{
  "ui": {
    "rearviewMirror": {
      "position": { "x": 0.55, "y": 0.035 },
      "size": { "width": 0.92, "height": 0.4 }
    }
  }
}
```
- `x`, `y`: Position as percentages of screen (0.0 to 1.0)
- `width`, `height`: Size as percentages of screen (0.0 to 1.0)

### Virtual Pet Positions and Scales
```json
{
  "virtualPets": {
    "positions": [
      { "x": 0.15, "y": 0.1, "scale": 0.8 },
      { "x": 0.35, "y": 0.1, "scale": 0.8 },
      { "x": 0.55, "y": 0.1, "scale": 0.8 },
      { "x": 0.75, "y": 0.1, "scale": 0.8 },
      { "x": 0.95, "y": 0.1, "scale": 0.8 }
    ]
  }
}
```
- `x`, `y`: Position within the rearview mirror (0.0 to 1.0)
- `scale`: Size multiplier (1.0 = normal size)

### Steering Wheel Position
```json
{
  "ui": {
    "steeringWheel": {
      "position": { "x": 0.5, "y": 0.7 },
      "scale": 1.0
    }
  }
}
```
- `x`, `y`: Position as percentages of screen (0.0 to 1.0)
- `scale`: Size multiplier (1.0 = normal size)

### Magnetic Target Position
```json
{
  "ui": {
    "magneticTarget": {
      "position": { "x": 200, "y": 550 },
      "radius": 25
    }
  }
}
```
- `x`, `y`: Position in pixels
- `radius`: Size in pixels

### Item Size System
```json
{
  "itemSizes": {
    "small": {
      "width": 20,
      "height": 20,
      "scale": 1.0,
      "description": "Keys, small items"
    },
    "medium": {
      "width": 30,
      "height": 30,
      "scale": 1.5,
      "description": "Food, medium items"
    },
    "large": {
      "width": 40,
      "height": 40,
      "scale": 2.0,
      "description": "Large items"
    }
  }
}
```
- `width`, `height`: Size in pixels
- `scale`: Additional scale multiplier
- `description`: Human-readable description

## Usage in Code

The system is automatically loaded and available throughout the codebase:

```typescript
import { gameElements } from '../config/GameConfig';

// Get rearview mirror config
const rearviewConfig = gameElements.getRearviewMirror();
const x = rearviewConfig.position.x;
const y = rearviewConfig.position.y;

// Get virtual pet positions
const petPositions = gameElements.getVirtualPetPositions();
petPositions.forEach((pet, index) => {
  console.log(`Pet ${index}: x=${pet.x}, y=${pet.y}, scale=${pet.scale}`);
});

// Get item size by type
const keySize = gameElements.getItemSize('small');
const foodSize = gameElements.getItemSize('medium');

// Convert percentages to pixels
const pixelPos = gameElements.toPixelPosition(
  { x: 0.5, y: 0.5 }, 
  screenWidth, 
  screenHeight
);
```

## Benefits

1. **Easy Adjustment**: Change positions and sizes without touching code
2. **Consistent Sizing**: Use predefined size categories (small/medium/large)
3. **Type Safety**: Full TypeScript support with interfaces
4. **Fallback Support**: Default values if JSON fails to load
5. **Centralized**: All game element configuration in one place

## Current Mappings

- **Keys**: Uses `small` size (20x20 pixels)
- **Food/Items**: Uses `medium` size (30x30 pixels)
- **Trash**: Uses `medium` size (30x30 pixels)
- **Virtual Pets**: Individual positions and scales from config
- **Rearview Mirror**: Position and size from config
- **Steering Wheel**: Position and scale from config
- **Magnetic Target**: Position and radius from config

## Future Extensions

The system can be easily extended to include:
- More UI elements (buttons, menus, etc.)
- Additional size categories
- Animation settings
- Color schemes
- Sound configurations
