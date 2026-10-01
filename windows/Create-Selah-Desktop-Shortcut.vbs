Option Explicit

Const SELAH_URL = "https://delight0517.github.io/selah-bible-meditation/"

Dim shell, files, edgePath, desktopPath, startMenuPath, programsPath, shortcut
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

desktopPath = shell.SpecialFolders("Desktop")
Set shortcut = shell.CreateShortcut(files.BuildPath(desktopPath, "Selah.lnk"))
shortcut.TargetPath = edgePath
shortcut.Arguments = "--app=""" & SELAH_URL & """"
shortcut.WorkingDirectory = files.GetParentFolderName(edgePath)
shortcut.Description = "Selah Bible Meditation"
shortcut.IconLocation = edgePath & ",0"
shortcut.Save

startMenuPath = shell.SpecialFolders("StartMenu")
programsPath = files.BuildPath(startMenuPath, "Programs")
If Not files.FolderExists(programsPath) Then files.CreateFolder(programsPath)
Set shortcut = shell.CreateShortcut(files.BuildPath(programsPath, "Selah.lnk"))
shortcut.TargetPath = edgePath
shortcut.Arguments = "--app=""" & SELAH_URL & """"
shortcut.WorkingDirectory = files.GetParentFolderName(edgePath)
shortcut.Description = "Selah Bible Meditation"
shortcut.IconLocation = edgePath & ",0"
shortcut.Save

MsgBox "Selah shortcuts created on your desktop and in the Start menu. They open the official Selah app window in Microsoft Edge.", vbInformation, "Selah"
