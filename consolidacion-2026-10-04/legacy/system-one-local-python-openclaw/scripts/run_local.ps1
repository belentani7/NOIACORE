# Arranca la API local en un comando (Windows PowerShell)
$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "..")
$env:PYTHONPATH = "src"
$py = if (Test-Path ".\.venv\Scripts\python.exe") { ".\.venv\Scripts\python.exe" } else { "python" }
Write-Host "Backend: $($env:SYSTEMONE_BACKEND) -> http://127.0.0.1:8077"
& $py -m uvicorn systemone.api:app --host 127.0.0.1 --port 8077
