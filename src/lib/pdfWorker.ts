import * as pdfjsLib from "pdfjs-dist";
import Tesseract from "tesseract.js";

pdfjsLib.GlobalWorkerOptions.workerPort = new Worker(new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url), {type: 'module'});

onmessage = async (parameters) => {
    const data = parameters.data
    const results = await checkPDF(data.pdfLink, data.pageNumber, data.useImages)
    postMessage(results);
}

async function checkPDF(
    pdfLink: string,
    pageNumber: number,
    useImages: boolean,
) {
    // Some kinda janky stuff to get page rendering to work 
    const document = {
        fonts: self.fonts,
        createElement: (name: string) => {
            if (name == 'canvas') {
                return new OffscreenCanvas(1, 1);
            }
            return null;
        },
    };

    const pdf = await pdfjsLib.getDocument({ 
        url: new URL(pdfLink),
        useSystemFonts: true, 
        ownerDocument: document,
    }).promise;

    const pages = await getPages(pdf);

    return {
        isPageLimit: checkPageLimit(pdf, pageNumber),
        isRightDimensions: await verifyDimensions(pages),
        isClearNumbering: await checkIfClearNumbering(pages, useImages)
    };
}

function getPages(pdf: pdfjsLib.PDFDocumentProxy) {
    const pagesPromises = [];

    for (let i = 1; i <= pdf.numPages; i++) {
        pagesPromises.push(pdf.getPage(i));
    }

    return Promise.all(pagesPromises);
}

function checkPageLimit(pdf: pdfjsLib.PDFDocumentProxy, pageNumber: number) {
    // the 2 represents the TOC and the title
    return pdf.numPages <= pageNumber + 2;
}

async function verifyDimensions(pages: pdfjsLib.PDFPageProxy[]) {
    return pages.every((page) => {
        const length = ((page.view[2] - page.view[0]) / 72) * page.userUnit;
        const width = ((page.view[3] - page.view[1]) / 72) * page.userUnit;

        // Arbitrary value to round to due to inaccuraccy of PDF
        return +length.toFixed(5) === 8.5 && +width.toFixed(5) === 11;
    });
}

async function checkIfClearNumbering(
    pages: pdfjsLib.PDFPageProxy[],
    analyzeImages: boolean,
) {

    const textValues = await Promise.all(
        pages.map(async (page) => {
            const textValue = await page
                .getTextContent()
                .then((textContent) => textContent.items.map((text) => text.str));

            return textValue;
        }),
    );

    let imageValues = new Array(pages.length).fill("");
    if (analyzeImages) {
        imageValues = await getTextFromImagizedPages(pages);
    }

    const mergedValues = textValues.map((textArr, index) => {
        return [...textArr, imageValues[index]];
    });

    let pageCount = 0;
    mergedValues.forEach((mergedValue) => {
        // Get all numbers on a page into a array
        const numbers = mergedValue.flatMap((value) => {
            const number = value.match(/\d+/g);
            return number ? number.map(Number) : []
        });
        console.log(numbers);

        // Check if pages are ordered correctly
        if (numbers.includes(pageCount + 1)) {
            pageCount++;
        } else {
            pageCount = 1;
        }
    });

    // Again 2 is for TOC and title
    if (pageCount >= pages.length - 2) {
        return true;
    }

    return false;
}

async function convertPageToImage(page: pdfjsLib.PDFPageProxy) {
    const viewport = page.getViewport({scale: 1});
    const canvas = new OffscreenCanvas(viewport.width, viewport.height);
    const ctx = canvas.getContext("2d")!;
    console.log("before render")
    await page.render({canvasContext: ctx, viewport: viewport}).promise;

    return canvas.convertToBlob();
}

async function getTextFromImagizedPages(pages: pdfjsLib.PDFPageProxy[]) {
    const scheduler = Tesseract.createScheduler();

    const workerGen = async () => {
        const worker = await Tesseract.createWorker('eng');
        scheduler.addWorker(worker);
    }

    const workerN = 4;
    const resArr = Array(workerN);
    for (let i=0; i<workerN; i++) {
        resArr[i] = workerGen();
    }
    await Promise.all(resArr);

    const images = await Promise.all(pages.map(convertPageToImage));

    const textPromises = images.map(image => 
        scheduler.addJob('recognize', image).then(result => result.data.text)
    );

    const textResults = await Promise.all(textPromises);
    console.log(textResults[4]);

    await scheduler.terminate()

    return textResults;
}
