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
├── runAll.js                  # Executes all test scripts in batch mode
├── ui.js                      # Launches the ui terminal mode
├── wrapScript.js              # Enhances base .vbs scripts by injecting capture prompts
├── /tests                     # Folder with subfolders per test group
│   └── 0143 SomeTestGroup/
│       ├── 01_MyTest.vbs
│       └── testcases.json     # Metadata for each .vbs in that folder
├── /scripts
│   ├── openSAP.vbs            # Script to log in to SAP
│   └── helpers.vbs            # Injected into each test
├── /evidence                  # Screenshots captured during tests
├── /pdf                       # PDF reports
│   └── 0143 SomeTestGroup/
│       └── SAP_MyTest.pdf

/.env                          # SAP_USER, SAP_PASS, SAP_<ENV>

/package.json                  # NPM dependencies and scripts
/package-lock.json             # NPM lockfile
```

---

## 🧪 Writing a Test Script

1. Record your `.vbs` using SAP GUI scripting.
2. Use `RequestScreenshot "Step description"` to mark evidence points.
3. On failure, use `CreateFailFlag "Reason"`.
4. End with a flag file:

```vbscript
Set f = fso.CreateTextFile("SAP/SAP-CAPTURES/end.flag", True)
f.WriteLine "END"
f.Close
```

---

## 🧰 Helper Functions

Put shared logic into `SAP/scripts/helpers.vbs`:

```vbscript
Sub RequestScreenshot(stepName)
    Set f = fso.CreateTextFile("SAP/SAP-CAPTURES/signal.flag", True)
    f.WriteLine stepName
    f.Close
    WScript.Sleep 1500
End Sub

Sub CreateFailFlag(reason)
    Set f = fso.CreateTextFile("SAP/SAP-CAPTURES/fail.flag", True)
    f.WriteLine reason
    f.Close
    WScript.Echo "❌ " & reason
    WScript.Quit
End Sub
```

---

## 🌐 Environment Configuration

In your `.env` file:

```
SAP_USER=yourUser
SAP_PASS=yourPassword
SAP_CH1='ERP__PRD_CH1'
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

## 🧾 testcases.json Format

Each test folder (e.g. `0143 SomeGroup/`) should include a file like this:

```json
{
  "01_MyTest.vbs": {
    "code": "0143",
    "title": "MyTest",
    "testCaseDescription": "Check basic SAP login flow",
    "expectedResults": "User is logged into SAP successfully"
  }
}
```

---

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

## 🧠 Authors

Built with ❤️ by Adrià Baltrons Mata.  
Reach out on Teams if you need help.