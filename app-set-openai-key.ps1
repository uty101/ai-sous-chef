$ErrorActionPreference = "Stop"

Set-Location -LiteralPath $PSScriptRoot

Write-Host "This saves your OpenAI API key as a Supabase Edge Function secret."
Write-Host "The key will not be written into this project folder."
Write-Host ""

$secureKey = Read-Host "Paste your OpenAI API key" -AsSecureString
$bstr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secureKey)

try {
  $plainKey = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($bstr)
} finally {
  if ($bstr -ne [IntPtr]::Zero) {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($bstr)
  }
}

if ([string]::IsNullOrWhiteSpace($plainKey)) {
  Write-Host "No key entered. Nothing was changed."
  exit 1
}

& npx.cmd supabase secrets set "OPENAI_API_KEY=$plainKey" --project-ref inrovnpmjbyzgailajmu

if ($LASTEXITCODE -ne 0) {
  exit $LASTEXITCODE
}

Write-Host ""
Write-Host "OpenAI API key saved to Supabase."
Write-Host "Press r in the Expo terminal, then try ingredient detection again."
