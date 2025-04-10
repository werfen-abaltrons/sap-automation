On Error Resume Next

Dim SapGuiAuto, application, connection, session
Dim sapUser, sapPass, sapConn, shell, objShell

Set shell = CreateObject("WScript.Shell")
Set objShell = CreateObject("WScript.Shell")

' === Read variables passed from Node.js ===
sapUser = shell.Environment("PROCESS")("SAP_USER")
sapPass = shell.Environment("PROCESS")("SAP_PASS")
sapConn = shell.Environment("PROCESS")("SAP_CONN")

If sapUser = "" Or sapPass = "" Or sapConn = "" Then
    MsgBox "❌ Missing SAP_USER, SAP_PASS or SAP_CONN"
    WScript.Quit
End If

' === Minimize all windows ===
Set shell = CreateObject("Shell.Application")
shell.MinimizeAll

' === Launch SAP Logon ===
objShell.Run """C:\Program Files (x86)\SAP\FrontEnd\SAPgui\saplogon.exe"""
WScript.Sleep 8000

Set SapGuiAuto = GetObject("SAPGUI")
If Err.Number <> 0 Then
    MsgBox "❌ Could not connect to SAP GUI: " & Err.Description
    WScript.Quit
End If

Set application = SapGuiAuto.GetScriptingEngine

' === Open the mapped connection ===
Set connection = application.OpenConnection(sapConn, True)
If Err.Number <> 0 Then
    MsgBox "❌ Could not open SAP connection: " & Err.Description
    WScript.Quit
End If

Set session = connection.Children(0)

' === Minimize SAP GUI window ===
session.findById("wnd[0]").iconify

' === Maximize and log in ===
session.findById("wnd[0]").resizeWorkingPane 320, 80, 0
WScript.Sleep 1000
session.findById("wnd[0]/usr/txtRSYST-BNAME").text = sapUser
session.findById("wnd[0]/usr/pwdRSYST-BCODE").text = sapPass
session.findById("wnd[0]/usr/pwdRSYST-BCODE").setFocus
session.findById("wnd[0]/usr/pwdRSYST-BCODE").caretPosition = Len(sapPass)
session.findById("wnd[0]").sendVKey 0
