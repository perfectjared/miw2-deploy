#!/usr/bin/env python3
"""
Background PNG Compression Script
Converts PNG files to 1-bit (monochrome) and crops black backgrounds
"""

import os
import sys
from pathlib import Path
from PIL import Image, ImageOps
import argparse


def crop_black_background(image):
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
    # We'll consider anything darker than 10 as "black" to handle slight variations
    bbox = gray.point(lambda p: p > 10 and 255).getbbox()
    
    if bbox:
        return image.crop(bbox)
    else:
        # If the entire image is black, return the original
        print(f"Warning: Image appears to be entirely black")
        return image


def convert_to_1bit(image):
    """
    Convert image to 1-bit (monochrome).
    """
    # First convert to grayscale
    if image.mode != 'L':
        image = image.convert('L')
    
    # Convert to 1-bit using dithering for better results
    return image.convert('1', dither=Image.Dither.FLOYDSTEINBERG)


def process_png_file(input_path, output_path):
    """
    Process a single PNG file: crop black background and convert to 1-bit.
    """
    try:
        # Open the image
        with Image.open(input_path) as img:
            print(f"Processing: {input_path.name}")
            print(f"  Original size: {img.size}")
            
            # Crop black background
            cropped = crop_black_background(img)
            print(f"  After cropping: {cropped.size}")
            
            # Convert to 1-bit
            monochrome = convert_to_1bit(cropped)
            print(f"  Converted to 1-bit monochrome")
            
            # Ensure output directory exists
            output_path.parent.mkdir(parents=True, exist_ok=True)
            
            # Save with maximum compression
            monochrome.save(output_path, 'PNG', optimize=True, compress_level=9)
            
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
    parser = argparse.ArgumentParser(description='Compress and crop PNG background images')
    parser.add_argument('--source', default='assets/backgrounds/raw', 
                       help='Source directory containing PNG files')
    parser.add_argument('--target', default='assets/backgrounds/compressed',
                       help='Target directory for compressed files')
    parser.add_argument('--test', action='store_true',
                       help='Process only a few files for testing')
    
    args = parser.parse_args()
    
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
        
        if process_png_file(png_file, output_path):
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
        print(f"\nOverall statistics:")
        print(f"Original total size: {total_original_size / 1024 / 1024:.2f} MB")
        print(f"Compressed total size: {total_compressed_size / 1024 / 1024:.2f} MB")
        print(f"Total space saved: {total_reduction:.1f}%")
    
    return 0 if failed == 0 else 1


if __name__ == '__main__':
    sys.exit(main())
