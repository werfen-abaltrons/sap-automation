# 🧪 SAP Automated Test Runner – Documentation for QA Team

Welcome to your custom **End-to-End SAP GUI Test Automation Framework**, built for QA analysts and SAP testers – no development knowledge required. Run `.vbs` test scripts, capture screenshots, and generate professional PDF reports, all in a guided, user-friendly experience.

---

## 🧰 What This Framework Does

This automation handles the full E2E testing lifecycle:

1. 🔐 Launch SAP GUI using credentials
2. ⚙️ Execute your `.vbs` SAP test script
3. 📸 Automatically capture screenshots during key steps
4. 📄 Generate a professional PDF report for QA evidence
5. 🧹 Clean up flags and close SAP automatically

---

## 📁 Folder Structure

```
/SAP
├── runner.js                  # Main automation runner
├── ui.js                      # Launches the ui terminal mode
├── wrapScript.js              # Enhances base .vbs scripts by injecting capture prompts
├── /SAP-CAPTURES              # Folder to get the flags from the .vbs file 
├── /tests                     # Folder with subfolders per test group
│   └── 0143 SomeTestGroup/
│       ├── 01_MyTest.vbs
│       └── testcases.json     # Metadata for each .vbs in that folder
├── /scripts
│   ├── openSAP.vbs            # Script to log in to SAP
│   └── helpers.vbs            # Injected into each test
├── /pdf                       # PDF reports
│   └── 0143 SomeTestGroup/
│       └── SAP_MyTest.pdf

/evidence                      # Screenshots captured during tests

/.env                          # SAP_USER, SAP_PASS, SAP_<ENV>

/package.json                  # NPM dependencies and scripts
/package-lock.json             # NPM lockfile
```

---

## 📸 RequestScreenshot & ❌ CreateFailFlag – How to Use Them

These are the **two main functions** you'll use in your `.vbs` test script to control when screenshots are taken or when a test should fail. You don’t need to define these functions — they’re already included automatically.

### 🖼️ RequestScreenshot

Use this to capture a screenshot during your test.  
It helps document key actions or checkpoints.

```vbscript
RequestScreenshot "Describe what's happening", "Activity"

RequestScreenshot "Expected result is visible", "Result"

```

---

### 🚩 CreateFailFlag – Marking a Step as Failed

Use `CreateFailFlag` to **stop the test and mark it as failed** when something doesn’t work as expected.

### ✅ Syntax

```vbscript
CreateFailFlag "Explain what went wrong"
```

### 📌 Example

```vbscript

If session.findById("wnd[0]/usr/ctxtS_PROC-LOW").text = "" Then
    CreateFailFlag "Field 'Process' is empty – test failed"
End If

```

---

## ✅ Full Example of a Test Script

Below is a **complete, real-world script** using the `RequestScreenshot` helper.  
This is what a working `.vbs` test should look like — you can copy and adjust it for your needs.

```vbscript
' === Original SAP Script ===

' 🔐 Connect to SAP session
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

' 🖥 Maximize the main SAP window
session.findById("wnd[0]").maximize

' 🧭 Navigate to the required node
session.findById("wnd[0]/usr/cntlIMAGE_CONTAINER/shellcont/shell/shellcont[0]/shell").selectedNode = "F00008"

' 📸 Capture a screenshot before clicking
RequestScreenshot "Click 'Documents...'", "Activity"

' 🖱 Perform double click
session.findById("wnd[0]/usr/cntlIMAGE_CONTAINER/shellcont/shell/shellcont[0]/shell").doubleClickNode "F00008"

' ✍️ Fill the field with a code
RequestScreenshot "Fill 'Process' with 0178 (My Instruments)", "Activity"
session.findById("wnd[0]/usr/ctxtS_PROC-LOW").text = "0178"
session.findById("wnd[0]/usr/ctxtS_PROC-LOW").setFocus
session.findById("wnd[0]/usr/ctxtS_PROC-LOW").caretPosition = 4
session.findById("wnd[0]").sendVKey 0

' ▶️ Execute the search
RequestScreenshot "Click 'Execute'", "Activity"
session.findById("wnd[0]/tbar[1]/btn[8]").press

' ✅ Select result
session.findById("wnd[0]/usr/cntlGRID1/shellcont/shell/shellcont[1]/shell").setCurrentCell 2,"AENNR"
RequestScreenshot "Click 'TCRs'", "Activity"
session.findById("wnd[0]/usr/cntlGRID1/shellcont/shell/shellcont[1]/shell").clickCurrentCell

' 🧾 Open a tab and confirm files are visible
session.findById("wnd[0]/usr/tabsTABS_0200/tabpTAB05").select
RequestScreenshot "'TCRs' files are displayed", "Result"

```

---

## 🌐 Environment Configuration

In your `.env` file:

```
SAP_USER=yourUser
SAP_PASS=yourPassword

SAP_CH2='ERP_QAS_CH2'
SAP_IZ4='ERP_DEV_IZ4'
SAP_SANDBOX1='OTH_SB1'
SAP_SANDBOX2='OTH_SB2'
SAP_SANDBOX3='OTH_SB3'
```

When launching a test, the runner will pass the right environment to `openSAP.vbs` as `SAP_CONN`.

---

## 🚀 How to Run a Test

Use the terminal UI:

```bash
node ./SAP/ui.js
```

Or run directly:

```bash
node ./SAP/runner.js --env=CH1 --script=./SAP/tests/0143 SomeGroup/01_MyTest.vbs
```

The metadata will be pulled from the `testcases.json` file inside the same folder.

---

---

## 🧾 testcases.json Format

Each test folder (e.g. `0178 MyTestGroup/`) should include a `testcases.json` file that describes all tests in that folder.

### ✅ JSON 

```json
{
  "processCode": "0178",
  "processName": "WeLearn",
  "document": "ISD203839",
  "tests": {
    "01_ListUserITRs.vbs": {
      "title": "List User ITRs",
      "testCaseDescription": "List 'Created ITR's' of the user ABALTRONS",
      "expectedResults": "Table shows a list of ITR's created by ABALTRONS"
    },
    "02_SearchZWEBUSERS.vbs": {
      "title": "ZWEBUSERS Test",
      "testCaseDescription": "The system must display updated stock by warehouse for a given material.",
      "expectedResults": "The results accurately reflect the stock per warehouse with no errors."
    }
  }
}
```

## 📄 What You Get

After execution, a PDF will be generated in:

```
/SAP/pdf/0143 SomeGroup/SAP_MyTest.pdf
```

Including:
- Metadata (title, code, description)
- Screenshots with labels
- Execution duration and status

---

## 🆘 What to Do If Something Goes Wrong

Even though this tool is designed to be safe and guided, sometimes the process may freeze or show an error. Here’s what to do in each case:

### ❗ The Terminal Freezes or Gets Stuck
If you notice the terminal is **not moving**, **no messages appear**, or it seems "stuck", you can cancel it manually:

> **Press `Ctrl + C` in your terminal window.**

- This will **immediately stop** the process.
- It's completely safe to do.
- After cancelling, you can simply start the test again.

### ⚠️ You See an Error Message
Sometimes errors happen because:
- A required file is missing (e.g., `end.flag`, `testcases.json`)
- The SAP window wasn’t open
- A screenshot failed to capture

🛠 **What you can do:**
- Read the error message and see which file or step is failing
- Double-check that SAP is open and logged in
- Make sure your `.vbs` script ends with a proper `end.flag`
- If needed, close SAP and reopen it before trying again

### 😶 The Test Fails Silently (No Error Message)
Sometimes the `.vbs` script may fail without showing any visible error. This can happen if a **function requires a parameter** that wasn't provided, or there's a syntax issue.

🔍 **What to look for:**
- A `RequestScreenshot` or `CreateFailFlag` call without a string argument
- A custom subroutine or function that expects a parameter, but none was passed

🧰 **How to fix it:**
- Open the `.vbs` file and check that all function calls include the needed text or values
- Make sure each `Sub` or `Function` is used properly and ends with `End Sub` or `End Function`
- Use the example format provided in the documentation to double-check your script structure

---


## 🧠 Authors

Built with ❤️ by Adrià Baltrons Mata.  
Reach out on Teams if you need help.