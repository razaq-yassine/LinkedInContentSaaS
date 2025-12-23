# Add NEXT_PUBLIC_API_URL to .env.local if not already present

$envFile = ".env.local"
$envVar = "NEXT_PUBLIC_API_URL=http://localhost:8000"

# Read current content
$content = Get-Content $envFile -Raw -ErrorAction SilentlyContinue

# Check if variable already exists
if ($content -notmatch "NEXT_PUBLIC_API_URL") {
    # Add the variable
    Add-Content -Path $envFile -Value "`n$envVar"
    Write-Host "✅ Added NEXT_PUBLIC_API_URL to .env.local" -ForegroundColor Green
} else {
    Write-Host "ℹ️  NEXT_PUBLIC_API_URL already exists in .env.local" -ForegroundColor Yellow
}

# Display current .env.local content
Write-Host "`n📄 Current .env.local content:" -ForegroundColor Cyan
Get-Content $envFile
