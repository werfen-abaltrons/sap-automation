/*
import fs from 'fs-extra';
import { promises as fsPromises } from 'fs';
import { PDFDocument, rgb } from 'pdf-lib';
import path from 'path';

/**
 * Generates a PDF report with multiple UI screenshots.
 * @param {import('@playwright/test').Page} page - Playwright page instance.
 * @param {string} processNum - Process number of application
 * @param {string} appName - Name of the application.
 * @param {string} testName - Name of the test for file naming.
 * @param {Array<{ step: string, screenshotPath: string }>} screenshots - List of screenshots with step descriptions.
 * @param {Object} generalInfo - General test information (Tests, Expected result, Final status, Date, Time, User).
 * @param imageScale
 * @param evidenceFolder
 */
/*
async function generatePdfReportOld(page, processNum , appName, testName, screenshots, generalInfo, imageScale = 0.32, evidenceFolder = 'test-pdf-report') {
    try {
        console.log('Starting PDF report generation...');

        const processAppName = processNum + ' ' + appName;

        const folderPath = path.resolve(evidenceFolder);
        console.log(`Ensuring folder exists at: ${folderPath}`);
        await fs.ensureDir(folderPath); // Ensure the folder exists

        const pdfPath = path.join(folderPath, `${appName}_${testName}.pdf`);
        console.log(`PDF will be saved to: ${pdfPath}`);

        // Create a PDF document
        console.log('Creating a new PDF document...');
        const pdfDoc = await PDFDocument.create();

        const font = await pdfDoc.embedFont('Helvetica'); // Regular font
        const boldFont = await pdfDoc.embedFont('Helvetica-Bold'); // Bold font

        // Define Werfen logo path
        const logoPath = path.join('./Support/PDFReport', 'werfen-logo.png');
        console.log(`Reading logo image from: ${logoPath}`);
        const logoBytes = await fsPromises.readFile(logoPath);
        const logoImage = await pdfDoc.embedPng(logoBytes);

        // First Page: General Information
        console.log('Adding first page with general information...');
        const firstPage = pdfDoc.addPage([595, 842]); // A4 size (portrait)

        firstPage.drawImage(logoImage, {
            x: 20,
            y: 780,
            width: 200,
            height: 40,
        });

        console.log("Process: " + processAppName);
        firstPage.drawText('>> Process: ', { x: 50, y: 700, size: 12, font: boldFont });
        firstPage.drawText(processAppName, { x: 150, y: 700, size: 12 });

        console.log("Test Case Description: " +  generalInfo.testCaseDescription);
        firstPage.drawText('>> Test Case Description:', { x: 50, y: 680, size: 12, font: boldFont });
        wrapText(firstPage, generalInfo.testCaseDescription, 150, 660, 12, font);

        console.log("Environment: " +  generalInfo.environment);
        firstPage.drawText('>> Environment:', { x: 50, y: 580, size: 12, font: boldFont });
        firstPage.drawText(generalInfo.environment, { x: 150, y: 580, size: 12 });

        console.log("Step Status: " +  generalInfo.stepStatus);
        firstPage.drawText('>> Step Status:', { x: 50, y: 560, size: 12, font: boldFont });
        firstPage.drawText(generalInfo.stepStatus, { x: 150, y: 560, size: 12 });

        console.log("User: " +  generalInfo.user);
        firstPage.drawText('>> Tested By:', { x: 50, y: 540, size: 12, font: boldFont });
        firstPage.drawText(generalInfo.user, { x: 150, y: 540, size: 12 });

        console.log("Tested On: " +  `${generalInfo.date} ${generalInfo.time} (CET)`);
        firstPage.drawText('>> Tested On:', { x: 50, y: 520, size: 12, font: boldFont });
        firstPage.drawText(`${generalInfo.date} ${generalInfo.time} (CET)`, { x: 150, y: 520, size: 12 });

        console.log("Duration: " +  generalInfo.duration);
        firstPage.drawText('>> Duration:', { x: 50, y: 500, size: 12, font: boldFont });
        firstPage.drawText(`${generalInfo.duration}`, { x: 150, y: 500, size: 12 });

        console.log("Actual Results: " +  generalInfo.expectedResults);
        firstPage.drawText('>> Actual results:', { x: 50, y: 480, size: 12, font: boldFont });
        firstPage.drawText('Expected results have been matched:', { x: 70, y: 460, size: 12});
        wrapText(firstPage, generalInfo.expectedResults, 100, 440, 12, font);


        let index = 1; // Start from 1 for step numbering
        // Step Pages
        console.log(`Processing ${screenshots.length} activities...`);
        for (const { step, screenshotPath } of screenshots) {
            console.log(`Processing step ${index}: ${step}`);

            const imageBytes = await fsPromises.readFile(screenshotPath);
            console.log(`Reading screenshot from: ${screenshotPath}`);
            const image = await pdfDoc.embedPng(imageBytes);
            const { width, height } = image.scale(imageScale);

            const pdfPage = pdfDoc.addPage([595, 842]); // A4 size (portrait)

            // Header with Werfen logo and step number
            pdfPage.drawImage(logoImage, {
                x: 20,
                y: 780,
                width: 200,
                height: 40,
            });

            pdfPage.drawText(`Activity ${index}:`, {
                x: 40,
                y: 700,
                size: 14,
                font: boldFont
            });

            pdfPage.drawText(step, {
                x: 120,
                y: 700,
                size: 14,
            });

            // Draw the image
            pdfPage.drawImage(image, {
                x: 32.5,
                y: 325,
                width,
                height,
            });

            // Page number
            pdfPage.drawText(`Page ${index + 1} of ${screenshots.length + 1}  `, { x: 280, y: 20, size: 10, font: boldFont });

            index++;
        }

        // Save the PDF
        console.log('Saving PDF...');
        const pdfBytes = await pdfDoc.save();
        await fsPromises.writeFile(pdfPath, pdfBytes);

        // Remove all screenshot files after saving the PDF
        console.log('Removing screenshots...');
        for (const { screenshotPath } of screenshots) {
            try {
                await fsPromises.unlink(screenshotPath); // Delete screenshot
                console.log(`Removed screenshot: ${screenshotPath}`);
            } catch (err) {
                console.error(`Error removing screenshot: ${err.message}`);
            }
        }

        console.log(`📄 PDF Report saved successfully: ${pdfPath}`);
    } catch (error) {
        console.error(`❌ Error generating PDF report: ${error.message}`);
    }
}

function wrapText(page, text, x, y, size, font, maxWidth = 400) {
    const words = text.split(' ');
    let line = '';
    let currentY = y;

    for (const word of words) {
        let testLine = line + word + ' ';
        let textWidth = font.widthOfTextAtSize(testLine, size);

        if (textWidth > maxWidth && line !== '') {
            page.drawText(line, { x, y: currentY, size, font });
            currentY -= 15;
            line = word + ' ';
        } else {
            line = testLine;
        }
    }
    page.drawText(line, { x, y: currentY, size, font });
}

export default generatePdfReportOld;

 */
