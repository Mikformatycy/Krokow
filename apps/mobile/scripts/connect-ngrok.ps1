$ErrorActionPreference = 'Stop'
$ngrokExe = Join-Path $env:LOCALAPPDATA 'krokow-tools/ngrok/ngrok.exe'
if (-not (Test-Path -LiteralPath $ngrokExe)) {
    throw 'Brak lokalnego ngrok.exe. Instrukcja pobrania: docs/phone-tunnel.md.'
}
$ngrokWorkDir = Join-Path (Split-Path $PSScriptRoot -Parent) '.expo'
New-Item -ItemType Directory -Path $ngrokWorkDir -Force | Out-Null
Write-Host 'krokow: prywatne wpisanie tokenu ngrok. Nie wklejaj go do czatu.'
Write-Host 'Token: https://dashboard.ngrok.com/get-started/your-authtoken'
$ngrokSecureToken = Read-Host 'Wklej authtoken i nacisnij Enter (wpisywanie ukryte)' -AsSecureString
$ngrokTokenPointer = [IntPtr]::Zero
$ngrokPreviousToken = $env:NGROK_AUTHTOKEN
try {
    $ngrokTokenPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($ngrokSecureToken)
    $env:NGROK_AUTHTOKEN = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ngrokTokenPointer)
    if ([string]::IsNullOrWhiteSpace($env:NGROK_AUTHTOKEN)) { throw 'Token jest pusty.' }
    Write-Host 'Uruchamiam tunel do Expo i API. Zostaw to okno otwarte; Ctrl+C zatrzymuje tunel.'
    & $ngrokExe http http://127.0.0.1:8082 --inspect=false --log (Join-Path $ngrokWorkDir 'ngrok-own.log') --log-format json
    if ($LASTEXITCODE -ne 0) { throw "ngrok zakonczyl sie kodem $LASTEXITCODE." }
} finally {
    $env:NGROK_AUTHTOKEN = $ngrokPreviousToken
    if ($ngrokTokenPointer -ne [IntPtr]::Zero) { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ngrokTokenPointer) }
    $ngrokSecureToken.Dispose()
}
