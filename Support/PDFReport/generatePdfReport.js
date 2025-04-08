import fs from 'fs-extra';
import {promises as fsPromises} from 'fs';
import {PDFDocument} from 'pdf-lib';
import path from 'path';

/**
 * Generates a PDF report with multiple UI screenshots.
 */
async function generatePdfReport(page, processNum, appName, testName, screenshots, generalInfo, originalScriptName, imageScale = 0.32, evidenceFolder = 'test-pdf-report') {
    try {
        console.log('Starting PDF report generation...');

        const processAppName = processNum + ' ' + appName;

        const testNumber = originalScriptName?.slice(0, 2) || '00';
        const documentCode = generalInfo.document || processNum || 'DOC';
        const pdfFileName = `${documentCode}_${testNumber}.pdf`;
        const fullTestLabel = `${testNumber} - ${testName}`;


        const folderPath = path.resolve(evidenceFolder);
        await fs.ensureDir(folderPath);
        const pdfPath = path.join(folderPath, pdfFileName);


        const pdfDoc = await PDFDocument.create();
        const font = await pdfDoc.embedFont('Helvetica');
        const boldFont = await pdfDoc.embedFont('Helvetica-Bold');

        const logoPath = path.join('./Support/PDFReport', 'werfen-logo.png');
        const logoBytes = await fsPromises.readFile(logoPath);
        const logoImage = await pdfDoc.embedPng(logoBytes);

        const firstPage = pdfDoc.addPage([595, 842]);

        firstPage.drawImage(logoImage, {
            x: 20,
            y: 780,
            width: 150,
            height: 30,
        });

        firstPage.drawText('>> Process: ', {x: 50, y: 720, size: 12, font: boldFont});
        firstPage.drawText(processAppName, {x: 150, y: 720, size: 12});

        firstPage.drawText('>> Test:', {x: 50, y: 700, size: 12, font: boldFont});
        firstPage.drawText(fullTestLabel, {x: 150, y: 700, size: 12});

        firstPage.drawText('>> Test Case Description:', {x: 50, y: 680, size: 12, font: boldFont});
        wrapText(firstPage, generalInfo.testCaseDescription, 150, 660, 12, font);

        firstPage.drawText('>> Environment:', {x: 50, y: 580, size: 12, font: boldFont});
        firstPage.drawText(generalInfo.environment, {x: 150, y: 580, size: 12});

        firstPage.drawText('>> Step Status:', {x: 50, y: 560, size: 12, font: boldFont});
        firstPage.drawText(generalInfo.stepStatus, {x: 150, y: 560, size: 12});

        firstPage.drawText('>> Tested By:', {x: 50, y: 540, size: 12, font: boldFont});
        firstPage.drawText(generalInfo.user, {x: 150, y: 540, size: 12});

        firstPage.drawText('>> Tested On:', {x: 50, y: 520, size: 12, font: boldFont});
        firstPage.drawText(`${generalInfo.date} ${generalInfo.time} (CET)`, {x: 150, y: 520, size: 12});

        firstPage.drawText('>> Duration:', {x: 50, y: 500, size: 12, font: boldFont});
        firstPage.drawText(`${generalInfo.duration}`, {x: 150, y: 500, size: 12});

        firstPage.drawText('>> Actual results:', {x: 50, y: 480, size: 12, font: boldFont});
        firstPage.drawText('Expected results have been matched:', {x: 70, y: 460, size: 12});
        wrapText(firstPage, generalInfo.expectedResults, 100, 440, 12, font);


        let index = 1;

        for (const {step, screenshotPath, isResult} of screenshots) {
            const imageBytes = await fsPromises.readFile(screenshotPath);
            const image = await pdfDoc.embedPng(imageBytes);

            const pdfPage = pdfDoc.addPage([595, 842]);

            pdfPage.drawImage(logoImage, {
                x: 20,
                y: 780,
                width: 150,
                height: 30,
            });

            drawActivitySection(pdfPage, index, step, image, font, boldFont, imageScale, isResult);

            pdfPage.drawText(`Page ${index + 1} of ${screenshots.length + 1}`, {
                x: 280,
                y: 20,
                size: 10,
                font: boldFont,
            });

            index++;
        }


        const pdfBytes = await pdfDoc.save();
        await fsPromises.writeFile(pdfPath, pdfBytes);

        for (const {screenshotPath} of screenshots) {
            try {
                await fsPromises.unlink(screenshotPath);
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
            page.drawText(line, {x, y: currentY, size, font});
            currentY -= 15;
            line = word + ' ';
        } else {
            line = testLine;
        }
    }
    page.drawText(line, {x, y: currentY, size, font});
}

function splitTextByLength(text, maxLength = 80) {
    const words = (text || '').split(' ');
    const lines = [];
    let currentLine = '';

    for (const word of words) {
        if ((currentLine + word).length > maxLength) {
            lines.push(currentLine.trim());
            currentLine = word + ' ';
        } else {
            currentLine += word + ' ';
        }
    }
    if (currentLine.trim()) {
        lines.push(currentLine.trim());
    }
    return lines;
}

function drawActivitySection(pdfPage, index, step, image, font, boldFont, imageScale = 0.32, isResult = false) {
    const lineHeight = 16;
    const lines = splitTextByLength(step, 80); // You can adjust max length here

    const labelText = isResult ? 'Result:' : `Activity ${index}:`;
    pdfPage.drawText(labelText, {
        x: 40,
        y: 700,
        size: 14,
        font: boldFont,
    });


    let activityTextY = 700;
    for (const wrappedLine of lines) {
        pdfPage.drawText(wrappedLine, {
            x: 120,
            y: activityTextY,
            size: 14,
            font,
        });
        activityTextY -= lineHeight;
    }

    const extraLines = lines.length;
    let imageY = 325 - (extraLines > 1 ? (extraLines - 1) * 16 : 0);
    if (imageY < 100) imageY = 100;

    const {width, height} = image.scale(imageScale);
    pdfPage.drawImage(image, {
        x: 32.5,
        y: imageY,
        width,
        height,
    });
}

export default generatePdfReport;
