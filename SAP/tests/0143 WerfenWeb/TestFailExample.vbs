On Error Resume Next

' === Injected bootstrap code ===
' Load shared helper functions from helpers.vbs
Dim helperCode
Set f = CreateObject("Scripting.FileSystemObject").OpenTextFile("SAP/scripts/helpers.vbs", 1)
helperCode = f.ReadAll
f.Close
ExecuteGlobal helperCode

' === Original SAP Script ===

' === Setup objects ===
Dim fso, failFlag, shouldFail
Set fso = CreateObject("Scripting.FileSystemObject")

' === Simulate condition (change to True or False to test) ===
shouldFail = True  ' <-- Set to False to simulate a passing test

' === Simulated test step ===
WScript.Echo "Running test..."

If shouldFail Then
    CreateFailFlag "Test error"
Else
    WScript.Echo "✅ Simulated test passed."
End If



' === Create END flag ===
Dim fileEnd
Set fileEnd = fso.CreateTextFile("SAP/SAP-CAPTURES/end.flag", True)
fileEnd.WriteLine "END"
fileEnd.Close