Option Explicit

Const SHORTCUT_NAME = "Selah App Window"

Dim shell, files, edgePath, sourceLauncher, launcherPath, installDir, wscriptPath
Dim desktopPath, startMenuPath, programsPath, desktopShortcutPath, startShortcutPath
Dim sourceIcon, iconPath
Set shell = CreateObject("WScript.Shell")
Set files = CreateObject("Scripting.FileSystemObject")

edgePath = shell.ExpandEnvironmentStrings("%ProgramFiles(x86)%") & "\Microsoft\Edge\Application\msedge.exe"
If Not files.FileExists(edgePath) Then
  edgePath = shell.ExpandEnvironmentStrings("%ProgramFiles%") & "\Microsoft\Edge\Application\msedge.exe"
End If
If Not files.FileExists(edgePath) Then
  edgePath = shell.ExpandEnvironmentStrings("%LocalAppData%") & "\Microsoft\Edge\Application\msedge.exe"
End If

If Not files.FileExists(edgePath) Then
  MsgBox "Microsoft Edge was not found in a standard installation folder. Install Edge or use Launch-Selah.cmd with your default browser.", vbExclamation, "Selah"
  WScript.Quit 1
End If

sourceLauncher = files.BuildPath(files.GetParentFolderName(WScript.ScriptFullName), "Launch-Selah-App.vbs")
If Not files.FileExists(sourceLauncher) Then
  MsgBox "The Selah app-window launcher was not found: " & sourceLauncher, vbExclamation, "Selah"
  WScript.Quit 1
End If

installDir = files.BuildPath(shell.ExpandEnvironmentStrings("%LOCALAPPDATA%"), "Programs\Selah")
If Not files.FolderExists(files.GetParentFolderName(installDir)) Then files.CreateFolder files.GetParentFolderName(installDir)
If Not files.FolderExists(installDir) Then files.CreateFolder installDir
launcherPath = files.BuildPath(installDir, "Launch-Selah-App.vbs")
If files.FileExists(launcherPath) Then
  If InStr(1, ReadUtf8(launcherPath), "Selah managed app launcher v1", vbTextCompare) = 0 Then
    MsgBox "A launcher with the Selah filename already exists in " & installDir & ". It was left unchanged.", vbExclamation, "Selah"
    WScript.Quit 1
  End If
End If
files.CopyFile sourceLauncher, launcherPath, True
sourceIcon = files.BuildPath(files.GetParentFolderName(WScript.ScriptFullName), "selah-app.ico")
If Not files.FileExists(sourceIcon) Then
  MsgBox "The Selah app icon was not found: " & sourceIcon, vbExclamation, "Selah"
  WScript.Quit 1
End If
iconPath = files.BuildPath(installDir, "selah-app.ico")
files.CopyFile sourceIcon, iconPath, True

wscriptPath = shell.ExpandEnvironmentStrings("%WINDIR%\System32\wscript.exe")
If Not files.FileExists(wscriptPath) Then
  MsgBox "Windows Script Host was not found.", vbExclamation, "Selah"
  WScript.Quit 1
End If

desktopPath = shell.SpecialFolders("Desktop")
startMenuPath = shell.SpecialFolders("StartMenu")
programsPath = files.BuildPath(startMenuPath, "Programs")
desktopShortcutPath = files.BuildPath(desktopPath, SHORTCUT_NAME & ".lnk")
startShortcutPath = files.BuildPath(programsPath, SHORTCUT_NAME & ".lnk")

If Not files.FolderExists(programsPath) Then files.CreateFolder(programsPath)

EnsureShortcut desktopShortcutPath
EnsureShortcut startShortcutPath
RegisterProtocol

Sub EnsureShortcut(path)
  Dim shortcut, expectedArgs, sourceArgs, currentArgs
  expectedArgs = Chr(34) & launcherPath & Chr(34)
  sourceArgs = Chr(34) & sourceLauncher & Chr(34)
  If files.FileExists(path) Then
    Set shortcut = shell.CreateShortcut(path)
    currentArgs = shortcut.Arguments
    If LCase(shortcut.TargetPath) = LCase(wscriptPath) And (currentArgs = expectedArgs Or currentArgs = sourceArgs) Then
      shortcut.Arguments = expectedArgs
      shortcut.WorkingDirectory = installDir
      shortcut.Description = "Selah Bible Meditation"
      shortcut.IconLocation = iconPath & ",0"
      shortcut.Save
      Exit Sub
    End If
    MsgBox "A different shortcut already uses this name, so it was left unchanged: " & path, vbExclamation, "Selah"
    Exit Sub
  End If

  Set shortcut = shell.CreateShortcut(path)
  shortcut.TargetPath = wscriptPath
  shortcut.Arguments = expectedArgs
  shortcut.WorkingDirectory = files.GetParentFolderName(launcherPath)
  shortcut.Description = "Selah Bible Meditation"
  shortcut.IconLocation = iconPath & ",0"
  shortcut.Save
End Sub
Sub RegisterProtocol()
  Dim expectedCommand, existingCommand, existingProtocol, existingName, writeFailed
  expectedCommand = Chr(34) & wscriptPath & Chr(34) & " " & Chr(34) & launcherPath & Chr(34) & " " & Chr(34) & "%1" & Chr(34)
  existingCommand = ReadRegistry("HKCR\selah\shell\open\command\")
  existingProtocol = ReadRegistry("HKCR\selah\URL Protocol")
  existingName = ReadRegistry("HKCR\selah\")

  If LCase(existingCommand) = LCase(expectedCommand) And existingProtocol = "" Then Exit Sub
  If Len(existingCommand) > 0 Or Len(existingProtocol) > 0 Or (Len(existingName) > 0 And existingName <> "URL:Selah Reading Protocol") Then
    MsgBox "Another application already owns the selah: link. Its registration was left unchanged. Selah shortcuts were installed, but reading links will not open this Windows app until that registration is resolved.", vbExclamation, "Selah"
    Exit Sub
  End If

  On Error Resume Next
  Err.Clear
  shell.RegWrite "HKCU\Software\Classes\selah\", "URL:Selah Reading Protocol", "REG_SZ"
  If Err.Number = 0 Then shell.RegWrite "HKCU\Software\Classes\selah\URL Protocol", "", "REG_SZ"
  If Err.Number = 0 Then shell.RegWrite "HKCU\Software\Classes\selah\DefaultIcon\", Chr(34) & iconPath & Chr(34) & ",0", "REG_SZ"
  If Err.Number = 0 Then shell.RegWrite "HKCU\Software\Classes\selah\shell\open\command\", expectedCommand, "REG_SZ"
  writeFailed = (Err.Number <> 0)
  Err.Clear
  On Error GoTo 0

  If writeFailed Then
    MsgBox "Selah shortcuts were installed, but Windows could not register the selah: reading-link handler.", vbExclamation, "Selah"
  End If
End Sub
Function ReadUtf8(path)
  Dim stream
  Set stream = CreateObject("ADODB.Stream")
  stream.Type = 2
  stream.Charset = "utf-8"
  stream.Open
  stream.LoadFromFile path
  ReadUtf8 = stream.ReadText
  stream.Close
End Function
Function ReadRegistry(path)
  On Error Resume Next
  Err.Clear
  ReadRegistry = CStr(shell.RegRead(path))
  If Err.Number <> 0 Then ReadRegistry = ""
  Err.Clear
  On Error GoTo 0
End Function
