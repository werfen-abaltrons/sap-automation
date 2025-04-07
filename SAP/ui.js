import dotenv from 'dotenv';
dotenv.config();
import inquirer from 'inquirer';
import fs from 'fs';
import path from 'path';
import { spawn, execSync } from 'child_process';

const testRoot = './SAP/tests';

// === Detect available environments ===
const environmentsFromEnv = Object.keys(process.env)
    .filter(key => key.startsWith('SAP_') && key !== 'SAP_USER' && key !== 'SAP_PASS')
    .map(key => key.replace('SAP_', ''));

// === Get list of subfolders inside /tests ===
function getTestFolders() {
    return fs.readdirSync(testRoot).filter(folder =>
        fs.statSync(path.join(testRoot, folder)).isDirectory()
    );
}

// === Get .vbs files inside a given folder ===
function getTestFilesInFolder(folder) {
    const folderPath = path.join(testRoot, folder);
    return fs.readdirSync(folderPath).filter(file => file.endsWith('.vbs'));
}

// === Main logic ===
async function runPrompt() {
    const { mode } = await inquirer.prompt([
        {
            type: 'list',
            name: 'mode',
            message: '🚀 What do you want to run?',
            choices: [
                { name: '▶️ Run one test', value: 'single' },
                { name: '📂 Run all tests in a folder', value: 'all' },
            ],
        },
    ]);

    // === RUN ALL TESTS ===
    if (mode === 'all') {
        const folders = getTestFolders();

        const { selectedFolder, env } = await inquirer.prompt([
            {
                type: 'list',
                name: 'selectedFolder',
                message: '📁 Select a folder to run all tests from:',
                choices: folders,
            },
            {
                type: 'list',
                name: 'env',
                message: '🌐 Select environment:',
                choices: environmentsFromEnv,
            },
        ]);

        const tests = getTestFilesInFolder(selectedFolder);
        console.log(`\n📂 Running all test cases in ${selectedFolder}...`);

        for (let i = 0; i < tests.length; i++) {
            const file = tests[i];
            const scriptPath = path.join(testRoot, selectedFolder, file);
            console.log(`\n🧪 Running test ${i}: ${file}`);
            try {
                execSync(
                    `node ./SAP/runner.js --index=${i} --env=${env} --script="${scriptPath}"`,
                    { stdio: 'inherit' }
                );
            } catch (err) {
                console.error(`❌ Test failed: ${file}\n`, err.message);
            }
        }

        console.log('\n✅ All tests completed.');
        return;
    }

    // === RUN SINGLE TEST ===
    const folders = getTestFolders();

    const { selectedFolder, selectedFile, env } = await inquirer.prompt([
        {
            type: 'list',
            name: 'selectedFolder',
            message: '📁 Select the folder:',
            choices: folders,
        },
        {
            type: 'list',
            name: 'selectedFile',
            message: '📋 Select a test case:',
            choices: ({ selectedFolder }) =>
                getTestFilesInFolder(selectedFolder).map((file, i) => ({
                    name: `[${i}] ${file}`,
                    value: { file, index: i },
                })),
        },
        {
            type: 'list',
            name: 'env',
            message: '🌐 Select environment:',
            choices: environmentsFromEnv,
        },
    ]);

    const scriptPath = path.join(testRoot, selectedFolder, selectedFile.file);
    const indexToRun = selectedFile.index;

    console.log(`\n🚀 Running test: ${selectedFile.file}`);
    console.log(`🧪 Script: ${scriptPath}`);
    console.log(`🌍 Environment: ${env}\n`);

    const child = spawn('node', [
        './SAP/runner.js',
        `--index=${indexToRun}`,
        `--env=${env}`,
        `--script=${scriptPath}`
    ], { stdio: 'inherit' });

    child.on('exit', code => {
        console.log(`\n🔚 Test process exited with code ${code}`);
    });
}

runPrompt();
