# Background Image Processing

This directory contains compressed background images for the game.

## Directory Structure

```
assets/backgrounds/
├── raw/          # Original PNG files (ignored by git) - DO NOT EDIT DIRECTLY
└── compressed/   # Optimized 1-bit PNGs with cropped backgrounds
```

## Processing Details

- **Source**: Original PNGs in `assets/backgrounds/raw/`
- **Output**: Compressed PNGs in `assets/backgrounds/compressed/`
- **Optimization**: 
  - Converted to 1-bit (monochrome) format
  - Black backgrounds automatically cropped
  - PNG compression maximized
  - ~80% file size reduction achieved

## Usage

To reprocess the images after adding new files to the `raw` directory:

### Python Script (recommended)
```powershell
python compress-backgrounds.py
```

### PowerShell Script (requires ImageMagick)
```powershell
.\compress-backgrounds.ps1
```

## Test Mode

To test with just a few files first:
```powershell
python compress-backgrounds.py --test
```

## Statistics
- **Total files processed**: 15,442 PNG files
- **Original size**: 496.98 MB
- **Compressed size**: 98.43 MB
- **Space saved**: 80.19%

## Notes

- Raw images in `assets/backgrounds/raw/` are excluded from git
- Only edit files in the `raw` directory, never edit compressed files directly
- The compression script preserves the directory structure
- Images are automatically cropped to remove black borders
