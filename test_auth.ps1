#!/usr/bin/env pwsh
# Test script para los nuevos endpoints de autenticación Supabase

Write-Host "🧪 Testing Supabase Auth Endpoints" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan

# Test 1: Register
Write-Host "`n📝 TEST 1: Register (POST /api/auth/register)" -ForegroundColor Yellow
$registerUrl = "http://localhost:3000/api/auth/register"
$registerBody = @{
    email = "test_$(Get-Random)@example.com"
    password = "TestPassword123"
    nombre = "Test User"
    apellido_paterno = "Lastname"
    profesion = "Tester"
} | ConvertTo-Json

Write-Host "URL: $registerUrl" -ForegroundColor Gray
Write-Host "Body: $registerBody" -ForegroundColor Gray

try {
    $registerResponse = Invoke-WebRequest -Uri $registerUrl `
        -Method Post `
        -Body $registerBody `
        -ContentType "application/json" `
        -ErrorAction Stop

    $registerData = $registerResponse.Content | ConvertFrom-Json
    Write-Host "✅ Register Success (Status: $($registerResponse.StatusCode))" -ForegroundColor Green
    Write-Host "Response:" -ForegroundColor Green
    Write-Host ($registerData | ConvertTo-Json -Depth 5) -ForegroundColor Green
    
    $userId = $registerData.user.id
    $email = $registerData.user.email
    Write-Host "Saved User ID: $userId" -ForegroundColor Cyan
    Write-Host "Saved Email: $email" -ForegroundColor Cyan
    
} catch {
    Write-Host "❌ Register Failed" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $errorContent = $reader.ReadToEnd()
        Write-Host "Response: $errorContent" -ForegroundColor Red
    }
    exit 1
}

# Test 2: Login
if ($userId -and $email) {
    Write-Host "`n🔐 TEST 2: Login (POST /api/auth/login)" -ForegroundColor Yellow
    $loginUrl = "http://localhost:3000/api/auth/login"
    $loginBody = @{
        email = $email
        password = "TestPassword123"
    } | ConvertTo-Json
    
    Write-Host "URL: $loginUrl" -ForegroundColor Gray
    Write-Host "Body: $loginBody" -ForegroundColor Gray
    
    try {
        $loginResponse = Invoke-WebRequest -Uri $loginUrl `
            -Method Post `
            -Body $loginBody `
            -ContentType "application/json" `
            -ErrorAction Stop
        
        $loginData = $loginResponse.Content | ConvertFrom-Json
        Write-Host "✅ Login Success (Status: $($loginResponse.StatusCode))" -ForegroundColor Green
        Write-Host "Response:" -ForegroundColor Green
        Write-Host ($loginData | ConvertTo-Json -Depth 5) -ForegroundColor Green
        
    } catch {
        Write-Host "❌ Login Failed" -ForegroundColor Red
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
        if ($_.Exception.Response) {
            $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
            $errorContent = $reader.ReadToEnd()
            Write-Host "Response: $errorContent" -ForegroundColor Red
        }
    }
}

Write-Host "`n✨ Tests completed!" -ForegroundColor Cyan
