# Local API Integration Test for SplitYatra
$base = "http://localhost:4321"
$headers = @{ "Content-Type" = "application/json" }

function Req($method, $path, $body = $null) {
    $uri = "$base$path"
    try {
        if ($body) {
            $json = $body | ConvertTo-Json -Depth 10
            return Invoke-RestMethod -Uri $uri -Method $method -Body $json -Headers $headers
        } else {
            return Invoke-RestMethod -Uri $uri -Method $method -Headers $headers
        }
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        Write-Host "  [FAIL] $method $path => HTTP $statusCode : $_" -ForegroundColor Red
        return $null
    }
}

$pass = 0
$fail = 0
function OK($msg) { Write-Host "  [OK] $msg" -ForegroundColor Green; $script:pass++ }
function FAIL($msg) { Write-Host "  [FAIL] $msg" -ForegroundColor Red; $script:fail++ }

Write-Host "`n===== STEP 1: Create Trip =====" -ForegroundColor Cyan
$r1 = Req "POST" "/api/trips" @{ name="Goa 2026"; creatorName="Aman" }
if ($r1 -and $r1.trip -and $r1.trip.id) {
    OK "Trip created: code=$($r1.trip.code)  createdByMemberId=$($r1.trip.createdByMemberId)"
} else { FAIL "Create trip failed or missing trip data" }

$tripId   = $r1.trip.id
$code     = $r1.trip.code
$amanId   = $r1.trip.createdByMemberId  # Frontend uses this field, not a separate member object

Write-Host "`n===== STEP 2: GET Trip by ID =====" -ForegroundColor Cyan
$r2 = Req "GET" "/api/trips/$tripId"
if ($r2 -and $r2.trip -and $r2.members) {
    OK "Trip fetched by ID. Members: $($r2.members.Count)"
} else { FAIL "GET trip by ID failed" }

Write-Host "`n===== STEP 3: GET Trip by Code =====" -ForegroundColor Cyan
$r3 = Req "GET" "/api/trips/$code"
if ($r3 -and $r3.trip -and $r3.trip.code -eq $code) {
    OK "Trip fetched by code. Members: $($r3.members.Count)"
} else { FAIL "GET trip by code failed" }

Write-Host "`n===== STEP 4: Add Member Priya =====" -ForegroundColor Cyan
$r4 = Req "POST" "/api/trips/$tripId/members" @{ name="Priya"; upiId="priya@okicici" }
if ($r4 -and $r4.member -and $r4.member.id) {
    OK "Member added: id=$($r4.member.id)  upiId=$($r4.member.upiId)"
} else { FAIL "Add member failed" }
$priyaId = $r4.member.id

Write-Host "`n===== STEP 5: Add Expense (Rs.600 Uber Cab, split equally) =====" -ForegroundColor Cyan
$now = (Get-Date).ToString("yyyy-MM-dd")
$sharePerPerson = 30000  # 600/2 = 300 INR = 30000 paise
$expBody = @{
    description    = "Uber Cab"
    amountPaise    = 60000
    paidByMemberId = $amanId
    category       = "transport"
    splitType      = "equal"
    date           = $now
    shares         = @(
        @{ memberId = $amanId;  sharePaise = $sharePerPerson }
        @{ memberId = $priyaId; sharePaise = $sharePerPerson }
    )
}
$r5 = Req "POST" "/api/trips/$tripId/expenses" $expBody
if ($r5 -and $r5.expense -and $r5.expense.id) {
    OK "Expense added: id=$($r5.expense.id)  amountPaise=$($r5.expense.amountPaise)"
} else { FAIL "Add expense failed" }

Write-Host "`n===== STEP 6: GET Settlements =====" -ForegroundColor Cyan
$r6 = Req "GET" "/api/trips/$tripId/settlement"
if ($r6 -and $r6.transactions) {
    if ($r6.transactions.Count -gt 0) {
        $tx = $r6.transactions[0]
        OK "Settlement: $($tx.fromName) owes $($tx.toName) paise=$($tx.amountPaise)"
        if ($tx.amountPaise -eq 30000) { OK "Settlement amount is correct (30000 paise = Rs.300)" }
        else { FAIL "Settlement amount incorrect: expected 30000, got $($tx.amountPaise)" }
    } else { FAIL "No settlement transactions returned" }
} else { FAIL "GET settlement failed" }

Write-Host "`n===== STEP 7: Member DELETE block (balance nonzero) =====" -ForegroundColor Cyan
$r7err = $null
try {
    Invoke-RestMethod -Uri "$base/api/trips/$tripId/members/$priyaId" -Method DELETE -Headers $headers
    FAIL "Expected DELETE to be blocked for member with nonzero balance, but succeeded"
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    if ($statusCode -eq 400) { OK "DELETE correctly blocked with HTTP 400" }
    else { FAIL "DELETE returned unexpected status $statusCode" }
}

Write-Host "`n============================="
Write-Host "RESULTS: $pass passed, $fail failed" -ForegroundColor $(if ($fail -eq 0) { "Green" } else { "Yellow" })
