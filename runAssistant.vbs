' runAssistant.vbs - Reads config, launches SAP, guides the tester
Option Explicit
Dim fso : Set fso = CreateObject("Scripting.FileSystemObject")
Dim shell : Set shell = CreateObject("WScript.Shell")

' === Read config
Dim configFile, config, env, scriptPath
Set configFile = fso.OpenTextFile("sap-config.txt", 1)
config = configFile.ReadLine
configFile.Close

env = Split(config, "||")(0)
scriptPath = Split(config, "||")(1)

' === Load helper functions
Dim helperCode, helperFile
Set helperFile = fso.OpenTextFile("SAP/scripts/helpers.vbs", 1)
helperCode = helperFile.ReadAll
helperFile.Close
ExecuteGlobal helperCode

' === Launch SAP
shell.Run "cscript //nologo SAP\scripts\openSAP.vbs " & env, 0, True
WScript.Sleep 10000

' === Read and execute script line by line
Dim scriptFile, line
Set scriptFile = fso.OpenTextFile(scriptPath, 1)

Do Until scriptFile.AtEndOfStream
    line = Trim(scriptFile.ReadLine)

    If line <> "" And Left(line, 1) <> "'" Then
        Dim doCapture : doCapture = MsgBox("Do you want to capture this step?" & vbCrLf & line, 36, "Capture Step")
        If doCapture = 6 Then
            Dim askType, stepType
            askType = MsgBox("Is this a RESULT?", 36, "Step Type")
            If askType = 6 Then
                stepType = "Result"
            Else
                stepType = "Activity"
            End If

            Dim desc : desc = InputBox("Enter step description:", "Step Description")
            If desc = "" Then
                MsgBox "Step description required.", 48
                WScript.Quit
            End If

            RequestScreenshot desc, stepType
        End If

        On Error Resume Next
        ExecuteGlobal line
        If Err.Number <> 0 Then
            MsgBox "Error in: " & line & vbCrLf & Err.Description, 16
            Err.Clear
        End If
        On Error GoTo 0
    End If
Loop
scriptFile.Close

' === Create end.flag
Dim endFlag : Set endFlag = fso.CreateTextFile("C:\SAP-CAPTURES\end.flag", True)
endFlag.WriteLine "END"
endFlag.Close

MsgBox "✅ Finished! The PDF will now be generated automatically.", 64, "Done"
