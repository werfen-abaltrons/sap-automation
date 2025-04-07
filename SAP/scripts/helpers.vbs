' helpers.vbs

Set fso = CreateObject("Scripting.FileSystemObject")

Sub RequestScreenshot(stepName, typeLabel)
    Dim isResult
    Dim label

    label = LCase(CStr(typeLabel))

    If label = "result" Then
        isResult = True
    ElseIf label = "activity" Then
        isResult = False
    Else
        WScript.Echo "❌ Error: typeLabel must be 'Activity' or 'Result'"
        Exit Sub
    End If

    If Not fso.FolderExists("SAP/SAP-CAPTURES") Then
        fso.CreateFolder("SAP/SAP-CAPTURES")
    End If

    Dim flag
    Set flag = fso.CreateTextFile("SAP/SAP-CAPTURES/signal.flag", True)
    flag.WriteLine stepName & "||" & CStr(isResult)
    flag.Close
    WScript.Sleep 1500
End Sub


Sub CreateFailFlag(reason)
    Dim failFlag
    Set failFlag = fso.CreateTextFile("SAP/SAP-CAPTURES/fail.flag", True)
    failFlag.WriteLine reason
    failFlag.Close
    WScript.Echo "❌ Fail flag created: " & reason
    WScript.Quit
End Sub
