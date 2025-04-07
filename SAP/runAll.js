import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

// === Get CLI args ===
const args = process.argv.slice(2);
const params = Object.fromEntries(
    args.map(arg => {
        const [key, value] = arg.replace(/^--/, '').split('=');
        return [key, value];
    })
);

const environment = params.env || 'CH2'; // Default to DEMO if not set

// === Read all test scripts ===
const testFolder = './SAP/tests';
const files = fs.readdirSync(testFolder).filter(f => f.endsWith('.vbs'));

files.forEach((file, index) => {
    const scriptPath = path.join(testFolder, file);
    console.log(`\n🧪 Running test ${index}: ${file}`);

    try {
        execSync(
            `node ./SAP/runner.js --index=${index} --env=${environment} --script=${scriptPath}`,
            { stdio: 'inherit' }
        );
    } catch (err) {
        console.error(`❌ Test failed: ${file}\n`, err.message);
    }
});
