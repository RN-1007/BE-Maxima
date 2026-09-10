<#
.SYNOPSIS
    Script Otomatis Menjalankan Backend BE-Maxima secara Lokal
.DESCRIPTION
    Menjalankan backend BE-Maxima menggunakan Node.js lokal dan PostgreSQL lokal.
#>

Write-Host "=================================================" -ForegroundColor Cyan
Write-Host "🚀 Menjalankan BE-Maxima secara Lokal (Node.js)" -ForegroundColor Cyan
Write-Host "=================================================" -ForegroundColor Cyan

npm run dev
