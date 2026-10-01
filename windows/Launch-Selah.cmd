@echo off
setlocal
set "SELAH_URL=https://delight0517.github.io/selah-bible-meditation/"
set "EDGE_EXE=%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
if not exist "%EDGE_EXE%" set "EDGE_EXE=%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"
if not exist "%EDGE_EXE%" set "EDGE_EXE=%LocalAppData%\Microsoft\Edge\Application\msedge.exe"
if exist "%EDGE_EXE%" (
  start "Selah" "%EDGE_EXE%" --app="%SELAH_URL%"
) else (
  start "" "%SELAH_URL%"
)
endlocal
