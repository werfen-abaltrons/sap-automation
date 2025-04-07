// wrapScript.js
// Wraps a raw SAP .vbs script with helpers, signals, and END flag

import fs from 'fs';
import path from 'path';

const inputPath = process.argv[2];

if (!inputPath) {
    console.error('❌ Usage: node wrapScript.js <input.vbs>');
    process.exit(1);
}

try {
    let rawScript = fs.readFileSync(inputPath, 'utf-8');
    rawScript = rawScript.replace(/[\uFEFF\u200B\u2060\u00A0]/g, ''); // Remove weird characters

    const wrappedScript = [
        'On Error Resume Next',
        '',
        "' === Injected bootstrap code ===",
        "' Load shared helper functions from helpers.vbs",
        'Dim helperCode',
        'Set f = CreateObject("Scripting.FileSystemObject").OpenTextFile("SAP/scripts/helpers.vbs", 1)',
        'helperCode = f.ReadAll',
        'f.Close',
        'ExecuteGlobal helperCode',
        '',
        "' === Original SAP Script ===",
        rawScript,
        '',
        "' === Create END flag ===",
        'Dim fileEnd',
        'Set fileEnd = fso.CreateTextFile("SAP/SAP-CAPTURES/end.flag", True)',
        'fileEnd.WriteLine "END"',
        'fileEnd.Close'
    ].join('\n');

    // Overwrite the original file
    fs.writeFileSync(inputPath, wrappedScript, 'utf8');
    console.log(`✅ Script wrapped and overwritten: ${inputPath}`);
} catch (err) {
    console.error('❌ Error wrapping script:', err.message);
    process.exit(1);
}
