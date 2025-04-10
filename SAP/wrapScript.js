// wrapScript.js
// Wraps a raw SAP .vbs script with helpers, signals, and END flag
import fs from 'fs';

const inputPath = process.argv[2];

if (!inputPath) {
    console.error('❌ Usage: node wrapScript.js <input.vbs>');
    process.exit(1);
}

function readVbsFileSafely(filePath) {
    const buffer = fs.readFileSync(filePath);

    // Detect BOM: UTF-16 LE starts with 0xFF 0xFE
    const isUtf16LE = buffer[0] === 0xFF && buffer[1] === 0xFE;

    return isUtf16LE
        ? buffer.toString('utf16le')
        : buffer.toString('utf8');
}

try {
    let rawScript = readVbsFileSafely(inputPath);
    rawScript = rawScript.replace(/[\uFEFF\u200B\u2060\u00A0]/g, ''); // Remove weird characters
    rawScript = rawScript.replace(/\r?\n/g, '\r\n');
    rawScript = rawScript.trim();

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
