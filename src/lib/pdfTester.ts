import * as pdfjsLib from "pdfjs-dist";
import Tesseract, { setLogging } from "tesseract.js";

// Just some dumb pdfjs stuff but lowkey should not matter since already running as worker
// https://github.com/mozilla/pdf.js/discussions/17276
// pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
//   'pdfjs-dist/build/pdf.worker.min.mjs',
//   import.meta.url,
// ).toString();

pdfjsLib.GlobalWorkerOptions.workerPort = new Worker(new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url), {type: 'module'});


onmessage = async (parameters) => {
    const results = await checkPDF(parameters.data.pdfLink, parameters.data.pageNumber, parameters.data.useImages)
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
    await getTextFromImagesOnPages(pages);
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


    let imageValues = new Array(pages.length).fill([]);
    if (analyzeImages) {
        imageValues = await getTextFromImagesOnPages(pages);
    }



    const mergedValues = textValues.map((textArr, index) => {
        return [...textArr, ...imageValues[index]];
    });
    console.log(mergedValues);

    let pageCount = 0;
    mergedValues.forEach((mergedValue) => {
        // Get all numbers on a page into a array
        const numbers = mergedValue.flatMap((value) =>
            Number(value) ? Number(value) : [],
        );
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
    await page.render({canvasContext: ctx, viewport: viewport}).promise;

    return canvas.convertToBlob();
}

async function getTextFromImagesOnPages(pages: pdfjsLib.PDFPageProxy[]) {
    const scheduler = Tesseract.createScheduler();
    setLogging(true);

    // Look into docs here
    const workers = await Promise.all(
        [...Array(4)].map(async () => {
            const worker = await Tesseract.createWorker('eng');
            scheduler.addWorker(worker);
        })
    );

    const images = await Promise.all(pages.map(convertPageToImage));

    const textPromises = images.map(image => 
        scheduler.addJob('recognize', image).then(result => result.data.text)
    );

    const textResults = await Promise.all(textPromises);

    scheduler.terminate()

    return textResults;
}

// async function getTextFromImagesOnPages(pages: pdfjsLib.PDFPageProxy[]): Promise<string[][]> {
//     const scheduler = Tesseract.createScheduler();
//     setLogging(true);
//
//     await Promise.all(
//         Array.from({ length: 4 }, async () => {
//             const worker = await Tesseract.createWorker('eng');
//             return scheduler.addWorker(worker);
//         })
//     );
//     const textValues: string[][] = [];
//
//     for (const page of pages) {
//         const textPromises = [];
//         const ops = await page.getOperatorList();
//
//         for (let i = 0; i < ops.fnArray.length; i++) {
//             if (ops.fnArray[i] === pdfjsLib.OPS.paintImageXObject) {
//                 const op = ops.argsArray[i][0];
//
//                 // This took a week to find...
//                 if (!page.objs.has(op)) continue;
//
//                 const image = await new Promise((resolve) =>  {
//                     page.objs.get(op, resolve)
//                 })
//                 const canvas = new OffscreenCanvas(image.width, image.height);
//                 const ctx: ImageBitmapRenderingContext = canvas.getContext("bitmaprenderer")!;
//                 const bitmap = await createImageBitmap(image.bitmap);
//                 ctx.transferFromImageBitmap(bitmap);
//                 bitmap.close()
//
//                 const blob = await canvas.convertToBlob();
//
//                 textPromises.push(scheduler.addJob('recognize', blob).then((result) => result.data.text));
//             }
//
//         }
//         textValues.push(await Promise.all(textPromises));
//     }
//     await scheduler.terminate();
//     return textValues;
// }
//
