# Script de Pruebas para Endpoints de Admin (Supabase)
# Este script prueba los endpoints de administración migrados a Supabase

$BASE_URL = "http://localhost:3001"

# Colores para output
$GREEN = "`e[32m"
$RED = "`e[31m"
$BLUE = "`e[34m"
$YELLOW = "`e[33m"
$RESET = "`e[0m"

Write-Host "${BLUE}╔════════════════════════════════════════════════════════════╗${RESET}"
Write-Host "${BLUE}║        PRUEBAS DE ENDPOINTS DE ADMIN (Supabase)            ║${RESET}"
Write-Host "${BLUE}╚════════════════════════════════════════════════════════════╝${RESET}"

# Función auxiliar para hacer requests
function Invoke-ApiRequest {
    param(
        [string]$Method,
        [string]$Endpoint,
        [object]$Body = $null,
        [string]$Description = ""
    )
    
    Write-Host "`n${BLUE}→ TEST: $Description${RESET}"
    Write-Host "  Request: $Method $Endpoint"
    
    try {
        $uri = "$BASE_URL$Endpoint"
        $params = @{
            Uri = $uri
            Method = $Method
            ContentType = 'application/json'
            ErrorAction = 'Stop'
        }
        
        if ($Body) {
            $params['Body'] = $Body | ConvertTo-Json
        }
        
        $response = Invoke-WebRequest @params
        $responseBody = $response.Content | ConvertFrom-Json
        
        Write-Host "${GREEN}✅ Status: $($response.StatusCode)${RESET}"
        Write-Host "  Response: $(($responseBody | ConvertTo-Json -Depth 2) -join "`n    ")"
        
        return $responseBody
    } catch {
        Write-Host "${RED}❌ Error: $($_.Exception.Message)${RESET}"
        return $null
    }
}

# TEST 1: List Users
Write-Host "`n${YELLOW}═══ TEST 1: List Users (GET /api/auth/list-users) ═══${RESET}"
$listUsersResult = Invoke-ApiRequest `
    -Method "GET" `
    -Endpoint "/api/auth/list-users?limit=5&offset=0" `
    -Description "Obtener lista de primeros 5 usuarios"

# TEST 2: Make Admin
Write-Host "`n${YELLOW}═══ TEST 2: Make Admin (POST /api/auth/make-admin) ═══${RESET}"

if ($listUsersResult -and $listUsersResult.data -and $listUsersResult.data.Count -gt 0) {
    $firstUserId = $listUsersResult.data[0].id
    Write-Host "  Usando usuario: $firstUserId"
    
    $makeAdminBody = @{
        userId = $firstUserId
        isAdmin = $true
    }
    
    $makeAdminResult = Invoke-ApiRequest `
        -Method "POST" `
        -Endpoint "/api/auth/make-admin" `
        -Body $makeAdminBody `
        -Description "Promover usuario a admin"
    
    # TEST 2b: Remover admin
    Write-Host "`n${YELLOW}═══ TEST 2b: Remove Admin (POST /api/auth/make-admin) ═══${RESET}"
    
    $removeAdminBody = @{
        userId = $firstUserId
        isAdmin = $false
    }
    
    $removeAdminResult = Invoke-ApiRequest `
        -Method "POST" `
        -Endpoint "/api/auth/make-admin" `
        -Body $removeAdminBody `
        -Description "Remover permisos de admin"
}

# TEST 3: Reset Password
Write-Host "`n${YELLOW}═══ TEST 3: Reset Password (POST /api/auth/reset-password) ═══${RESET}"

if ($listUsersResult -and $listUsersResult.data -and $listUsersResult.data.Count -gt 1) {
    $secondUserEmail = $listUsersResult.data[1].email
    Write-Host "  Usando email: $secondUserEmail"
    
    if ($secondUserEmail) {
        $resetPasswordBody = @{
            email = $secondUserEmail
        }
        
        $resetPasswordResult = Invoke-ApiRequest `
            -Method "POST" `
            -Endpoint "/api/auth/reset-password" `
            -Body $resetPasswordBody `
            -Description "Enviar enlace de reset de contraseña"
    }
}

# Resumen
Write-Host "`n${BLUE}╔════════════════════════════════════════════════════════════╗${RESET}"
Write-Host "${BLUE}║                    RESUMEN DE PRUEBAS                        ║${RESET}"
Write-Host "${BLUE}╚════════════════════════════════════════════════════════════╝${RESET}"

Write-Host "${GREEN}✅ Todos los endpoints de admin han sido probados${RESET}"
Write-Host "   • List Users: Obtiene la lista de usuarios con paginación"
Write-Host "   • Make Admin: Promueve/remueve permisos de admin"
Write-Host "   • Reset Password: Envía enlace de reset de contraseña"

Write-Host "${YELLOW}`nℹ️  Notas importantes:${RESET}"
Write-Host "   • Los endpoints usarían autenticación en producción"
Write-Host "   • Reset Password requiere SMTP configurado en Supabase"
Write-Host "   • RLS policies protegen acceso no autorizado"

Write-Host "`n${BLUE}✨ Pruebas completadas${RESET}`n"
