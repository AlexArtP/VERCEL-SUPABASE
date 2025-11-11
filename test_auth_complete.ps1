#!/usr/bin/env pwsh
# Test script para los endpoints de autenticación Supabase completos

Write-Host "🧪 Testing Supabase Auth Endpoints (Complete)" -ForegroundColor Cyan
Write-Host "=============================================" -ForegroundColor Cyan

# Test 1: Register
Write-Host "`n📝 TEST 1: Register (POST /api/auth/register)" -ForegroundColor Yellow
$testEmail = "test_$(Get-Random)@example.com"
$registerUrl = "http://localhost:3001/api/auth/register"
$registerBody = @{
    email = $testEmail
    password = "TestPassword123"
    nombre = "Test User"
    apellido_paterno = "Lastname"
    profesion = "Tester"
} | ConvertTo-Json

Write-Host "Creating user: $testEmail"

try {
    $registerResponse = Invoke-WebRequest -Uri $registerUrl `
        -Method Post `
        -Body $registerBody `
        -ContentType "application/json" `
        -ErrorAction Stop

    $registerData = $registerResponse.Content | ConvertFrom-Json
    Write-Host "✅ Register Success (Status: $($registerResponse.StatusCode))" -ForegroundColor Green
    
    $userId = $registerData.user.id
    Write-Host "User ID: $userId`n" -ForegroundColor Green
    
} catch {
    Write-Host "❌ Register Failed" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 2: Login
Write-Host "🔐 TEST 2: Login (POST /api/auth/login)" -ForegroundColor Yellow
$loginUrl = "http://localhost:3001/api/auth/login"
$loginBody = @{
    email = $testEmail
    password = "TestPassword123"
} | ConvertTo-Json

Write-Host "Logging in with: $testEmail"

try {
    $loginResponse = Invoke-WebRequest -Uri $loginUrl `
        -Method Post `
        -Body $loginBody `
        -ContentType "application/json" `
        -ErrorAction Stop
    
    $loginData = $loginResponse.Content | ConvertFrom-Json
    Write-Host "✅ Login Success (Status: $($loginResponse.StatusCode))" -ForegroundColor Green
    Write-Host "Token received: $($loginData.token.Substring(0, 30))...`n" -ForegroundColor Green
    
    $accessToken = $loginData.token
    
} catch {
    Write-Host "❌ Login Failed" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 3: Change Password
Write-Host "🔑 TEST 3: Change Password (POST /api/auth/change-password)" -ForegroundColor Yellow
$changePasswordUrl = "http://localhost:3001/api/auth/change-password"
$newPassword = "NewPassword456"
$changePasswordBody = @{
    email = $testEmail
    currentPassword = "TestPassword123"
    newPassword = $newPassword
} | ConvertTo-Json

Write-Host "Changing password for: $testEmail"

try {
    $changePasswordResponse = Invoke-WebRequest -Uri $changePasswordUrl `
        -Method Post `
        -Body $changePasswordBody `
        -ContentType "application/json" `
        -ErrorAction Stop
    
    $changePasswordData = $changePasswordResponse.Content | ConvertFrom-Json
    Write-Host "✅ Change Password Success (Status: $($changePasswordResponse.StatusCode))" -ForegroundColor Green
    Write-Host "Message: $($changePasswordData.message)`n" -ForegroundColor Green
    
} catch {
    Write-Host "❌ Change Password Failed" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Test 4: Login with new password
Write-Host "🔐 TEST 4: Login with New Password" -ForegroundColor Yellow
$loginBody2 = @{
    email = $testEmail
    password = $newPassword
} | ConvertTo-Json

Write-Host "Logging in with new password"

try {
    $loginResponse2 = Invoke-WebRequest -Uri $loginUrl `
        -Method Post `
        -Body $loginBody2 `
        -ContentType "application/json" `
        -ErrorAction Stop
    
    $loginData2 = $loginResponse2.Content | ConvertFrom-Json
    Write-Host "✅ Login with New Password Success (Status: $($loginResponse2.StatusCode))" -ForegroundColor Green
    Write-Host "Token received: $($loginData2.token.Substring(0, 30))...`n" -ForegroundColor Green
    
} catch {
    Write-Host "❌ Login with New Password Failed" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

Write-Host "✨ All tests passed!" -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host "Summary:" -ForegroundColor White
Write-Host "  1. ✅ Register: User created successfully" -ForegroundColor Green
Write-Host "  2. ✅ Login: User authenticated with initial password" -ForegroundColor Green
Write-Host "  3. ✅ Change Password: Password updated successfully" -ForegroundColor Green
Write-Host "  4. ✅ Login with new password: Authentication works with new password" -ForegroundColor Green
Write-Host "`n" -ForegroundColor Cyan
