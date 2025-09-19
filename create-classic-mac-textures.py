#!/usr/bin/env python3
"""
Create comprehensive 8x8 pixel texture library including classic MacOS dither patterns.
Based on authentic patterns from JSPaint and classic Macintosh systems.
"""

import os
from PIL import Image
import numpy as np

def create_classic_mac_threshold_table():
    """Create the authentic Mac dither threshold table from JSPaint."""
    # This is the exact algorithm from JSPaint's make_monochrome_pattern function
    table = []
    for p in range(64):
        q = p ^ (p >> 3)
        value = (
            ((p & 4) >> 2) | ((q & 4) >> 1) |
            ((p & 2) << 1) | ((q & 2) << 2) |
            ((p & 1) << 4) | ((q & 1) << 5)
        ) / 64
        table.append(value)
    return table

def create_mac_dithered_pattern(filename, lightness=0.5, invert=False):
    """Create authentic Mac-style dithered pattern using the JSPaint algorithm."""
    threshold_table = create_classic_mac_threshold_table()
    
    img = Image.new('RGB', (8, 8))
    pixels = []
    
    for y in range(8):
        for x in range(8):
            map_value = threshold_table[(x & 7) + ((y & 7) << 3)]
            px_white = lightness > map_value
            if invert:
                px_white = not px_white
            
            if px_white:
                pixels.append((255, 255, 255))
            else:
                pixels.append((0, 0, 0))
    
    img.putdata(pixels)
    img.save(filename)
    print(f"Created Mac pattern: {filename}")

def create_classic_mac_patterns():
    """Create the full set of classic Mac dither patterns."""
    assets_dir = "assets/textures/classic_mac"
    os.makedirs(assets_dir, exist_ok=True)
    
    # Classic Mac patterns with various densities (lightness values)
    mac_patterns = [
        (0.0, "black"),
        (0.125, "very_dark"),
        (0.25, "dark"),
        (0.375, "medium_dark"),
        (0.5, "medium"),
        (0.625, "medium_light"),
        (0.75, "light"),
        (0.875, "very_light"),
        (1.0, "white")
    ]
    
    for lightness, name in mac_patterns:
        create_mac_dithered_pattern(f"{assets_dir}/mac_{name}_8x8.png", lightness)
        if lightness not in [0.0, 1.0]:  # Don't create inverted solid colors
            create_mac_dithered_pattern(f"{assets_dir}/mac_{name}_inv_8x8.png", lightness, invert=True)

def create_hypercard_patterns():
    """Create classic HyperCard-style patterns."""
    assets_dir = "assets/textures/hypercard"
    os.makedirs(assets_dir, exist_ok=True)
    
    # Create some classic HyperCard patterns manually
    patterns = {
        "diagonal": [
            [1,0,0,0,0,0,0,0],
            [0,1,0,0,0,0,0,0],
            [0,0,1,0,0,0,0,0],
            [0,0,0,1,0,0,0,0],
            [0,0,0,0,1,0,0,0],
            [0,0,0,0,0,1,0,0],
            [0,0,0,0,0,0,1,0],
            [0,0,0,0,0,0,0,1],
        ],
        "cross_hatch": [
            [1,0,0,0,1,0,0,0],
            [0,0,0,0,0,0,0,0],
            [0,0,1,0,0,0,1,0],
            [0,0,0,0,0,0,0,0],
            [1,0,0,0,1,0,0,0],
            [0,0,0,0,0,0,0,0],
            [0,0,1,0,0,0,1,0],
            [0,0,0,0,0,0,0,0],
        ],
        "dots_sparse": [
            [0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0],
            [0,0,1,0,0,0,1,0],
            [0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0],
            [0,0,1,0,0,0,1,0],
            [0,0,0,0,0,0,0,0],
        ],
        "brick": [
            [1,1,1,1,1,1,1,1],
            [0,0,0,1,0,0,0,0],
            [0,0,0,1,0,0,0,0],
            [0,0,0,1,0,0,0,0],
            [1,1,1,1,1,1,1,1],
            [0,0,0,0,0,0,0,1],
            [0,0,0,0,0,0,0,1],
            [0,0,0,0,0,0,0,1],
        ],
        "weave": [
            [1,1,0,0,1,1,0,0],
            [1,1,0,0,1,1,0,0],
            [0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0],
            [1,1,0,0,1,1,0,0],
            [1,1,0,0,1,1,0,0],
            [0,0,0,0,0,0,0,0],
            [0,0,0,0,0,0,0,0],
        ]
    }
    
    for name, pattern in patterns.items():
        img = Image.new('RGB', (8, 8))
        pixels = []
        
        for y in range(8):
            for x in range(8):
                if pattern[y][x]:
                    pixels.append((0, 0, 0))  # Black
                else:
                    pixels.append((255, 255, 255))  # White
        
        img.putdata(pixels)
        img.save(f"{assets_dir}/{name}_8x8.png")
        print(f"Created HyperCard pattern: {assets_dir}/{name}_8x8.png")

def create_background_darkness_variations():
    """Create darker background variations."""
    assets_dir = "assets/textures/backgrounds"
    os.makedirs(assets_dir, exist_ok=True)
    
    # Darker background colors
    dark_colors = [
        (32, 32, 32, "very_dark_gray"),
        (64, 64, 64, "dark_gray"),
        (96, 96, 96, "medium_dark_gray"),
        (160, 160, 160, "medium_gray"),
        (192, 192, 192, "light_gray"),
        (224, 224, 224, "very_light_gray"),
    ]
    
    for r, g, b, name in dark_colors:
        img = Image.new('RGB', (8, 8), (r, g, b))
        img.save(f"{assets_dir}/{name}_8x8.png")
        print(f"Created background: {assets_dir}/{name}_8x8.png")

def create_shadow_patterns():
    """Create proper shadow dither patterns (not masks)."""
    assets_dir = "assets/textures/shadows"
    os.makedirs(assets_dir, exist_ok=True)
    
    # Shadow patterns should be darker dithered versions, not masks
    threshold_table = create_classic_mac_threshold_table()
    
    shadow_densities = [
        (0.2, "light_shadow"),
        (0.35, "medium_shadow"), 
        (0.5, "dark_shadow"),
        (0.65, "very_dark_shadow")
    ]
    
    for lightness, name in shadow_densities:
        img = Image.new('RGB', (8, 8))
        pixels = []
        
        for y in range(8):
            for x in range(8):
                map_value = threshold_table[(x & 7) + ((y & 7) << 3)]
                # For shadows, we want more black pixels (darker)
                px_dark = lightness < map_value
                
                if px_dark:
                    pixels.append((0, 0, 0))  # Black (shadow)
                else:
                    pixels.append((128, 128, 128))  # Gray (lighter than background)
                    
        img.putdata(pixels)
        img.save(f"{assets_dir}/{name}_8x8.png")
        print(f"Created shadow pattern: {assets_dir}/{name}_8x8.png")

def update_existing_textures():
    """Update our existing texture set with proper variations."""
    assets_dir = "assets/textures"
    
    # Create additional Bayer patterns for more variety
    create_bayer_variations(assets_dir)
    
    print("Updated existing texture library")

def create_bayer_variations(assets_dir):
    """Create additional Bayer matrix variations."""
    # Additional density variations for smoother gradients
    extra_densities = [0.1, 0.15, 0.2, 0.3, 0.4, 0.6, 0.7, 0.8, 0.85, 0.9]
    
    bayer_matrix = create_bayer_matrix(8)
    
    for density in extra_densities:
        percent = int(density * 100)
        threshold = int(density * 64)
        
        img = Image.new('RGB', (8, 8))
        pixels = []
        
        for y in range(8):
            for x in range(8):
                bayer_value = bayer_matrix[y, x]
                pixel = (255, 255, 255) if bayer_value >= threshold else (0, 0, 0)
                pixels.append(pixel)
        
        img.putdata(pixels)
        img.save(f"{assets_dir}/bayer_dither_{percent}_extra_8x8.png")

def create_bayer_matrix(size):
    """Create a Bayer matrix for ordered dithering."""
    if size == 2:
        return np.array([[0, 2], [3, 1]])
    else:
        smaller = create_bayer_matrix(size // 2)
        return np.block([[4 * smaller, 4 * smaller + 2],
                        [4 * smaller + 3, 4 * smaller + 1]])

def main():
    """Create comprehensive texture library with classic Mac patterns."""
    print("Creating comprehensive 8x8 texture library...")
    print("Including authentic classic Mac dither patterns from JSPaint")
    
    # Create all the classic Mac patterns
    create_classic_mac_patterns()
    
    # Create HyperCard-style patterns  
    create_hypercard_patterns()
    
    # Create darker background variations
    create_background_darkness_variations()
    
    # Create proper shadow patterns (not masks)
    create_shadow_patterns()
    
    # Update existing library
    update_existing_textures()
    
    print("\n=== TEXTURE LIBRARY COMPLETE ===")
    print("Created authentic classic MacOS dither patterns:")
    print("- assets/textures/classic_mac/ - JSPaint-based authentic Mac patterns")
    print("- assets/textures/hypercard/ - Classic HyperCard patterns") 
    print("- assets/textures/backgrounds/ - Darker background variations")
    print("- assets/textures/shadows/ - Proper shadow dither patterns")
    print("- assets/textures/ - Additional Bayer variations")
    
    print("\nThese textures can be used directly in Phaser for:")
    print("- Authentic classic Mac dithering")
    print("- Much darker non-Phaser backgrounds") 
    print("- Proper drop shadows (dithered, not masked)")
    print("- Performance-optimized tiling")

if __name__ == "__main__":
    main()
