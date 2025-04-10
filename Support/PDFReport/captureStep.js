import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const screenshots = [];

export async function captureStep(stepName, isResult, index) {
    const outputName = `screenshot${index + 1}.png`;
    const imagePath = path.resolve(__dirname, '../../evidence', outputName);
    const scriptPath = path.resolve(__dirname, './captureSAP.ps1');

    const evidenceDir = path.dirname(imagePath);
    if (!fs.existsSync(evidenceDir)) {
        fs.mkdirSync(evidenceDir, { recursive: true });
    }

    console.log("📸 Capturing SAP step:", stepName);
    console.log("🛣️ Screenshot path:", imagePath);
    console.log("⚙️ PowerShell script path:", scriptPath);

    return new Promise((resolve, reject) => {
        const command = `powershell -ExecutionPolicy Bypass -File "${scriptPath}" "${imagePath}"`;

        const child = exec(command, { maxBuffer: 1024 * 1024 }, (error, stdout, stderr) => {
            const trimmedStdout = stdout.trim();
            const trimmedStderr = stderr.trim();

            if (trimmedStdout) console.log("📤 PowerShell stdout:", trimmedStdout);
            if (trimmedStderr) console.warn("⚠️ PowerShell stderr:", trimmedStderr);

            const screenshotExists = fs.existsSync(imagePath);

            if (screenshotExists) {
                screenshots.push({ step: stepName, screenshotPath: imagePath, isResult });
                console.log(`✅ Screenshot saved: ${outputName} (${isResult ? 'Result' : 'Activity'})`);
                return resolve();
            }

            return reject(new Error("❌ Screenshot file not created."));
        });

        child.stdout?.resume();
        child.stderr?.resume();
    });
}

export { screenshots };
