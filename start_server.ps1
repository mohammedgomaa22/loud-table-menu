param(
    [int]$Port = 8080
)

$currentDir = Get-Location
Write-Host "Starting local HTTP server at http://localhost:$Port/"
Write-Host "Press Ctrl+C to stop."

# Try to use python if installed
try {
    $pythonVersion = python --version 2>&1
    if ($pythonVersion -match "Python") {
        Write-Host "Using Python http.server..."
        python -m http.server $Port
        exit
    }
} catch {}

# Try to use npx http-server if node is installed
try {
    $nodeVersion = node --version 2>&1
    if ($nodeVersion -match "v") {
        Write-Host "Using Node http-server..."
        npx http-server -p $Port -c-1
        exit
    }
} catch {}

Write-Host "Could not find Python or Node.js to start a server."
Write-Host "Please install Python or Node.js, or use Live Server extension in VS Code."
