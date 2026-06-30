# =========================================================
# LUNA — run the full app locally (site + API + admin)
# Open http://lunajewelery.com  and  http://lunajewelery.com/admin.html
#
# One-time setup (run an ELEVATED PowerShell once):
#   Add-Content -Path "$env:windir\System32\drivers\etc\hosts" -Value "`n127.0.0.1`tlunajewelery.com"
#
# Set your own admin password before running (otherwise a default is used):
#   $env:ADMIN_PASSWORD = "your-secret"
# =========================================================

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

$env:PORT = "80"
$env:LUNA_DATA_DIR = Join-Path $PSScriptRoot "server\data"
if (-not $env:ADMIN_PASSWORD) { $env:ADMIN_PASSWORD = "luna-admin" }
if (-not $env:SESSION_SECRET) { $env:SESSION_SECRET = "luna-local-secret-change-me" }

Write-Host "Building site..." -ForegroundColor Magenta
npm run build

Write-Host "Starting Luna on http://lunajewelery.com  (admin: /admin.html)" -ForegroundColor Magenta
node server/server.js
