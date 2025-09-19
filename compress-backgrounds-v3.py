#!/usr/bin/env python3
"""
Background PNG Compression Script v3 - Multi-Pattern Version
Converts PNG files to 1-bit with different classic dithering patterns
Creates separate folders for each pattern
"""

import os
import sys
from pathlib import Path
from PIL import Image
import numpy as np
import argparse


def create_bayer_matrix(size):
    """Create a Bayer dithering matrix of given size."""
    if size == 2:
        return np.array([[0, 2],
                        [3, 1]], dtype=np.float32) / 4.0
    elif size == 4:
        bayer2 = create_bayer_matrix(2)
        bayer4 = np.zeros((4, 4), dtype=np.float32)
        bayer4[0::2, 0::2] = bayer2 / 4.0
        bayer4[0::2, 1::2] = bayer2 / 4.0 + 0.5
        bayer4[1::2, 0::2] = bayer2 / 4.0 + 0.75
        bayer4[1::2, 1::2] = bayer2 / 4.0 + 0.25
        return bayer4
    elif size == 8:
        bayer4 = create_bayer_matrix(4)
        bayer8 = np.zeros((8, 8), dtype=np.float32)
        for i in range(2):
            for j in range(2):
                bayer8[i*4:(i+1)*4, j*4:(j+1)*4] = bayer4 / 4.0 + (i*2 + j) / 4.0
        return bayer8
    else:
        raise ValueError(f"Unsupported Bayer matrix size: {size}")


def apply_ordered_dither(image, pattern_name):
    """Apply ordered dithering pattern to convert to 1-bit."""
    # Convert to grayscale if needed
    if image.mode != 'L':
        gray_image = image.convert('L')
    else:
        gray_image = image.copy()
    
    # Convert to numpy array
    img_array = np.array(gray_image, dtype=np.float32) / 255.0
    height, width = img_array.shape
    
    if pattern_name == 'bayer2':
        threshold_matrix = create_bayer_matrix(2)
    elif pattern_name == 'bayer4':
        threshold_matrix = create_bayer_matrix(4)
    elif pattern_name == 'bayer8':
        threshold_matrix = create_bayer_matrix(8)
    elif pattern_name == 'simple':
        # Simple checkerboard pattern
        threshold_matrix = np.array([[0.25, 0.75],
                                   [0.75, 0.25]], dtype=np.float32)
    elif pattern_name == 'diagonal':
        # Diagonal pattern
        threshold_matrix = np.array([[0.0, 0.33, 0.66],
                                   [0.66, 0.0, 0.33],
                                   [0.33, 0.66, 0.0]], dtype=np.float32)
    else:
        # Default to Floyd-Steinberg for comparison
        return gray_image.convert('1', dither=Image.Dither.FLOYDSTEINBERG)
    
    # Tile the threshold matrix to match image size
    matrix_h, matrix_w = threshold_matrix.shape
    tiled_matrix = np.tile(threshold_matrix, 
                          (height // matrix_h + 1, width // matrix_w + 1))
    tiled_matrix = tiled_matrix[:height, :width]
    
    # Apply dithering
    dithered = (img_array > tiled_matrix).astype(np.uint8) * 255
    
    # Convert back to PIL image
    return Image.fromarray(dithered, mode='L').convert('1')


def crop_black_background(image):
    """Crop black background from an image."""
    if image.mode != 'L' and image.mode != '1':
        gray = image.convert('L')
    else:
        gray = image
    
    bbox = gray.point(lambda p: p > 10 and 255).getbbox()
    
    if bbox:
        return image.crop(bbox)
    else:
        print(f"Warning: Image appears to be entirely black")
        return image


def process_png_file(input_path, output_path, pattern_name):
    """Process a single PNG file with specified dithering pattern."""
    try:
        with Image.open(input_path) as img:
            print(f"Processing: {input_path.name} (pattern: {pattern_name})")
            print(f"  Original size: {img.size}")
            
            # Crop black background
            cropped = crop_black_background(img)
            print(f"  After cropping: {cropped.size}")
            
            # Apply ordered dithering
            dithered = apply_ordered_dither(cropped, pattern_name)
            print(f"  Applied {pattern_name} dithering")
            
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
    parser = argparse.ArgumentParser(description='Compress PNG backgrounds with multiple dithering patterns')
    parser.add_argument('--source', default='assets/backgrounds/raw', 
                       help='Source directory containing PNG files')
    parser.add_argument('--target', default='assets/backgrounds/compressed',
                       help='Base target directory for compressed files')
    parser.add_argument('--patterns', nargs='+', 
                       choices=['bayer2', 'bayer4', 'bayer8', 'simple', 'diagonal', 'floyd'],
                       default=['bayer2', 'bayer4'], 
                       help='Dithering patterns to apply')
    parser.add_argument('--test', action='store_true',
                       help='Process only a few files for testing')
    
    args = parser.parse_args()
    
    source_dir = Path(args.source)
    base_target_dir = Path(args.target)
    
    if not source_dir.exists():
        print(f"Error: Source directory '{source_dir}' does not exist")
        return 1
    
    # Find all PNG files recursively
    png_files = list(source_dir.rglob('*.png'))
    
    if not png_files:
        print(f"No PNG files found in '{source_dir}'")
        return 1
    
    print(f"Found {len(png_files)} PNG files to process")
    
    # If testing, only process first few files
    if args.test:
        png_files = png_files[:3]  # Even fewer for testing multiple patterns
        print(f"Test mode: processing only {len(png_files)} files")
    
    # Process each pattern
    for pattern_name in args.patterns:
        print(f"\n{'='*50}")
        print(f"Processing with {pattern_name.upper()} pattern")
        print(f"{'='*50}")
        
        # Create pattern-specific target directory
        pattern_target_dir = base_target_dir / pattern_name
        pattern_target_dir.mkdir(parents=True, exist_ok=True)
        
        processed = 0
        failed = 0
        total_original_size = 0
        total_compressed_size = 0
        
        for png_file in png_files:
            # Calculate relative path from source directory
            relative_path = png_file.relative_to(source_dir)
            output_path = pattern_target_dir / relative_path
            
            original_size = png_file.stat().st_size
            total_original_size += original_size
            
            if process_png_file(png_file, output_path, pattern_name):
                processed += 1
                if output_path.exists():
                    total_compressed_size += output_path.stat().st_size
            else:
                failed += 1
            
            print()  # Empty line for readability
        
        print(f"Pattern {pattern_name.upper()} Complete!")
        print(f"Processed: {processed} files")
        print(f"Failed: {failed} files")
        
        if processed > 0:
            total_reduction = ((total_original_size - total_compressed_size) / total_original_size) * 100
            original_mb = total_original_size / 1024 / 1024
            compressed_mb = total_compressed_size / 1024 / 1024
            
            print(f"Size: {original_mb:.2f} MB → {compressed_mb:.2f} MB ({total_reduction:.1f}% savings)")
        
        print(f"Files saved to: {pattern_target_dir}")
    
    return 0


if __name__ == '__main__':
    sys.exit(main())
