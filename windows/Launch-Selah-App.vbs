Option Explicit
' Selah managed app launcher v1

Const SELAH_URL = "https://delight0517.github.io/selah-bible-meditation/?windowsShell=1"

Dim shell, files, edgePath, localAppData, guardRoot, guardLauncher, extensionPath
Dim allowedExtensions, pacPath, netFlags, launcherSource, commandLine, dryRun
Dim argumentIndex, argument, deepLink, requestedUrl, launchUrl
Set shell = CreateObject("WScript.Shell")
Set files = CreateObject("Scripting.FileSystemObject")

' The protocol handler passes one complete URI. Accept only the documented
' read request shape and a restricted request ID; never forward arbitrary URLs.
dryRun = False
deepLink = ""
For argumentIndex = 0 To WScript.Arguments.Count - 1
  argument = CStr(WScript.Arguments(argumentIndex))
  If LCase(argument) = "--dry-run" Then
    dryRun = True
  ElseIf LCase(Left(argument, 8)) = "selah://" Then
    If Len(deepLink) > 0 Then FailClosed "Only one Selah reading link can be opened at a time."
    deepLink = argument
  Else
    FailClosed "Unsupported launcher argument."
  End If
Next

launchUrl = SELAH_URL
If Len(deepLink) > 0 Then
  requestedUrl = ParseReadingLink(deepLink)
  If Len(requestedUrl) = 0 Then FailClosed "The Selah reading link is invalid."
  launchUrl = requestedUrl
End If

localAppData = shell.ExpandEnvironmentStrings("%LOCALAPPDATA%")
guardRoot = files.BuildPath(localAppData, "SixVPNBlocker")
guardLauncher = files.BuildPath(guardRoot, "Launch-6VPN-Edge.vbs")

If files.FolderExists(guardRoot) Then
  ' Preserve the user's managed Edge route. Do not silently start an
  ' unprotected browser if the guard configuration is incomplete.
  If Not files.FileExists(guardLauncher) Then FailClosed "The managed Edge launcher is missing."
  launcherSource = ReadUtf8(guardLauncher)
  edgePath = ReadAssignment(launcherSource, "browser")
  extensionPath = ReadAssignment(launcherSource, "ext")
  netFlags = ReadAssignment(launcherSource, "netFlags")
  pacPath = files.BuildPath(guardRoot, "sixvpn_block.pac")

  If Len(edgePath) = 0 Or LCase(files.GetFileName(edgePath)) <> "msedge.exe" Then FailClosed "Could not read the managed Edge path."
  If Not files.FileExists(edgePath) Then FailClosed "The managed Edge executable was not found."
  If LCase(extensionPath) <> LCase(files.BuildPath(guardRoot, "chrome_blocker")) Then FailClosed "The managed Edge extension path differs from the expected guard folder."
  If Not files.FolderExists(extensionPath) Then FailClosed "The managed Edge protection extension is missing."
  If InStr(1, netFlags, "--proxy-pac-url", vbTextCompare) = 0 Or InStr(1, netFlags, "sixvpn_block.pac", vbTextCompare) = 0 Then FailClosed "The managed Edge proxy settings could not be confirmed."
  If Not files.FileExists(pacPath) Then FailClosed "The managed Edge proxy configuration file is missing."

  ' --disable-extensions-except accepts extension directory paths, not IDs.
  ' Keep only the managed SixVPN unpacked extension in this protected route.
  allowedExtensions = extensionPath
  commandLine = Quote(edgePath) & " --disable-extensions-except=" & Quote(allowedExtensions) & _
      " --load-extension=" & Quote(extensionPath) & " --disable-quic --proxy-pac-url=" & Quote(ToFileUri(pacPath)) & _
      " --app=" & Quote(launchUrl)
Else
  edgePath = FindEdge()
  If Len(edgePath) > 0 Then
    commandLine = Quote(edgePath) & " --app=" & Quote(launchUrl)
  Else
    commandLine = ""
  End If
End If

If dryRun Then
  WScript.StdOut.WriteLine commandLine
  WScript.Quit 0
End If

If Len(commandLine) = 0 Then
  shell.Run Quote(launchUrl), 1, False
Else
  shell.Run commandLine, 1, False
End If

Function FindEdge()
  Dim candidate
  candidate = shell.ExpandEnvironmentStrings("%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe")
  If files.FileExists(candidate) Then FindEdge = candidate: Exit Function
  candidate = shell.ExpandEnvironmentStrings("%ProgramFiles%\Microsoft\Edge\Application\msedge.exe")
  If files.FileExists(candidate) Then FindEdge = candidate: Exit Function
  candidate = shell.ExpandEnvironmentStrings("%LOCALAPPDATA%\Microsoft\Edge\Application\msedge.exe")
  If files.FileExists(candidate) Then FindEdge = candidate: Exit Function
  FindEdge = ""
End Function

Function ParseReadingLink(value)
  Dim expression, matches
  Set expression = CreateObject("VBScript.RegExp")
  expression.Global = False
  expression.IgnoreCase = True
  expression.Pattern = "^selah://read\?request=([A-Za-z0-9._-]{1,128})$"
  If Not expression.Test(value) Then
    ParseReadingLink = ""
    Exit Function
  End If
  Set matches = expression.Execute(value)
  ParseReadingLink = SELAH_URL & "&homeAction=read&requestId=" & matches(0).SubMatches(0)
End Function

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

Function ReadAssignment(source, key)
  Dim lines, line, equalsAt, value
  lines = Split(source, vbLf)
  For Each line In lines
    line = Replace(CStr(line), vbCr, "")
    equalsAt = InStr(1, line, "=", vbBinaryCompare)
    If equalsAt > 0 Then
      If LCase(Trim(Left(line, equalsAt - 1))) = LCase(key) Then
        value = Trim(Mid(line, equalsAt + 1))
        If Len(value) >= 2 Then
          If Left(value, 1) = Chr(34) And Right(value, 1) = Chr(34) Then
            value = Mid(value, 2, Len(value) - 2)
          End If
        End If
        ReadAssignment = Replace(value, Chr(34) & Chr(34), Chr(34))
        Exit Function
      End If
    End If
  Next
  ReadAssignment = ""
End Function

Function ToFileUri(path)
  Dim normalized
  normalized = Replace(path, "\", "/")
  normalized = Replace(normalized, " ", "%20")
  ToFileUri = "file:///" & normalized
End Function

Function Quote(value)
  Quote = Chr(34) & value & Chr(34)
End Function

Sub FailClosed(message)
  If dryRun Then
    WScript.StdErr.WriteLine "ERROR: " & message
  Else
    MsgBox message & vbCrLf & vbCrLf & "Selah did not launch so the managed browser protection stays in effect.", vbExclamation, "Selah"
  End If
  WScript.Quit 1
End Sub
