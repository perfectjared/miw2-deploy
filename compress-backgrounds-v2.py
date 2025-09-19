#!/usr/bin/env python3
"""
Background PNG Compression Script v2
Converts PNG files to 1-bit using classic video game dithering patterns
"""

import os
import sys
from pathlib import Path
from PIL import Image, ImageOps
import numpy as np
import argparse


def create_bayer_matrix(size):
    """Create a Bayer matrix for ordered dithering."""
    if size == 2:
        return np.array([[0, 2],
                        [3, 1]]) / 4.0
    elif size == 4:
        return np.array([[0,  8,  2,  10],
                        [12, 4,  14, 6 ],
                        [3,  11, 1,  9 ],
                        [15, 7,  13, 5 ]]) / 16.0
    elif size == 8:
        # Build 8x8 Bayer matrix recursively
        base = create_bayer_matrix(4)
        return np.block([[4*base,     4*base + 2],
                        [4*base + 3, 4*base + 1]]) / 4.0
    else:
        raise ValueError(f"Unsupported Bayer matrix size: {size}")


def apply_ordered_dithering(image, pattern_type="bayer4"):
    """
    Apply ordered dithering patterns like those used in classic video games.
    
    pattern_type options:
    - "bayer2": 2x2 Bayer pattern (simple crosshatch)
    - "bayer4": 4x4 Bayer pattern (classic dithering)
    - "bayer8": 8x8 Bayer pattern (fine dithering)
    - "threshold": Simple threshold (no dithering)
    - "checkerboard": Alternating checkerboard pattern
    """
    # Convert to grayscale and normalize to 0-1
    if image.mode != 'L':
        gray = image.convert('L')
    else:
        gray = image
    
    img_array = np.array(gray, dtype=np.float64) / 255.0
    height, width = img_array.shape
    
    if pattern_type == "threshold":
        # Simple threshold at 50%
        result = (img_array > 0.5).astype(np.uint8) * 255
    
    elif pattern_type == "checkerboard":
        # Create a checkerboard pattern
        checker = np.zeros((height, width))
        checker[::2, ::2] = 0.5  # Every other pixel
        checker[1::2, 1::2] = 0.5
        result = (img_array > checker).astype(np.uint8) * 255
    
    elif pattern_type in ["bayer2", "bayer4", "bayer8"]:
        # Extract matrix size from pattern name
        matrix_size = int(pattern_type.replace("bayer", ""))
        bayer_matrix = create_bayer_matrix(matrix_size)
        
        # Tile the Bayer matrix to cover the entire image
        tile_height = (height + matrix_size - 1) // matrix_size
        tile_width = (width + matrix_size - 1) // matrix_size
        tiled_matrix = np.tile(bayer_matrix, (tile_height, tile_width))
        
        # Crop to exact image size
        threshold_matrix = tiled_matrix[:height, :width]
        
        # Apply ordered dithering
        result = (img_array > threshold_matrix).astype(np.uint8) * 255
    
    else:
        raise ValueError(f"Unknown pattern type: {pattern_type}")
    
    # Convert back to PIL Image
    return Image.fromarray(result, mode='L').convert('1')


def crop_black_background(image, tolerance=10):
    """
    Crop black background from an image.
    Returns the cropped image.
    """
    # Convert to grayscale if it's not already
    if image.mode != 'L' and image.mode != '1':
        gray = image.convert('L')
    else:
        gray = image
    
    # Find the bounding box of non-black pixels
    # We'll consider anything darker than tolerance as "black"
    bbox = gray.point(lambda p: p > tolerance and 255).getbbox()
    
    if bbox:
        return image.crop(bbox)
    else:
        # If the entire image is black, return the original
        print(f"Warning: Image appears to be entirely black")
        return image


def process_png_file(input_path, output_path, dither_pattern="bayer4"):
    """
    Process a single PNG file: crop black background and convert to 1-bit with classic dithering.
    """
    try:
        # Open the image
        with Image.open(input_path) as img:
            print(f"Processing: {input_path.name}")
            print(f"  Original size: {img.size}")
            
            # Crop black background first
            cropped = crop_black_background(img)
            print(f"  After cropping: {cropped.size}")
            
            # Apply classic dithering pattern
            dithered = apply_ordered_dithering(cropped, dither_pattern)
            print(f"  Applied {dither_pattern} dithering pattern")
            
            # Ensure output directory exists
            output_path.parent.mkdir(parents=True, exist_ok=True)
            
            # Save with maximum compression
            dithered.save(output_path, 'PNG', optimize=True, compress_level=9)
            
            # Get file sizes
            original_size = input_path.stat().st_size
            compressed_size = output_path.stat().st_size
            
            reduction = ((original_size - compressed_size) / original_size) * 100
            print(f"  Size reduction: {reduction:.1f}% ({original_size} → {compressed_size} bytes)")
            
            return True
            
    except Exception as e:
        print(f"Error processing {input_path}: {e}")
        return False


def main():
    parser = argparse.ArgumentParser(description='Compress PNG images with classic video game dithering patterns')
    parser.add_argument('--source', default='assets/backgrounds/raw', 
                       help='Source directory containing PNG files')
    parser.add_argument('--target', default='assets/backgrounds/compressed',
                       help='Target directory for compressed files')
    parser.add_argument('--pattern', default='bayer4',
                       choices=['bayer2', 'bayer4', 'bayer8', 'threshold', 'checkerboard'],
                       help='Dithering pattern to use')
    parser.add_argument('--test', action='store_true',
                       help='Process only a few files for testing')
    parser.add_argument('--preview', action='store_true',
                       help='Show pattern previews and exit')
    
    args = parser.parse_args()
    
    # Show pattern previews if requested
    if args.preview:
        print("Dithering Pattern Preview:")
        print("=========================")
        print("bayer2:       Simple 2x2 crosshatch pattern")
        print("bayer4:       Classic 4x4 Bayer dithering (recommended)")
        print("bayer8:       Fine 8x8 Bayer dithering") 
        print("threshold:    Simple 50% threshold (no dithering)")
        print("checkerboard: Alternating checkerboard pattern")
        print("\nRun with --pattern <name> to use a specific pattern")
        return 0
    
    source_dir = Path(args.source)
    target_dir = Path(args.target)
    
    if not source_dir.exists():
        print(f"Error: Source directory '{source_dir}' does not exist")
        return 1
    
    # Find all PNG files recursively
    png_files = list(source_dir.rglob('*.png'))
    
    if not png_files:
        print(f"No PNG files found in '{source_dir}'")
        return 1
    
    print(f"Found {len(png_files)} PNG files to process")
    print(f"Using dithering pattern: {args.pattern}")
    
    # If testing, only process first few files
    if args.test:
        png_files = png_files[:5]
        print(f"Test mode: processing only {len(png_files)} files")
    
    # Create target directory
    target_dir.mkdir(parents=True, exist_ok=True)
    
    processed = 0
    failed = 0
    total_original_size = 0
    total_compressed_size = 0
    
    for png_file in png_files:
        # Calculate relative path from source directory
        relative_path = png_file.relative_to(source_dir)
        output_path = target_dir / relative_path
        
        original_size = png_file.stat().st_size
        total_original_size += original_size
        
        if process_png_file(png_file, output_path, args.pattern):
            processed += 1
            if output_path.exists():
                total_compressed_size += output_path.stat().st_size
        else:
            failed += 1
        
        print()  # Empty line for readability
    
    print(f"Processing complete!")
    print(f"Processed: {processed} files")
    print(f"Failed: {failed} files")
    
    if processed > 0:
        total_reduction = ((total_original_size - total_compressed_size) / total_original_size) * 100
        original_MB = total_original_size / 1024 / 1024
        compressed_MB = total_compressed_size / 1024 / 1024
        
        print(f"\nOverall statistics:")
        print(f"Original total size: {original_MB:.2f} MB")
        print(f"Compressed total size: {compressed_MB:.2f} MB")
        print(f"Total space saved: {total_reduction:.1f}%")
        print(f"Dithering pattern used: {args.pattern}")
    
    return 0 if failed == 0 else 1


if __name__ == '__main__':
    sys.exit(main())
