Option Explicit

Dim shell, files, installDir, launcherPath, iconPath, wscriptPath, expectedCommand
Dim currentCommand, currentName, currentProtocol, currentIcon
Set shell = CreateObject("WScript.Shell")
Set files = CreateObject("Scripting.FileSystemObject")

installDir = files.BuildPath(shell.ExpandEnvironmentStrings("%LOCALAPPDATA%"), "Programs\Selah")
launcherPath = files.BuildPath(installDir, "Launch-Selah-App.vbs")
iconPath = files.BuildPath(installDir, "selah-app.ico")
wscriptPath = shell.ExpandEnvironmentStrings("%WINDIR%\System32\wscript.exe")
expectedCommand = Chr(34) & wscriptPath & Chr(34) & " " & Chr(34) & launcherPath & Chr(34) & " " & Chr(34) & "%1" & Chr(34)

currentCommand = ReadRegistry("HKCU\Software\Classes\selah\shell\open\command\")
If LCase(currentCommand) <> LCase(expectedCommand) Then
  MsgBox "Selah did not remove the selah: link because its current handler does not match the Selah launcher. No registration was changed.", vbInformation, "Selah"
  WScript.Quit 0
End If

currentName = ReadRegistry("HKCU\Software\Classes\selah\")
currentProtocol = ReadRegistry("HKCU\Software\Classes\selah\URL Protocol")
currentIcon = ReadRegistry("HKCU\Software\Classes\selah\DefaultIcon\")

On Error Resume Next
shell.RegDelete "HKCU\Software\Classes\selah\shell\open\command\"
If currentIcon = Chr(34) & iconPath & Chr(34) & ",0" Then shell.RegDelete "HKCU\Software\Classes\selah\DefaultIcon\"
If currentProtocol = "" Then shell.RegDelete "HKCU\Software\Classes\selah\URL Protocol"
If currentName = "URL:Selah Reading Protocol" Then shell.RegDelete "HKCU\Software\Classes\selah\"
On Error GoTo 0

MsgBox "Selah's selah: link handler was removed. Your desktop and Start menu shortcuts remain.", vbInformation, "Selah"

Function ReadRegistry(path)
  On Error Resume Next
  Err.Clear
  ReadRegistry = CStr(shell.RegRead(path))
  If Err.Number <> 0 Then ReadRegistry = ""
  Err.Clear
  On Error GoTo 0
End Function
