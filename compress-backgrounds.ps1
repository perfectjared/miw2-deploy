# PowerShell script to compress and crop background PNG files
# Converts to 1-bit PNG and crops black backgrounds

param(
    [string]$SourceDir = "assets\backgrounds\raw",
    [string]$TargetDir = "assets\backgrounds\compressed"
)

# Check if ImageMagick is available
if (-not (Get-Command "magick" -ErrorAction SilentlyContinue)) {
    Write-Error "ImageMagick is not installed or not in PATH. Please install ImageMagick first."
    Write-Host "You can download it from: https://imagemagick.org/script/download.php#windows"
    exit 1
}

# Ensure target directory exists
if (-not (Test-Path $TargetDir)) {
    New-Item -ItemType Directory -Path $TargetDir -Force | Out-Null
    Write-Host "Created target directory: $TargetDir"
}

# Function to process a single PNG file
function Process-PNG {
    param(
        [string]$InputFile,
        [string]$OutputFile
    )
    
    try {
        # Create output directory if it doesn't exist
        $outputDir = Split-Path $OutputFile -Parent
        if (-not (Test-Path $outputDir)) {
            New-Item -ItemType Directory -Path $outputDir -Force | Out-Null
        }
        
        # ImageMagick command to:
        # 1. Trim black background
        # 2. Convert to 1-bit PNG (monochrome)
        # 3. Apply PNG compression
        & magick $InputFile -trim -monochrome -depth 1 -compress ZIP $OutputFile
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "✓ Processed: $(Split-Path $InputFile -Leaf)"
            return $true
        } else {
            Write-Warning "Failed to process: $InputFile"
            return $false
        }
    }
    catch {
        Write-Warning "Error processing $InputFile : $_"
        return $false
    }
}

# Get all PNG files in the source directory recursively
$pngFiles = Get-ChildItem -Path $SourceDir -Filter "*.png" -Recurse

if ($pngFiles.Count -eq 0) {
    Write-Warning "No PNG files found in $SourceDir"
    exit 0
}

Write-Host "Found $($pngFiles.Count) PNG files to process..."
Write-Host "Source: $SourceDir"
Write-Host "Target: $TargetDir"
Write-Host ""

$processed = 0
$failed = 0

foreach ($file in $pngFiles) {
    # Calculate relative path from source directory
    $relativePath = $file.FullName.Substring((Resolve-Path $SourceDir).Path.Length + 1)
    $outputPath = Join-Path $TargetDir $relativePath
    
    if (Process-PNG -InputFile $file.FullName -OutputFile $outputPath) {
        $processed++
    } else {
        $failed++
    }
}

Write-Host ""
Write-Host "Processing complete!"
Write-Host "Processed: $processed files"
Write-Host "Failed: $failed files"

if ($processed -gt 0) {
    Write-Host ""
    Write-Host "Compressed files saved to: $TargetDir"
    
    # Show some statistics
    $originalSize = (Get-ChildItem -Path $SourceDir -Filter "*.png" -Recurse | Measure-Object -Property Length -Sum).Sum
    $compressedSize = (Get-ChildItem -Path $TargetDir -Filter "*.png" -Recurse -ErrorAction SilentlyContinue | Measure-Object -Property Length -Sum).Sum
    
    if ($compressedSize -gt 0) {
        $savings = [math]::Round((1 - $compressedSize / $originalSize) * 100, 2)
        Write-Host "Original size: $([math]::Round($originalSize / 1MB, 2)) MB"
        Write-Host "Compressed size: $([math]::Round($compressedSize / 1MB, 2)) MB"
        Write-Host "Space saved: $savings%"
    }
}
