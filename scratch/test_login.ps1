try {
    $res = Invoke-RestMethod -Uri "http://localhost:8080/api/v1/auth/login" -Method Post -Body '{"username":"admin@transports","password":"Admin@SAT2026"}' -ContentType "application/json"
    $res | ConvertTo-Json
} catch {
    Write-Host "Status code: $($_.Exception.Response.StatusCode.value__)"
    $stream = $_.Exception.Response.GetResponseStream()
    if ($stream) {
        $reader = New-Object System.IO.StreamReader($stream)
        Write-Host "Response body: $($reader.ReadToEnd())"
    }
}
