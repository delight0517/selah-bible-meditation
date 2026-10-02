@echo off
setlocal
set "SELAH_LAUNCHER=%~dp0Launch-Selah-App.vbs"
if exist "%SELAH_LAUNCHER%" (
  start "Selah" "%WINDIR%\System32\wscript.exe" "%SELAH_LAUNCHER%"
) else (
  echo Selah launcher file was not found: "%SELAH_LAUNCHER%"
  exit /b 1
)
endlocal
