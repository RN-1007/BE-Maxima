<#
.SYNOPSIS
    Script Pengujian Otomatis RESTful API BE-Maxima via PowerShell
.DESCRIPTION
    Menguji seluruh alur endpoint sistem BE-Maxima dari:
    - 0. Service Health Check
    - 1. Authentication & Session Validation (/api/auth/me)
    - 2. Dashboard Analytics & Summary (/api/admin/dashboard/*)
    - 3. Manajemen Petani (Admin CRUD & RBAC)
    - 4. Manajemen Pohon & Lahan (Admin & Petani CRUD, Varietas, GPS, FR-1, FR-2)
    - 5. Pemupukan & Offline Sync (Petani & Admin Monitoring FR-3)
    - 6. Deteksi AI Gateway & Log Monitoring (FR-5, Severity Calculation)
    - 7. Lapor Panen & Verifikasi Cetak QR PDF (FR-4)
    - 8. Scan Konsumen & Traceability Journey (Dual-Lookup: Batch ID & Tree Code, Timeline Interaktif, Gerbang AI)
.PARAMETER BaseUrl
    Base URL dari service BE-Maxima (default: http://localhost:3000)
.EXAMPLE
    powershell -ExecutionPolicy Bypass -File .\test-endpoints.ps1
    .\test-endpoints.ps1 -BaseUrl "http://localhost:3000"
#>

[CmdletBinding()]
param (
    [string]$BaseUrl = "http://localhost:3000"
)

$ErrorActionPreference = "Continue"

function Write-Header ($text) {
    Write-Host "`n=================================================================" -ForegroundColor Cyan
    Write-Host "  $text" -ForegroundColor Cyan
    Write-Host "=================================================================" -ForegroundColor Cyan
}

function Write-Section ($title) {
    Write-Host "`n[$title]" -ForegroundColor Yellow
}

function Write-Pass ($msg) {
    Write-Host "  [OK] $msg" -ForegroundColor Green
}

function Write-Fail ($msg, $err) {
    Write-Host "  [FAIL] $msg" -ForegroundColor Red
    if ($err) {
        Write-Host "         Detail: $err" -ForegroundColor DarkRed
    }
}

# Rekap Hasil Pengujian
$Global:TestResults = [System.Collections.Generic.List[PSCustomObject]]::new()

function Record-Test ($name, [bool]$passed, $details = "") {
    $status = if ($passed) { "PASSED" } else { "FAILED" }
    $Global:TestResults.Add([PSCustomObject]@{
        Endpoint = $name
        Status   = $status
        Note     = $details
    })
    if ($passed) {
        Write-Pass "$name $details"
    } else {
        Write-Fail "$name" $details
    }
}

# Helper HTTP JSON Request
function Send-JsonRequest {
    param (
        [string]$Uri,
        [string]$Method = "GET",
        $Body = $null,
        [string]$Token = $null,
        [int]$ExpectedStatus = 200
    )

    $headers = @{
        "Content-Type" = "application/json"
    }
    if ($Token) {
        $headers["Authorization"] = "Bearer $Token"
    }

    $jsonBody = $null
    if ($Body) {
        $jsonBody = if ($Body -is [string]) { $Body } else { ConvertTo-Json -InputObject $Body -Depth 10 }
    }

    try {
        $params = @{
            Uri             = $Uri
            Method          = $Method
            Headers         = $headers
            UseBasicParsing = $true
            ErrorAction     = "Stop"
        }
        if ($jsonBody) {
            $params["Body"] = $jsonBody
        }

        $response = Invoke-WebRequest @params
        $statusCode = [int]$response.StatusCode
        $parsed = $null
        try {
            $parsed = $response.Content | ConvertFrom-Json
        } catch {
            $parsed = $response.Content
        }

        return @{
            Success    = ($statusCode -eq $ExpectedStatus)
            StatusCode = $statusCode
            Data       = $parsed
        }
    }
    catch {
        $statusCode = 0
        $parsedBody = $null
        if ($_.Exception.Response) {
            $statusCode = [int]$_.Exception.Response.StatusCode
            try {
                $stream = $_.Exception.Response.GetResponseStream()
                $reader = New-Object System.IO.StreamReader($stream)
                $rawBody = $reader.ReadToEnd()
                $parsedBody = $rawBody | ConvertFrom-Json
            } catch {}
        }
        return @{
            Success    = ($statusCode -eq $ExpectedStatus)
            StatusCode = $statusCode
            Data       = $parsedBody
            Error      = $_.Exception.Message
        }
    }
}

# START TEST SUITE
Write-Header "BE-MAXIMA COMPREHENSIVE ENDPOINT TESTING SUITE"
Write-Host "Target Base URL: $BaseUrl" -ForegroundColor Magenta
Write-Host "Waktu Pengujian : $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')" -ForegroundColor Gray

# -------------------------------------------------------------
# 0. Health Check
# -------------------------------------------------------------
Write-Section "0. Service Health Check"
$rootRes = Send-JsonRequest -Uri "$BaseUrl/" -Method "GET" -ExpectedStatus 200
Record-Test -name "GET / (Root API Info)" -passed ($rootRes.Success -and $rootRes.Data.status -eq "online") -details "Service: $($rootRes.Data.service)"

$healthRes = Send-JsonRequest -Uri "$BaseUrl/health" -Method "GET" -ExpectedStatus 200
Record-Test -name "GET /health" -passed ($healthRes.Success -and $healthRes.Data.status -eq "ok") -details "Status: OK"

if (-not $healthRes.Success) {
    Write-Host "`n[ERROR FATAL] Server backend di $BaseUrl tidak merespons!" -ForegroundColor Red
    exit 1
}

# -------------------------------------------------------------
# 1. Authentication & Session Validation
# -------------------------------------------------------------
Write-Section "1. Authentication & Session (/api/auth)"
$adminToken = ""
$farmerToken = ""

# 1.1 Login Admin
$loginAdmin = Send-JsonRequest -Uri "$BaseUrl/api/auth/login" -Method "POST" -Body @{
    email    = "admin@maxima.com"
    password = "Admin123!"
} -ExpectedStatus 200

if ($loginAdmin.Success -and $loginAdmin.Data.data.token) {
    $adminToken = $loginAdmin.Data.data.token
    Record-Test -name "POST /api/auth/login (Admin)" -passed $true -details "Token diterima (Role: $($loginAdmin.Data.data.user.role))"
} else {
    Record-Test -name "POST /api/auth/login (Admin)" -passed $false -details $loginAdmin.Error
}

# 1.2 Login Petani
$loginFarmer = Send-JsonRequest -Uri "$BaseUrl/api/auth/login" -Method "POST" -Body @{
    email    = "petani1@maxima.com"
    password = "Petani123!"
} -ExpectedStatus 200

if ($loginFarmer.Success -and $loginFarmer.Data.data.token) {
    $farmerToken = $loginFarmer.Data.data.token
    Record-Test -name "POST /api/auth/login (Petani 1)" -passed $true -details "Token diterima (Petani: $($loginFarmer.Data.data.user.name))"
} else {
    Record-Test -name "POST /api/auth/login (Petani 1)" -passed $false -details $loginFarmer.Error
}

# 1.3 GET /api/auth/me (Cek Sesi Login User)
$meRes = Send-JsonRequest -Uri "$BaseUrl/api/auth/me" -Method "GET" -Token $adminToken -ExpectedStatus 200
Record-Test -name "GET /api/auth/me (Cek Sesi User)" -passed ($meRes.Success -and $meRes.Data.data.email -eq "admin@maxima.com") -details "User: $($meRes.Data.data.name) ($($meRes.Data.data.role))"

# 1.4 Login Gagal (Password Salah) -> Harus 401
$loginWrong = Send-JsonRequest -Uri "$BaseUrl/api/auth/login" -Method "POST" -Body @{
    email    = "admin@maxima.com"
    password = "SalahPassword123"
} -ExpectedStatus 401
Record-Test -name "POST /api/auth/login (Negative Test: Wrong Pass)" -passed $loginWrong.Success -details "Ditolak 401 Unauthorized"

# -------------------------------------------------------------
# 2. Dashboard Analytics & Summary (/api/admin/dashboard)
# -------------------------------------------------------------
Write-Section "2. Dashboard Analytics & Overview (/api/admin/dashboard)"

# 2.1 GET /api/admin/dashboard/stats
$dashStats = Send-JsonRequest -Uri "$BaseUrl/api/admin/dashboard/stats" -Method "GET" -Token $adminToken -ExpectedStatus 200
$hasCards = ($dashStats.Success -and $dashStats.Data.data.statCards.Count -ge 4)
Record-Test -name "GET /api/admin/dashboard/stats" -passed $hasCards -details "Pohon Sehat: $($dashStats.Data.data.healthyPercentage), Total AI: $($dashStats.Data.data.totalAiScans)"

# 2.2 GET /api/admin/dashboard/trend
$dashTrend = Send-JsonRequest -Uri "$BaseUrl/api/admin/dashboard/trend" -Method "GET" -Token $adminToken -ExpectedStatus 200
Record-Test -name "GET /api/admin/dashboard/trend" -passed ($dashTrend.Success -and $dashTrend.Data.data.Count -gt 0) -details "Bulan terdata: $($dashTrend.Data.data.Count) entri"

# 2.3 GET /api/admin/dashboard/overview
$dashOverview = Send-JsonRequest -Uri "$BaseUrl/api/admin/dashboard/overview" -Method "GET" -Token $adminToken -ExpectedStatus 200
$hasOverview = ($dashOverview.Success -and $dashOverview.Data.data.recentAiAlerts -ne $null -and $dashOverview.Data.data.fertilizerSchedule -ne $null)
Record-Test -name "GET /api/admin/dashboard/overview" -passed $hasOverview -details "AI Alerts: $($dashOverview.Data.data.recentAiAlerts.Count), Agenda Pupuk: $($dashOverview.Data.data.fertilizerSchedule.Count)"

# -------------------------------------------------------------
# 3. Manajemen Petani (Admin CRUD & RBAC)
# -------------------------------------------------------------
Write-Section "3. Manajemen Petani (Admin CRUD & RBAC)"
$createdFarmerId = ""

# 3.1 RBAC: Petani akses admin/farmers -> Harus 403 Forbidden
$rbacRes = Send-JsonRequest -Uri "$BaseUrl/api/admin/farmers" -Method "GET" -Token $farmerToken -ExpectedStatus 403
Record-Test -name "GET /api/admin/farmers (RBAC: Petani ditolak)" -passed $rbacRes.Success -details "Akses ditolak 403 Forbidden (Hanya Admin)"

# 3.2 Admin Create Farmer
$randomNum = Get-Random -Minimum 1000 -Maximum 9999
$newFarmerPayload = @{
    name     = "Petani PowerShell $randomNum"
    email    = "petani.ps.$randomNum@maxima.com"
    password = "Password123!"
    phone    = "08123456$randomNum"
    location = "Kebun Percobaan Blok $randomNum"
}
$createFarmerRes = Send-JsonRequest -Uri "$BaseUrl/api/admin/farmers" -Method "POST" -Body $newFarmerPayload -Token $adminToken -ExpectedStatus 201
if ($createFarmerRes.Success -and $createFarmerRes.Data.data.id) {
    $createdFarmerId = $createFarmerRes.Data.data.id
    Record-Test -name "POST /api/admin/farmers" -passed $true -details "Petani dibuat (ID: $createdFarmerId)"
} else {
    Record-Test -name "POST /api/admin/farmers" -passed $false -details $createFarmerRes.Error
}

# 3.3 Admin Get Farmer List
$listFarmersRes = Send-JsonRequest -Uri "$BaseUrl/api/admin/farmers" -Method "GET" -Token $adminToken -ExpectedStatus 200
$farmerCount = if ($listFarmersRes.Data.data) { $listFarmersRes.Data.data.Count } else { 0 }
Record-Test -name "GET /api/admin/farmers" -passed $listFarmersRes.Success -details "Total Petani Terdaftar: $farmerCount"

# 3.4 Admin Update Farmer
if ($createdFarmerId) {
    $updateFarmerRes = Send-JsonRequest -Uri "$BaseUrl/api/admin/farmers/$createdFarmerId" -Method "PUT" -Body @{
        name     = "Petani PowerShell (Updated)"
        location = "Kebun Percobaan Blok A-Updated"
    } -Token $adminToken -ExpectedStatus 200
    Record-Test -name "PUT /api/admin/farmers/:id" -passed $updateFarmerRes.Success -details "Profil berhasil diupdate"

    # 3.5 Admin Delete Farmer
    $deleteFarmerRes = Send-JsonRequest -Uri "$BaseUrl/api/admin/farmers/$createdFarmerId" -Method "DELETE" -Token $adminToken -ExpectedStatus 200
    Record-Test -name "DELETE /api/admin/farmers/:id" -passed $deleteFarmerRes.Success -details "Akun petani berhasil dihapus"
}

# -------------------------------------------------------------
# 4. Manajemen Pohon & Lahan (Admin & Petani CRUD, Varietas, GPS)
# -------------------------------------------------------------
Write-Section "4. Manajemen Pohon & Lahan (FR-1, FR-2, Varietas & GPS)"
$createdTreeId = ""
$createdScheduleId = ""
$testTreeCode = "PHN-PS-$randomNum"

# 4.1 Create Tree (Petani) -> FR-1 Verifikasi Otomatisasi Jadwal & Field Varietas
$treePayload = @{
    treeCode      = $testTreeCode
    plantingDate  = (Get-Date).AddMonths(-1).ToString("yyyy-MM-dd")
    locationBlock = "Blok Mandiri C-01"
    variety       = "Jeruk Bali Merah"
    coordinates   = "7°37'42`"S 111°26'18`"E"
}
$createTreeRes = Send-JsonRequest -Uri "$BaseUrl/api/trees" -Method "POST" -Body $treePayload -Token $farmerToken -ExpectedStatus 201
if ($createTreeRes.Success -and $createTreeRes.Data.data.id) {
    $createdTreeId = $createTreeRes.Data.data.id
    $scheds = $createTreeRes.Data.data.fertilizations
    $schedCount = if ($scheds) { $scheds.Count } else { 0 }
    $fr1Passed = ($schedCount -ge 5 -and $createTreeRes.Data.data.variety -eq "Jeruk Bali Merah")
    Record-Test -name "POST /api/trees (FR-1 & Varietas)" -passed $fr1Passed -details "Varietas: $($createTreeRes.Data.data.variety), Jadwal: $schedCount"
    if ($scheds -and $scheds.Count -gt 0) {
        $createdScheduleId = $scheds[0].id
    }
} else {
    Record-Test -name "POST /api/trees" -passed $false -details $createTreeRes.Error
}

# 4.2 Admin Add Tree via POST /api/admin/trees
$adminTreeCode = "PHN-ADM-$randomNum"
$adminTreePayload = @{
    treeCode      = $adminTreeCode
    plantingDate  = (Get-Date).AddMonths(-2).ToString("yyyy-MM-dd")
    locationBlock = "Blok Utama Admin"
    variety       = "Jeruk Bali Putih"
    coordinates   = "7°37'50`"S 111°26'30`"E"
}
$adminAddTreeRes = Send-JsonRequest -Uri "$BaseUrl/api/admin/trees" -Method "POST" -Body $adminTreePayload -Token $adminToken -ExpectedStatus 201
$createdAdminTreeId = if ($adminAddTreeRes.Success) { $adminAddTreeRes.Data.data.id } else { "" }
Record-Test -name "POST /api/admin/trees (Admin Tambah Pohon)" -passed ($adminAddTreeRes.Success -and $createdAdminTreeId) -details "Kode: $adminTreeCode, Varietas: Jeruk Bali Putih"

# 4.3 Admin Update Tree via PUT /api/admin/trees/:id
if ($createdAdminTreeId) {
    $adminUpdateTreeRes = Send-JsonRequest -Uri "$BaseUrl/api/admin/trees/$createdAdminTreeId" -Method "PUT" -Body @{
        variety       = "Jeruk Bali Putih Unggul"
        locationBlock = "Blok Utama Admin (Updated)"
    } -Token $adminToken -ExpectedStatus 200
    Record-Test -name "PUT /api/admin/trees/:id" -passed ($adminUpdateTreeRes.Success -and $adminUpdateTreeRes.Data.data.variety -eq "Jeruk Bali Putih Unggul") -details "Varietas terupdate"

    # 4.4 Admin Delete Tree via DELETE /api/admin/trees/:id
    $adminDeleteTreeRes = Send-JsonRequest -Uri "$BaseUrl/api/admin/trees/$createdAdminTreeId" -Method "DELETE" -Token $adminToken -ExpectedStatus 200
    Record-Test -name "DELETE /api/admin/trees/:id" -passed $adminDeleteTreeRes.Success -details "Pohon terhapus"
}

# 4.5 Get My Trees (FR-2 Isolasi Data & Kalkulasi Umur)
$myTreesRes = Send-JsonRequest -Uri "$BaseUrl/api/trees/my-trees" -Method "GET" -Token $farmerToken -ExpectedStatus 200
$foundTree = $null
if ($myTreesRes.Success -and $myTreesRes.Data.data) {
    $foundTree = $myTreesRes.Data.data | Where-Object { $_.id -eq $createdTreeId }
}
$fr2Passed = ($foundTree -ne $null -and $foundTree.ageInDays -ne $null)
Record-Test -name "GET /api/trees/my-trees (FR-2 Isolasi Data)" -passed $fr2Passed -details "Umur Pohon: $($foundTree.ageInDays) hari"

# 4.6 Admin Get All Trees Filtered
$adminTreesRes = Send-JsonRequest -Uri "$BaseUrl/api/admin/trees?health_status=Sehat" -Method "GET" -Token $adminToken -ExpectedStatus 200
Record-Test -name "GET /api/admin/trees?health_status=Sehat" -passed $adminTreesRes.Success -details "Pohon sehat ditemukan: $($adminTreesRes.Data.data.Count)"

# -------------------------------------------------------------
# 5. Jadwal Pemupukan & Offline Sync (FR-3 & Admin Monitoring)
# -------------------------------------------------------------
Write-Section "5. Jadwal Pemupukan (Petani & Admin Monitoring)"

# 5.1 Get Pending Fertilization Schedule (Petani)
$schedRes = Send-JsonRequest -Uri "$BaseUrl/api/fertilizations/schedule" -Method "GET" -Token $farmerToken -ExpectedStatus 200
Record-Test -name "GET /api/fertilizations/schedule" -passed $schedRes.Success -details "Pending to-do: $($schedRes.Data.data.Count) item"

# 5.2 Admin Get All Fertilizations Schedule (/api/admin/fertilizations)
$adminFertRes = Send-JsonRequest -Uri "$BaseUrl/api/admin/fertilizations" -Method "GET" -Token $adminToken -ExpectedStatus 200
Record-Test -name "GET /api/admin/fertilizations (Monitoring Admin)" -passed ($adminFertRes.Success -and $adminFertRes.Data.data.Count -gt 0) -details "Total agenda kebun: $($adminFertRes.Data.data.Count) entri"

# 5.3 Complete Fertilization
if ($createdScheduleId) {
    $completeRes = Send-JsonRequest -Uri "$BaseUrl/api/fertilizations/$createdScheduleId/complete" -Method "PUT" -Body @{
        actualDate = (Get-Date).ToString("yyyy-MM-dd")
        notes      = "Aplikasi pupuk organik uji otomatisasi"
    } -Token $farmerToken -ExpectedStatus 200
    $compStatus = if ($completeRes.Data.data) { $completeRes.Data.data.status } else { "" }
    Record-Test -name "PUT /api/fertilizations/:id/complete" -passed ($completeRes.Success -and $compStatus -eq "Selesai Dipupuk") -details "Status: $compStatus"
}

# 5.4 FR-3 Offline Batch Sync Fertilizations
if ($createdTreeId) {
    $syncPayload = @(
        @{
            treeId         = $createdTreeId
            scheduledDate  = (Get-Date).AddDays(-10).ToString("yyyy-MM-dd")
            actualDate     = (Get-Date).AddDays(-9).ToString("yyyy-MM-dd")
            fertilizerType = "Pupuk Kandang Offline Sync"
            notes          = "Data dari IndexedDB PWA offline"
        },
        @{
            treeId         = $createdTreeId
            scheduledDate  = (Get-Date).AddDays(-2).ToString("yyyy-MM-dd")
            actualDate     = (Get-Date).AddDays(-1).ToString("yyyy-MM-dd")
            fertilizerType = "NPK Mutiara Offline Sync"
            notes          = "Data tersinkron saat internet tersambung"
        }
    )
    $syncFertRes = Send-JsonRequest -Uri "$BaseUrl/api/sync/fertilizations" -Method "POST" -Body $syncPayload -Token $farmerToken -ExpectedStatus 200
    Record-Test -name "POST /api/sync/fertilizations (FR-3 Batch Sync)" -passed ($syncFertRes.Success -and $syncFertRes.Data.data.created -eq 2) -details "2 item tersinkronisasi"
}

# -------------------------------------------------------------
# 6. Deteksi AI Gateway & Monitoring (FR-5, Severity Badge)
# -------------------------------------------------------------
Write-Section "6. Deteksi AI & Monitoring Penyakit (FR-5)"

$fixturePath = Join-Path $PSScriptRoot "test\fixtures\leaf-sample.jpg"
if (-not (Test-Path $fixturePath)) {
    $tempBytes = [byte[]](0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xFF, 0xD9)
    New-Item -ItemType Directory -Force -Path (Join-Path $PSScriptRoot "test\fixtures") | Out-Null
    [System.IO.File]::WriteAllBytes($fixturePath, $tempBytes)
}

if ($createdTreeId) {
    try {
        # Upload foto daun oleh Admin/Petani via curl.exe
        $curlOutput = & curl.exe -s -X POST "$BaseUrl/api/ai/detect" `
            -H "Authorization: Bearer $adminToken" `
            -F "treeId=$createdTreeId" `
            -F "photo=@$fixturePath;filename=leaf-sample-healthy.jpg"
        
        $aiDetectData = $curlOutput | ConvertFrom-Json
        $aiPassed = ($aiDetectData.success -eq $true -and $aiDetectData.data.result)
        Record-Test -name "POST /api/ai/detect (FR-5 & Severity)" -passed $aiPassed -details "Hasil: $($aiDetectData.data.result) (Severity: $($aiDetectData.data.severity))"
    } catch {
        Record-Test -name "POST /api/ai/detect (FR-5 & Severity)" -passed $false -details $_.Exception.Message
    }

    # 6.2 FR-3 Batch Sync AI Logs
    $syncAiPayload = @(
        @{
            treeId     = $createdTreeId
            photoUrl   = "/uploads/leaves/sample-offline.jpg"
            result     = "Daun Sehat (Offline Diagnostic)"
            confidence = 96.5
            isSick     = $false
            detectedAt = (Get-Date).ToString("yyyy-MM-dd")
        }
    )
    $syncAiRes = Send-JsonRequest -Uri "$BaseUrl/api/sync/ai-detect" -Method "POST" -Body $syncAiPayload -Token $farmerToken -ExpectedStatus 200
    Record-Test -name "POST /api/sync/ai-detect (FR-3 Batch AI Sync)" -passed $syncAiRes.Success -details "AI Log tersinkronisasi"
}

# 6.3 Admin View AI Logs (Verifikasi field severity)
$adminAiRes = Send-JsonRequest -Uri "$BaseUrl/api/admin/ai-logs" -Method "GET" -Token $adminToken -ExpectedStatus 200
$hasSeverity = ($adminAiRes.Success -and $adminAiRes.Data.data.Count -gt 0 -and $adminAiRes.Data.data[0].severity -ne $null)
Record-Test -name "GET /api/admin/ai-logs (Severity Support)" -passed $hasSeverity -details "Total Riwayat AI: $($adminAiRes.Data.data.Count) logs"

# -------------------------------------------------------------
# 7. Lapor Panen & Cetak QR Code (FR-4)
# -------------------------------------------------------------
Write-Section "7. Lapor Panen & Verifikasi Cetak QR PDF (FR-4)"
$reportedHarvestId = ""
$generatedBatchId = ""

if ($createdTreeId) {
    # 7.1 Farmer Lapor Panen
    $harvestPayload = @{
        treeId          = $createdTreeId
        harvestDate     = (Get-Date).ToString("yyyy-MM-dd")
        estimatedFruits = 45
        notes           = "Panen perdana varietas unggul"
    }
    $reportRes = Send-JsonRequest -Uri "$BaseUrl/api/harvests/report" -Method "POST" -Body $harvestPayload -Token $farmerToken -ExpectedStatus 201
    if ($reportRes.Success -and $reportRes.Data.data.id) {
        $reportedHarvestId = $reportRes.Data.data.id
        Record-Test -name "POST /api/harvests/report" -passed $true -details "Status: Pending"
    } else {
        Record-Test -name "POST /api/harvests/report" -passed $false -details $reportRes.Error
    }

    # 7.2 Admin List Harvests
    $adminHarvestsRes = Send-JsonRequest -Uri "$BaseUrl/api/admin/harvests" -Method "GET" -Token $adminToken -ExpectedStatus 200
    Record-Test -name "GET /api/admin/harvests" -passed $adminHarvestsRes.Success -details "Total laporan panen: $($adminHarvestsRes.Data.data.Count)"

    # 7.3 Admin Verify & Generate QR PDF (FR-4)
    if ($reportedHarvestId) {
        $verifyRes = Send-JsonRequest -Uri "$BaseUrl/api/admin/harvests/$reportedHarvestId/verify-and-qr" -Method "POST" -Body @{
            stickerCount = 6
        } -Token $adminToken -ExpectedStatus 200

        if ($verifyRes.Success -and $verifyRes.Data.data.batchId) {
            $generatedBatchId = $verifyRes.Data.data.batchId
            $pdfUrl = $verifyRes.Data.data.pdfDownloadUrl
            Record-Test -name "POST /api/admin/harvests/:id/verify-and-qr (FR-4)" -passed $true -details "Batch ID: $generatedBatchId"
        } else {
            Record-Test -name "POST /api/admin/harvests/:id/verify-and-qr (FR-4)" -passed $false -details $verifyRes.Error
        }
    }
}

# -------------------------------------------------------------
# 8. Scan Konsumen & Traceability (Dual-Lookup & Timeline)
# -------------------------------------------------------------
Write-Section "8. Scan Konsumen & Traceability Journey (Publik)"

# 8.1 Scan via Batch ID (Lolos Mutu & Cek Array Timeline)
$targetBatch = if ($generatedBatchId) { $generatedBatchId } else { "BATCH-BBS001-20260315" }
$traceBatchRes = Send-JsonRequest -Uri "$BaseUrl/api/public/trace/$targetBatch" -Method "GET" -ExpectedStatus 200
$hasTimeline = ($traceBatchRes.Success -and $traceBatchRes.Data.data.timeline.Count -ge 5)
Record-Test -name "GET /api/public/trace/:batch_id (Batch Scan & Timeline)" -passed $hasTimeline -details "Varietas: $($traceBatchRes.Data.data.variety), Timeline: $($traceBatchRes.Data.data.timeline.Count) fase"

# 8.2 Scan via Tree Code (Dual-Lookup: Pohon di kebun langsung)
$traceTreeRes = Send-JsonRequest -Uri "$BaseUrl/api/public/trace/$testTreeCode" -Method "GET" -ExpectedStatus 200
$treeScanPassed = ($traceTreeRes.Success -and $traceTreeRes.Data.data.passed -eq $true -and $traceTreeRes.Data.data.coordinates)
Record-Test -name "GET /api/public/trace/:tree_code (Tree Code Scan & GPS)" -passed $treeScanPassed -details "Koordinat GPS: $($traceTreeRes.Data.data.coordinates)"

# 8.3 Scan Batch Sakit (Gerbang Mutu AI: Peringatan Aktif & Sembunyikan Data Petani)
$sickTraceRes = Send-JsonRequest -Uri "$BaseUrl/api/public/trace/BATCH-SICK-20260320" -Method "GET" -ExpectedStatus 200
$sickPassed = ($sickTraceRes.Data.success -eq $false -and $sickTraceRes.Data.warning -match "Standar Mutu AI")
Record-Test -name "GET /api/public/trace/:batch_id (Gerbang Mutu AI Tolak Sakit)" -passed $sickPassed -details "Peringatan Aktif: '$($sickTraceRes.Data.warning)'"

# 8.4 Negative Test: Identitas Tidak Ada -> Harus 404
$notFoundTrace = Send-JsonRequest -Uri "$BaseUrl/api/public/trace/BATCH-NONEXISTENT-999" -Method "GET" -ExpectedStatus 404
Record-Test -name "GET /api/public/trace/:identifier (Negative: 404)" -passed $notFoundTrace.Success -details "Respon 404 Not Found"

# -------------------------------------------------------------
# REKAPITULASI HASIL AKHIR
# -------------------------------------------------------------
Write-Header "RINGKASAN HASIL PENGUJIAN LENGKAP ENDPOINT BE-MAXIMA"
$totalTests = $Global:TestResults.Count
$totalPassed = ($Global:TestResults | Where-Object { $_.Status -eq "PASSED" }).Count
$totalFailed = ($Global:TestResults | Where-Object { $_.Status -eq "FAILED" }).Count

$Global:TestResults | Format-Table -AutoSize

if ($totalFailed -eq 0) {
    Write-Host "`n[SUKSES] SEMUA $totalTests PENGUJIAN ENDPOINT BERHASIL DENGAN SUKSES 100%! SEMUA FITUR SIAP DIHUBUNGKAN KE FRONTEND REACT." -ForegroundColor Green
} else {
    Write-Host "`n[PERINGATAN] DITEMUKAN $totalFailed DARI $totalTests PENGUJIAN GAGAL. PERIKSA DETAIL DI ATAS." -ForegroundColor Red
}
Write-Host "=================================================================`n" -ForegroundColor Cyan
