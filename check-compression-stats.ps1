# Quick stats script to check compression results
param(
    [string]$SourceDir = "assets\backgrounds\raw",
    [string]$CompressedDir = "assets\backgrounds\compressed"
)

Write-Host "Compression Statistics" -ForegroundColor Green
Write-Host "====================="

# Count files
$sourceFiles = Get-ChildItem -Path $SourceDir -Filter "*.png" -Recurse
$compressedFiles = Get-ChildItem -Path $CompressedDir -Filter "*.png" -Recurse -ErrorAction SilentlyContinue

Write-Host "Files processed: $($compressedFiles.Count) / $($sourceFiles.Count)"

if ($compressedFiles.Count -gt 0) {
    # Calculate total sizes
    $originalSize = ($sourceFiles | Measure-Object -Property Length -Sum).Sum
    $compressedSize = ($compressedFiles | Measure-Object -Property Length -Sum).Sum
    
    $savingsPercent = [math]::Round((1 - $compressedSize / $originalSize) * 100, 2)
    $originalMB = [math]::Round($originalSize / 1MB, 2)
    $compressedMB = [math]::Round($compressedSize / 1MB, 2)
    
    Write-Host ""
    Write-Host "Size Comparison:" -ForegroundColor Yellow
    Write-Host "  Original:   $originalMB MB"
    Write-Host "  Compressed: $compressedMB MB"
    Write-Host "  Savings:    $savingsPercent%"
    
    # Show directory structure
    Write-Host ""
    Write-Host "Directory Structure:" -ForegroundColor Yellow
    tree $CompressedDir /F | head -20
}
