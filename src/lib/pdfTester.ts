import * as pdfjsLib from "pdfjs-dist";
import Tesseract, { createWorker, PSM } from 'tesseract.js';

// From react-pdf docs
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  'pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url
).toString()

export async function checkPDF(pdfLink: string, pageNumber: number, useImages: boolean) {
    const pdf = await pdfjsLib.getDocument(pdfLink).promise; 
    const pages = await getPages(pdf);
    return {
        isPageLimit: checkPageLimit(pdf, pageNumber),
        isRightDimensions: await verifyDimensions(pages),
        isClearNumbering: await checkIfClearNumbering(pages, useImages)
    }
}

function getPages(pdf: pdfjsLib.PDFDocumentProxy) {
    const pagesPromises = []

    for (let i=1; i<=pdf.numPages; i++) {
        pagesPromises.push(pdf.getPage(i));
    }

    return Promise.all(pagesPromises)
}

function checkPageLimit(pdf: pdfjsLib.PDFDocumentProxy, pageNumber: number) {
    // the 2 represents the TOC and the title
    return pdf.numPages <= pageNumber + 2;
}

async function verifyDimensions(pages: pdfjsLib.PDFPageProxy[]) {
    return pages.every(page => {
        const length = ((page.view[2] - page.view[0]) / 72) * page.userUnit;
        const width = ((page.view[3] - page.view[1]) / 72) * page.userUnit;

        // Arbitrary value to round to due to inaccuraccy of PDF
        return +length.toFixed(5) === 8.5 && +width.toFixed(5) === 11; });
}

async function checkIfClearNumbering(pages: pdfjsLib.PDFPageProxy[], analyzeImages: boolean) {
    let worker: Tesseract.Worker;
    if (analyzeImages) {
        worker = await createWorker('eng');
        worker.setParameters(
            // Assuming most numbers will just be in a single line
            { tessedit_pageseg_mode: PSM.SINGLE_LINE }
        )
    }

    const textValues = await Promise.all(
        pages.map(async (page) => {
            const textValue = await page.getTextContent().then((textContent) => textContent.items.map((text) => text.str));

            let imageValue = [];
            // Definetly need better loading thing
            if (analyzeImages) {
                console.log("here");
                imageValue = await getTextFromImagesOnPages(page, worker);
                console.log("here 2");
            }
            return [...textValue, ...imageValue];
        })
    );

    if (worker) {
        await worker.terminate();
    }

    console.log(textValues)

    let pageCount = 0;
    textValues.forEach((textValue) => {
        // Get all numbers on a page into a array
        const numbers = textValue.flatMap((text) => Number(text) ? Number(text) : []);
        console.log(numbers);

        // Check if pages are ordered correctly
        if (numbers.includes(pageCount + 1)) {
            pageCount++;
        }
        else {
            pageCount = 1;
        }
    })
    
    // Again 2 is for TOC and title
    if (pageCount >= pages.length - 2) {
        return true;
    }

    return false;
}

async function getTextFromImagesOnPages(page: pdfjsLib.PDFPageProxy, worker: Tesseract.Worker) {
    const imagePromises = [];
        const ops = await page.getOperatorList();

        // This is interesting...(it sucks)
       for (let i=0; i < ops.fnArray.length; i++) {
            if (ops.fnArray[i] == pdfjsLib.OPS.paintImageXObject) {
                const op = ops.argsArray[i][0];

                imagePromises.push(
                    new Promise((resolve)=> {
                        page.objs.get(op, (image) =>{
                            const canvas = new OffscreenCanvas(image.width, image.height)
                            const ctx: ImageBitmapRenderingContext = canvas.getContext('bitmaprenderer')!;
                            ctx.transferFromImageBitmap(image.bitmap);
                            resolve(canvas.convertToBlob());
                        });

                    })
                );
            }
        }

    const images = await Promise.all(imagePromises);

    const ocrResultsPromises = images.map((image) => {
        return new Promise((resolve) => {
            worker.recognize(image).then((ocrResult) => {
                resolve(ocrResult.data.text);
            });
        });
    });
    const ocrResults = await Promise.all(ocrResultsPromises);

    return ocrResults;
}
