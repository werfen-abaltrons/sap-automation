/*// SAP/generateScript.js
import inquirer from 'inquirer';
import fs from 'fs';
import path from 'path';
import {exec, execSync} from 'child_process';
import {promisify} from "util"; // To run .vbs scripts or commands from Node

const baseScriptPath = path.join('SAP', 'scriptGenerator');
const outputPath = path.join('SAP', 'tests', 'generated.vbs');
const openSapScript = path.join('SAP', 'scripts', 'openSAP.vbs');
const LOGIN_SCRIPT_PATH = 'C:\\Users\\abaltrons\\Sites\\corporate-websites\\testing\\e2e\\SAP\\scripts\\openSAP.vbs';
// === Load SAP credentials from environment variables ===
const sapUser = process.env.SAP_USER;
const sapPass = process.env.SAP_PASSWORD;
// === Step 1: Select environment
const environments = ['CH1', 'CH2', 'IZ4', 'SANDBOX1', 'SANDBOX2', 'SANDBOX3'];
const execPromise = promisify(exec);

async function main() {
    const { environment } = await inquirer.prompt([
        {
            type: 'list',
            name: 'environment',
            message: '🌍 Select SAP environment:',
            choices: environments,
        },
    ]);

    // === Step 2: Get base script
    const files = fs.readdirSync(baseScriptPath).filter(f => f.endsWith('.vbs'));
    if (files.length === 0) {
        console.error('❌ No .vbs file found in scriptGenerator.');
        process.exit(1);
    }
    if (files.length > 1) {
        console.error('❌ More than one file found in scriptGenerator. Please leave only one.');
        process.exit(1);
    }

    const baseFile = path.join(baseScriptPath, files[0]);
    const lines = fs.readFileSync(baseFile, 'utf-8').split(/\r?\n/);
    const outputLines = [];

    // === Step 3: Launch SAP
    console.log(`🚀 Launching SAP for environment ${environment}...`);
    await execPromise(`cscript //Nologo "${LOGIN_SCRIPT_PATH}"`, {
        env: {
            ...process.env,
            SAP_USER: 'abaltrons',
            SAP_PASS: 'L3o2523.',
            SAP_ENV: "CH1",
        },
    });

    // === Step 4: Process script line by line
    for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed === '') {
            outputLines.push('');
            continue;
        }

        console.log(`\n📄 LINE:\n${trimmed}`);

        const { doCapture } = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'doCapture',
                message: '📸 Do you want to take a screenshot here?',
                default: false,
            },
        ]);

        if (doCapture) {
            const { typeLabel, description } = await inquirer.prompt([
                {
                    type: 'list',
                    name: 'typeLabel',
                    message: '📌 What type of step is this?',
                    choices: ['Activity', 'Result'],
                },
                {
                    type: 'input',
                    name: 'description',
                    message: '📝 Enter a description for this step:',
                    validate: input => input.trim() !== '' || 'Description is required.',
                },
            ]);

            outputLines.push(`RequestScreenshot "${description}", "${typeLabel}"`);
        }

        outputLines.push(line);
    }

    // === Step 5: Write final script
    fs.writeFileSync(outputPath, outputLines.join('\r\n'), 'utf-8');
    console.log(`\n✅ Script generated: ${outputPath}`);
}

main();

 */
