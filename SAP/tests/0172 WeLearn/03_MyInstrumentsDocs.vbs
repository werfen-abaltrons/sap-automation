On Error Resume Next

' === Injected bootstrap code ===
' Load shared helper functions from helpers.vbs
Dim helperCode
Set f = CreateObject("Scripting.FileSystemObject").OpenTextFile("SAP/scripts/helpers.vbs", 1)
helperCode = f.ReadAll
f.Close
ExecuteGlobal helperCode

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
session.findById("wnd[0]/usr/cntlIMAGE_CONTAINER/shellcont/shell/shellcont[0]/shell").selectedNode = "F00009"
RequestScreenshot "Click 'ZWEBUSERS'", "Activity"
session.findById("wnd[0]/usr/cntlIMAGE_CONTAINER/shellcont/shell/shellcont[0]/shell").doubleClickNode "F00009"
session.findById("wnd[0]/usr/txtS_M_EM-LOW").text = "automatic_test*"
RequestScreenshot "Fill 'automatic_test*' & Execute", "Activity"
session.findById("wnd[0]/usr/txtS_M_EM-LOW").setFocus
session.findById("wnd[0]/usr/txtS_M_EM-LOW").caretPosition = 15
session.findById("wnd[0]/tbar[1]/btn[8]").press
RequestScreenshot "Press 'WEBES'", "Activity"
session.findById("wnd[0]/usr/cntlGRID1/shellcont/shell").currentCellRow = 11
session.findById("wnd[0]/usr/cntlGRID1/shellcont/shell").selectedRows = "11"
session.findById("wnd[0]/usr/cntlGRID1/shellcont/shell").doubleClickCurrentCell
RequestScreenshot "Press 'MyInstruments'", "Activity"
session.findById("wnd[0]/usr/cntlCC_TREE/shellcont/shell").selectedNode = "MI"
session.findById("wnd[0]/usr/cntlCC_TREE/shellcont/shell").doubleClickNode "MI"
RequestScreenshot "Permissions are displayed", "Result"

' === Create END flag ===
Dim fileEnd
Set fileEnd = fso.CreateTextFile("SAP/SAP-CAPTURES/end.flag", True)
fileEnd.WriteLine "END"
fileEnd.Close