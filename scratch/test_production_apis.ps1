$loginBody = @{
    username = "admin@transports"
    password = "Admin@SAT2026"
} | ConvertTo-Json

$loginRes = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/auth/login" -Method Post -Body $loginBody -ContentType "application/json"
$token = $loginRes.data.token
Write-Host "Admin Login Token acquired: $($token.Substring(0, 20))..."

$headers = @{
    Authorization = "Bearer $token"
}

# Test MD Dashboard
$mdRes = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/dashboards/md-cockpit" -Method Get -Headers $headers
Write-Host "MD Dashboard KPIs:"
$mdRes.data | Select-Object monthlyGrossRevenue, monthlyOperatingProfit, totalReceivables, totalBankCashPosition, totalDieselExpense, totalTripsCount, totalVehiclesCount | Format-List

# Test Accounts Dashboard
$accRes = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/dashboards/accounts-position" -Method Get -Headers $headers
Write-Host "Accounts Dashboard KPIs:"
$accRes.data | Select-Object unbilledTripsCount, totalOutstandingReceivables, cashInHandBalance, corporateBankBalance, totalMonthlyCollections, totalPendingDriverAdvances | Format-List

# Test Masters
$cust = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/customers" -Method Get -Headers $headers
Write-Host "Customers count: $($cust.data.Count)"

$veh = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/vehicles" -Method Get -Headers $headers
Write-Host "Vehicles count: $($veh.data.Count)"

$drv = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/drivers" -Method Get -Headers $headers
Write-Host "Drivers count: $($drv.data.Count)"

$trips = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/trips" -Method Get -Headers $headers
Write-Host "Trips count: $($trips.data.Count)"

$inv = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/invoices" -Method Get -Headers $headers
Write-Host "Invoices count: $($inv.data.Count)"

$pay = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/payments" -Method Get -Headers $headers
Write-Host "Payments count: $($pay.data.Count)"
