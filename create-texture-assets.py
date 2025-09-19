#!/usr/bin/env python3
"""
Create 8x8 pixel black and white PNG textures for game backgrounds.
These textures can be tiled for optimal performance in Phaser.
"""

import os
from PIL import Image
import numpy as np

def create_bayer_matrix(size):
    """Create a Bayer matrix for ordered dithering."""
    if size == 2:
        return np.array([[0, 2], [3, 1]])
    else:
        smaller = create_bayer_matrix(size // 2)
        return np.block([[4 * smaller, 4 * smaller + 2],
                        [4 * smaller + 3, 4 * smaller + 1]])

def create_solid_texture(color, filename):
    """Create a solid color 8x8 texture."""
    img = Image.new('RGB', (8, 8), color)
    img.save(filename)
    print(f"Created: {filename}")

def create_checkerboard_texture(filename, color1=(255, 255, 255), color2=(0, 0, 0)):
    """Create a checkerboard pattern 8x8 texture."""
    img = Image.new('RGB', (8, 8))
    pixels = []
    
    for y in range(8):
        for x in range(8):
            if (x + y) % 2 == 0:
                pixels.append(color1)
            else:
                pixels.append(color2)
    
    img.putdata(pixels)
    img.save(filename)
    print(f"Created: {filename}")

def create_bayer_dithered_texture(filename, density=0.5, invert=False):
    """Create a Bayer dithered 8x8 texture."""
    bayer_matrix = create_bayer_matrix(8)
    threshold = int(density * 64)  # 64 is max value in 8x8 bayer matrix
    
    img = Image.new('RGB', (8, 8))
    pixels = []
    
    for y in range(8):
        for x in range(8):
            bayer_value = bayer_matrix[y, x]
            if invert:
                pixel = (0, 0, 0) if bayer_value >= threshold else (255, 255, 255)
            else:
                pixel = (255, 255, 255) if bayer_value >= threshold else (0, 0, 0)
            pixels.append(pixel)
    
    img.putdata(pixels)
    img.save(filename)
    print(f"Created: {filename}")

def create_dot_pattern_texture(filename, dot_size=2):
    """Create a dot pattern 8x8 texture."""
    img = Image.new('RGB', (8, 8), (255, 255, 255))  # White background
    pixels = list(img.getdata())
    
    # Create a centered dot
    center_x, center_y = 4, 4
    for y in range(8):
        for x in range(8):
            distance = ((x - center_x) ** 2 + (y - center_y) ** 2) ** 0.5
            if distance <= dot_size / 2:
                pixels[y * 8 + x] = (0, 0, 0)  # Black dot
    
    img.putdata(pixels)
    img.save(filename)
    print(f"Created: {filename}")

def create_halftone_texture(filename, density=0.5):
    """Create a halftone pattern 8x8 texture with varying dot sizes."""
    img = Image.new('RGB', (8, 8), (255, 255, 255))  # White background
    pixels = list(img.getdata())
    
    # Calculate dot radius based on density
    max_radius = 2.8  # Maximum radius that fits in 8x8
    dot_radius = density * max_radius
    
    center_x, center_y = 3.5, 3.5  # Center of 8x8 grid
    
    for y in range(8):
        for x in range(8):
            distance = ((x - center_x) ** 2 + (y - center_y) ** 2) ** 0.5
            if distance <= dot_radius:
                pixels[y * 8 + x] = (0, 0, 0)  # Black dot
    
    img.putdata(pixels)
    img.save(filename)
    print(f"Created: {filename}")

def main():
    """Create all texture assets."""
    # Create assets directory if it doesn't exist
    assets_dir = "assets/textures"
    os.makedirs(assets_dir, exist_ok=True)
    
    print("Creating 8x8 pixel texture assets...")
    
    # Solid colors
    create_solid_texture((255, 255, 255), f"{assets_dir}/white_8x8.png")
    create_solid_texture((0, 0, 0), f"{assets_dir}/black_8x8.png")
    create_solid_texture((128, 128, 128), f"{assets_dir}/gray_8x8.png")
    create_solid_texture((240, 240, 240), f"{assets_dir}/light_gray_8x8.png")
    create_solid_texture((64, 64, 64), f"{assets_dir}/dark_gray_8x8.png")
    
    # Checkerboard patterns
    create_checkerboard_texture(f"{assets_dir}/checkerboard_8x8.png")
    create_checkerboard_texture(f"{assets_dir}/checkerboard_gray_8x8.png", 
                               color1=(240, 240, 240), color2=(128, 128, 128))
    
    # Bayer dithered patterns - various densities
    densities = [0.125, 0.25, 0.375, 0.5, 0.625, 0.75, 0.875]
    for density in densities:
        percent = int(density * 100)
        create_bayer_dithered_texture(f"{assets_dir}/bayer_dither_{percent}_8x8.png", density)
        create_bayer_dithered_texture(f"{assets_dir}/bayer_dither_{percent}_inv_8x8.png", density, invert=True)
    
    # Dot patterns - various sizes
    for dot_size in [1, 2, 3, 4]:
        create_dot_pattern_texture(f"{assets_dir}/dot_{dot_size}px_8x8.png", dot_size)
    
    # Halftone patterns - various densities
    for density in [0.2, 0.4, 0.6, 0.8]:
        percent = int(density * 100)
        create_halftone_texture(f"{assets_dir}/halftone_{percent}_8x8.png", density)
    
    print(f"\nAll textures created in {assets_dir}/")
    print("These can now be loaded as Phaser textures and tiled for optimal performance.")

if __name__ == "__main__":
    main()
