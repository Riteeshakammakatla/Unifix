# PowerShell script to start Django backend
$VENV_PATH = ".\.venv\Scripts\Activate.ps1"

if (Test-Path $VENV_PATH) {
    Write-Host "Activating virtual environment..." -ForegroundColor Cyan
    & $VENV_PATH
}

cd backend

Write-Host "Running migrations..." -ForegroundColor Cyan
python manage.py migrate

Write-Host "Bootstrapping admin account..." -ForegroundColor Cyan
python manage.py create_admin

Write-Host "Starting Django server..." -ForegroundColor Cyan
python manage.py runserver
