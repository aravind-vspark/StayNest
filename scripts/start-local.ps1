$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path $PSScriptRoot -Parent
$pythonPath = Join-Path $projectRoot 'venv/Scripts/python.exe'
if (-not (Test-Path $pythonPath)) {
    throw 'Create venv first: py -3.12 -m venv venv'
}
# Local testing always uses SQLite and loopback, independently of Docker config.
$env:APP_ENV = 'development'
$env:APP_ORIGIN = 'http://localhost:8000'
$env:DATABASE_URL = 'sqlite:///./staynest.db'
$env:REDIS_URL = ''
$env:MEDIA_DIR = './media'
Push-Location (Join-Path $projectRoot 'backend')
try {
    & $pythonPath -m alembic upgrade head
    if ($LASTEXITCODE -ne 0) { throw 'Database migration failed' }
    & $pythonPath -m uvicorn app.main:app --host 127.0.0.1 --port 8000
    if ($LASTEXITCODE -ne 0) { throw 'Server exited with an error' }
} finally {
    Pop-Location
}
