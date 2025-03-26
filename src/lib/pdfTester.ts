import * as pdfjsLib from "pdfjs-dist";
import Tesseract, { createWorker, setLogging } from "tesseract.js";

// From react-pdf docs
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url,
).toString();

export default async function checkPDF(
    pdfLink: string,
    pageNumber: number,
    useImages: boolean,
) {

    const pdf = await pdfjsLib.getDocument(pdfLink).promise;
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


    let imageValues: string[][];
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

async function getTextFromImagesOnPages(pages: pdfjsLib.PDFPageProxy[]): Promise<string[][]> {
    const scheduler = Tesseract.createScheduler();
    
    await Promise.all(
        Array.from({ length: 4 }, async () => {
            const worker = await Tesseract.createWorker('eng');
            return scheduler.addWorker(worker);
        })
    );
    const textValues: string[][] = [];

    for (const page of pages) {
        const textPromises = [];
        const ops = await page.getOperatorList();

        for (let i = 0; i < ops.fnArray.length; i++) {
            if (ops.fnArray[i] === pdfjsLib.OPS.paintImageXObject) {
                const op = ops.argsArray[i][0];

                // This took a week to find...
                if (!page.objs.has(op)) continue;

                const image = await new Promise((resolve) =>  {
                    page.objs.get(op, resolve)
                })
                const canvas = new OffscreenCanvas(image.width, image.height);
                const ctx: ImageBitmapRenderingContext = canvas.getContext("bitmaprenderer")!;
                const bitmap = await createImageBitmap(image.bitmap);
                ctx.transferFromImageBitmap(bitmap);
                bitmap.close()

                const blob = await canvas.convertToBlob();
                if (page.pageNumber === 4) {
                    console.log(URL.createObjectURL(blob));
                }


                textPromises.push(scheduler.addJob('recognize', blob).then((result) => result.data.text));
            }

        }
        textValues.push(await Promise.all(textPromises));
    }
    await scheduler.terminate();
    return textValues;
}

