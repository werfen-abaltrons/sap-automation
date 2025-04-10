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
session.findById("wnd[0]/usr/cntlIMAGE_CONTAINER/shellcont/shell/shellcont[0]/shell").selectedNode = "F00008"
RequestScreenshot "Click 'Documents...'", "Activity"
session.findById("wnd[0]/usr/cntlIMAGE_CONTAINER/shellcont/shell/shellcont[0]/shell").doubleClickNode "F00008"
RequestScreenshot "Fill 'Process' with 0178 (My Instruments)", "Activity"
session.findById("wnd[0]/usr/ctxtS_PROC-LOW").text = "0178"
session.findById("wnd[0]/usr/ctxtS_PROC-LOW").setFocus
session.findById("wnd[0]/usr/ctxtS_PROC-LOW").caretPosition = 4
session.findById("wnd[0]").sendVKey 0
RequestScreenshot "Click 'Execute'", "Activity"
session.findById("wnd[0]/tbar[1]/btn[8]").press
session.findById("wnd[0]/usr/cntlGRID1/shellcont/shell/shellcont[1]/shell").setCurrentCell 2,"AENNR"
RequestScreenshot "Click 'TCRs'", "Activity"
session.findById("wnd[0]/usr/cntlGRID1/shellcont/shell/shellcont[1]/shell").clickCurrentCell
session.findById("wnd[0]/usr/tabsTABS_0200/tabpTAB05").select
RequestScreenshot "'TCRs' files are displayed", "Result"

' === Create END flag ===
Dim fileEnd
Set fileEnd = fso.CreateTextFile("SAP/SAP-CAPTURES/end.flag", True)
fileEnd.WriteLine "END"
fileEnd.Close