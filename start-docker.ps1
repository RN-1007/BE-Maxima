<#
.SYNOPSIS
    Script Otomatis Menjalankan Stack BE-Maxima via Docker
.DESCRIPTION
    Menjalankan PostgreSQL dan REST API BE-Maxima di dalam container Docker.
    Secara otomatis membangun image, menjalankan container, melakukan migrasi schema Prisma,
    dan melakukan seed data awal.
#>

Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "🚀 Menjalankan BE-Maxima via Docker Compose" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan

# Periksa apakah Docker engine aktif
docker info 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
    Write-Host "`n[PERINGATAN] Docker engine / Docker Desktop belum aktif." -ForegroundColor Yellow
    Write-Host "Buka aplikasi Docker Desktop di Windows terlebih dahulu, tunggu hingga status Engine 'Running'." -ForegroundColor Yellow
    Write-Host "Setelah Docker Desktop aktif, jalankan kembali script ini:`n  .\start-docker.ps1`n" -ForegroundColor White
    exit 1
}

Write-Host "[1/3] Membangun image dan menjalankan container..." -ForegroundColor Green
docker compose up -d --build

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n[2/3] Menunggu service siap melayani request..." -ForegroundColor Green
    Start-Sleep -Seconds 5
    
    Write-Host "`n[3/3] Status Container Docker:" -ForegroundColor Green
    docker compose ps

    Write-Host "`n=================================================" -ForegroundColor Cyan
    Write-Host "✅ BE-Maxima siap diakses di: http://localhost:3000" -ForegroundColor Green
    Write-Host "Untuk menguji seluruh endpoint, jalankan:" -ForegroundColor White
    Write-Host "  powershell -ExecutionPolicy Bypass -File .\test-endpoints.ps1" -ForegroundColor Yellow
    Write-Host "=================================================`n" -ForegroundColor Cyan
} else {
    Write-Host "`n❌ Gagal menjalankan Docker Compose. Periksa pesan error di atas." -ForegroundColor Red
}
