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
session.findById("wnd[0]/usr/cntlIMAGE_CONTAINER/shellcont/shell/shellcont[0]/shell").selectedNode = "F00007"
RequestScreenshot "Select 'List ITR's'"
session.findById("wnd[0]/usr/cntlIMAGE_CONTAINER/shellcont/shell/shellcont[0]/shell").doubleClickNode "F00007"
RequestScreenshot "Click 'Get Variant'"
session.findById("wnd[0]/tbar[1]/btn[17]").press
RequestScreenshot "Load variant and click 'Execute'"
session.findById("wnd[1]/tbar[0]/btn[8]").press
RequestScreenshot "Variant loaded, press 'Execute'"
session.findById("wnd[0]/tbar[1]/btn[8]").press
session.findById("wnd[0]/usr/cntlGRID1/shellcont/shell").setCurrentCell 3,"OWNER"
session.findById("wnd[0]/usr/cntlGRID1/shellcont/shell").selectedRows = "3"
RequestScreenshot "ITR's list displayed as expected"
