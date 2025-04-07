On Error Resume Next

Dim helperCode
Set f = CreateObject("Scripting.FileSystemObject").OpenTextFile("SAP/scripts/helpers.vbs", 1)
helperCode = f.ReadAll
f.Close
ExecuteGlobal helperCode

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

' === Always create end flag ===
Dim endFlag
Set endFlag = fso.CreateTextFile("C:\SAP-CAPTURES\end.flag", True)
endFlag.WriteLine "END"
endFlag.Close
