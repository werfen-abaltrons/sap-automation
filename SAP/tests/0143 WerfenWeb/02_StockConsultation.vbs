On Error Resume Next

' === Injected bootstrap code ===
' Load shared helper functions from helpers.vbs
Dim helperCode
Set f = CreateObject("Scripting.FileSystemObject").OpenTextFile("SAP/scripts/helpers.vbs", 1)
helperCode = f.ReadAll
f.Close
ExecuteGlobal helperCode

' === Original SAP Script ===
' === Original SAP Script ===
If Not IsObject(application) Then
   Set SapGuiAuto  = GetObject("SAPGUI")
   Set application = SapGuiAuto.GetScriptingEngine
End If
If Not IsObject(connection) Then
   Set connection = application.Children(0)
End If
If Not IsObject(session) Then
   Set session    = connection.Children(0)
End If
If IsObject(WScript) Then
   WScript.ConnectObject session,     "on"
   WScript.ConnectObject application, "on"
End If
session.findById("wnd[0]").maximize
session.findById("wnd[0]/usr/cntlIMAGE_CONTAINER/shellcont/shell/shellcont[0]/shell").selectedNode = "F00002"
RequestScreenshot "Select 'ZMENU'"
session.findById("wnd[0]/usr/cntlIMAGE_CONTAINER/shellcont/shell/shellcont[0]/shell").doubleClickNode "F00002"
RequestScreenshot "Press continue"
session.findById("wnd[1]/tbar[0]/btn[5]").press
session.findById("wnd[0]/usr/tblZHROM015TC_XLUNCH_USU/btnX_LUNCH_USU-TURNO1[3,0]").setFocus
RequestScreenshot "Click Available"
session.findById("wnd[0]/usr/tblZHROM015TC_XLUNCH_USU/btnX_LUNCH_USU-TURNO1[3,0]").press
RequestScreenshot "Menu is opened"


' === Create END flag ===
Dim fileEnd
Set fileEnd = fso.CreateTextFile("SAP/SAP-CAPTURES/end.flag", True)
fileEnd.WriteLine "END"
fileEnd.Close