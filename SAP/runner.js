// === Import required modules ===
import {exec, execSync} from 'child_process'; // To run .vbs scripts or commands from Node
import fs from 'fs'; // To interact with the filesystem (read/write files)
import {promisify} from 'util'; // To convert exec to a Promise
import screenshot from 'screenshot-desktop'; // To take screenshots of the whole screen
import generatePdfReport from '../Support/PDFReport/generatePdfReport.js'; // Custom function to generate PDF with steps
import formatDuration from '../Support/PDFReport/formatDuration.js'; // Utility to format duration as string
import dotenv from 'dotenv';
import path from "path"; // To load environment variables from .env file
dotenv.config(); // Load environment variables

// === Promisify exec so we can use await with it ===
const execPromise = promisify(exec);

// === Load SAP credentials from environment variables ===
const sapUser = process.env.SAP_USER;
const sapPass = process.env.SAP_PASS;

// === Parse CLI arguments ===
const args = process.argv.slice(2);
const params = Object.fromEntries(
    args.map(arg => {
        const [key, value] = arg.replace(/^--/, '').split('=');
        return [key, value];
    })
);

// === Extract test configuration from CLI arguments or fallback values ===
const environment = params.env || 'ENV';
let scriptPath = params.script;
scriptPath = ensureScriptWrapped(scriptPath);

// === Load the test case metadata from testcases.json in the same folder as the script ===
const testFolder = path.dirname(scriptPath);
const testFileName = path.basename(scriptPath);

let testCase = {
    code: 'N/A',
    title: testFileName,
    description: 'N/A',
    expectedResults: 'N/A'
};

const testcasePath = path.join(testFolder, 'testcases.json');

if (fs.existsSync(testcasePath)) {
    try {
        const allTestcases = JSON.parse(fs.readFileSync(testcasePath, 'utf8'));

        // Soporta testcases como objeto tipo { "01_ListUserITRs.vbs": { ... } }
        if (allTestcases[testFileName]) {
            testCase = {
                code: allTestcases[testFileName].code || 'N/A',
                title: allTestcases[testFileName].title || testFileName,
                description: allTestcases[testFileName].testCaseDescription || 'N/A',
                expectedResults: allTestcases[testFileName].expectedResults || 'N/A',
            };
        }
    } catch (e) {
        console.warn(`⚠️ Could not parse testcases.json in ${testFolder}:`, e.message);
    }
}

// === Ensure a test script path is provided ===
if (!scriptPath) {
    console.error('❌ Missing --script=VBS_PATH argument');
    process.exit(1);
}

// === Warn if user/pass are missing ===
if (!sapUser || !sapPass) {
    console.log("User: ", sapUser);
    console.log("Password: ", sapPass);
    console.warn('⚠️ Warning: SAP_USER or SAP_PASSWORD environment variable is missing.');
}

// === Define key paths ===
const LOGIN_SCRIPT_PATH = 'SAP/scripts/openSAP.vbs';
const SIGNAL_FLAG_PATH = 'SAP/SAP-CAPTURES/signal.flag';
const END_FLAG_PATH = 'SAP/SAP-CAPTURES/end.flag';
const SCREENSHOTS_DIR = './evidence';
const screenshots = []; // Array of all steps with images

// === Create screenshots folder if not exists ===
if (!fs.existsSync(SCREENSHOTS_DIR)) {
    fs.mkdirSync(SCREENSHOTS_DIR);
}

// === Wrap Script ===
function ensureScriptWrapped(scriptPath) {
    const contents = fs.readFileSync(scriptPath, 'utf8');

    // Check if it already includes the bootstrap helpers
    const alreadyWrapped = contents.includes('ExecuteGlobal helperCode');

    if (!alreadyWrapped) {
        console.log(`🧰 Wrapping script for automation: ${scriptPath}`);
        // We overwrite the original script with the wrapped one
        execSync(`node ./SAP/wrapScript.js "${scriptPath}"`, { stdio: 'inherit' });
    }

    // Return the original path because it's already wrapped or just got wrapped
    return scriptPath;
}

function isSAPRunning() {
    return new Promise((resolve, reject) => {
        exec('tasklist', (err, stdout, stderr) => {
            if (err) return reject(err);
            resolve(stdout.toLowerCase().includes('saplogon.exe'));
        });
    });
}


// === Function to force-close SAP GUI process ===
async function closeSAP() {
    console.log('🧹 Closing SAP GUI...');
    try {
        const { stdout } = await execPromise('taskkill /IM saplogon.exe /F');
        console.log('✅ SAP GUI closed.');
    } catch (error) {
        console.warn('⚠️ Could not close SAP GUI:', error.message);
    }
}


// === Delete all flags from SAP-CAPTURES folder ===
function cleanSapCaptureFolder() {
    const folderPath = 'SAP/SAP-CAPTURES';
    if (fs.existsSync(folderPath)) {
        const files = fs.readdirSync(folderPath);
        for (const file of files) {
            if (file === '.gitkeep') continue;
            const filePath = `${folderPath}/${file}`;
            try {
                fs.unlinkSync(filePath);
                console.log(`🗑️ Deleted: ${file}`);
            } catch (err) {
                if (err.code === 'EBUSY') {
                    console.warn(`⚠️ File busy (${file}), retrying in 500ms...`);
                    setTimeout(() => {
                        try {
                            fs.unlinkSync(filePath);
                            console.log(`🗑️ Deleted after retry: ${file}`);
                        } catch (e) {
                            console.error(`❌ Still failed to delete ${file}: ${e.message}`);
                        }
                    }, 500);
                } else {
                    console.warn(`⚠️ Failed to delete ${file}: ${err.message}`);
                }
            }
        }
    }
}

// === Wait until a signal.flag is detected and return its content ===
function waitForSignalFlag() {
    return new Promise((resolve) => {
        const interval = setInterval(() => {
            if (fs.existsSync(SIGNAL_FLAG_PATH)) {
                const content = fs.readFileSync(SIGNAL_FLAG_PATH, 'utf8').trim();
                fs.unlinkSync(SIGNAL_FLAG_PATH);
                clearInterval(interval);
                console.log(`📍 Signal received: ${content}`);

                const [stepName, resultFlag] = content.split('||');
                const isResult = resultFlag?.trim().toLowerCase() === 'true';

                resolve({ stepName, isResult });
            }
        }, 300);
    });
}


// === Take a screenshot and save metadata ===
async function captureStep(stepName, isResult, index) {
    const imagePath = `${SCREENSHOTS_DIR}/screenshot${index + 1}.png`;
    await screenshot({ filename: imagePath });
    screenshots.push({ step: stepName, screenshotPath: imagePath, isResult });
    console.log(`📸 Screenshot taken: ${stepName} (isResult: ${isResult})`);
}


// === Main E2E execution ===
(async () => {
    const startTime = Date.now(); // Time tracking for duration
    let index = 0; // Screenshot index

    try {

        const isRunning = await isSAPRunning();
        if (isRunning) {
            await closeSAP();
        } else {
            console.log('SAP is not running, skipping close.');
        }

        // === Resolve SAP connection from environment name ===
        let sapConn = null;

        switch (environment.toUpperCase()) {
            case 'CH1':
                sapConn = process.env.SAP_CH1;
                break;
            case 'CH2':
                sapConn = process.env.SAP_CH2;
                break;
            case 'IZ4':
                sapConn = process.env.SAP_IZ4;
                break;
            case 'SANDBOX1':
                sapConn = process.env.SAP_SANDBOX1;
                break;
            case 'SANDBOX2':
                sapConn = process.env.SAP_SANDBOX2;
                break;
            case 'SANDBOX3':
                sapConn = process.env.SAP_SANDBOX3;
                break;
            default:
                console.error(`❌ Unknown environment: ${environment}`);
                process.exit(1);
        }

        if (!sapConn) {
            console.error(`❌ Missing SAP_${environment} in .env`);
            process.exit(1);
        }

        // === Open SAP GUI with user credentials ===
        console.log('🚀 Launching SAP GUI...');
        await execPromise(`cscript //Nologo "${LOGIN_SCRIPT_PATH}"`, {
            env: {
                ...process.env,
                SAP_USER: sapUser,
                SAP_PASS: sapPass,
                SAP_CONN: sapConn,
            },
        });


        // === Wait for SAP GUI to load ===
        console.log('⏳ Waiting for SAP to initialize...');
        await new Promise(resolve => setTimeout(resolve, 10000));

        // === Execute main test .vbs script ===
        console.log(`🚀 Executing test script: ${scriptPath}`);
        await exec(`cscript //Nologo "${scriptPath}"`);

        // === Loop to listen for flags from VBS ===
        console.log('⏳ Listening for capture signals...');
        while (true) {
            // === If test failed, throw error and skip PDF ===
            if (fs.existsSync('SAP/SAP-CAPTURES/fail.flag')) {
                const reason = fs.readFileSync('SAP/SAP-CAPTURES/fail.flag', 'utf8').trim();
                console.log('⚠️ Fail flag content:', reason);
                throw new Error(`❌ Test failed: ${reason}`);
            }

            // === End of test (VBS signals it's done) ===
            if (fs.existsSync(END_FLAG_PATH)) {
                try {
                    fs.unlinkSync(END_FLAG_PATH);
                    console.log('✅ Test finished (end.flag detected)');
                    break;
                } catch (err) {
                    if (err.code === 'EBUSY') {
                        console.warn('⚠️ end.flag is busy. Retrying...');
                    } else {
                        console.error('❌ Error deleting end.flag:', err.message);
                    }
                }
            }

            // === Screenshot step triggered from VBS ===
            if (fs.existsSync(SIGNAL_FLAG_PATH)) {
                const { stepName, isResult } = await waitForSignalFlag();
                await captureStep(stepName, isResult, index);
                index++;
            }


            // === Fail-safe: exit after 5 minutes max ===
            if (Date.now() - startTime > 5 * 60 * 1000) {
                console.warn('⚠️ Timeout reached. Aborting...');
                throw new Error(`❌ Test failed: ⚠️ Timeout reached`);
            }
        }

        // === Generate the final PDF report ===
        const duration = formatDuration(Date.now() - startTime);

        // === Get the PDF folder ===
        const relativeFolder = path.relative('./SAP/tests', testFolder);
        const pdfOutputPath = path.join('./SAP/pdf', relativeFolder);


        await generatePdfReport(
            null,
            testCase.code,
            'SAP',
            testCase.title,
            screenshots,
            {
                testCaseDescription: testCase.description,
                environment,
                stepStatus: 'Passed',
                user: 'Automatic Test',
                date: new Date().toLocaleDateString(),
                time: new Date().toLocaleTimeString(),
                duration,
                expectedResults: testCase.expectedResults,
            },
            0.28,
            pdfOutputPath
        );



        console.log('📄 PDF report successfully generated 🎉');

    } catch (err) {
        // === Handle unexpected errors or test failures ===
        console.error('❌ Unexpected error during test execution:', err);
    } finally {
        // === Clean up no matter what ===
        await new Promise(resolve => setTimeout(resolve, 1000));
        await closeSAP(); // Close SAP even on error
        cleanSapCaptureFolder(); // Delete flag files
    }
})();
