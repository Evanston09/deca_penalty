import * as pdfjsLib from "pdfjs-dist";
import { TextItem } from "pdfjs-dist/types/src/display/api";
import Tesseract from "tesseract.js";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url,
).toString();

export async function checkPDF(
  pdfLink: string,
  pageNumber: number,
  useImages: boolean,
) {
  const pdf = await pdfjsLib.getDocument({
    url: pdfLink,
  }).promise;

  const pages = await getPages(pdf);

  return {
    isPageLimit: checkPageLimit(pdf, pageNumber),
    isRightDimensions: await verifyDimensions(pages),
    isClearNumbering: await checkIfClearNumbering(pages, useImages),
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
      // We are sure it is only TextItem bc according to docs
      // TextMarkedContent items are included when includeMarkedContent is true.
      const textValue = await page
        .getTextContent()
        .then((textContent) =>
          textContent.items.map((text) => (text as TextItem).str),
        );

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
      return number ? number.map(Number) : [];
    });

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
  const viewport = page.getViewport({ scale: 1 });
  const canvas = new OffscreenCanvas(viewport.width, viewport.height);
  const ctx = canvas.getContext("2d")!;
  // CTX similar enough and pdfjs does not use any Canvas specific features not in OffscreenCanvas
  await page.render({
    canvasContext: ctx as unknown as CanvasRenderingContext2D,
    viewport: viewport,
  }).promise;

  return canvas.convertToBlob();
}

async function getTextFromImagizedPages(pages: pdfjsLib.PDFPageProxy[]) {
  const scheduler = Tesseract.createScheduler();
  
  const workerGen = async () => {
    const worker = await Tesseract.createWorker("eng");
    scheduler.addWorker(worker);
  };

  const workerN = 4;
  const resArr = Array(workerN);
  for (let i = 0; i < workerN; i++) {
    resArr[i] = workerGen();
  }
  await Promise.all(resArr);

  const images = await Promise.all(pages.map(convertPageToImage));
  
  const textPromises = images.map((image) =>
    scheduler.addJob("recognize", image).then((result) => result.data.text),
  );

  const textResults = await Promise.all(textPromises);

  await scheduler.terminate();

  return textResults;
}
