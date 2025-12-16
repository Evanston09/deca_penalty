import { TextResult } from "../ValidatorTypes";
import Tesseract from "tesseract.js";
import { PDFPageProxy } from "pdfjs-dist";
import { TextItem } from "pdfjs-dist/types/src/display/api";
import * as pdfjsLib from "pdfjs-dist";

abstract class BaseTextExtractor {
  protected async convertPageToImage(page: PDFPageProxy, scale: number) {
    const viewport = page.getViewport({ scale: scale });
    const canvas = new OffscreenCanvas(viewport.width, viewport.height);
    const ctx = canvas.getContext("2d")!;
    // CTX similar enough and pdfjs does not use any Canvas specific features not in OffscreenCanvas
    await page.render({
      canvasContext: ctx as unknown as CanvasRenderingContext2D,
      viewport: viewport,
    }).promise;

    return canvas.convertToBlob();
  }

    
    abstract extractText(pages: pdfjsLib.PDFPageProxy[], scale: number): Promise<TextResult[]>;

}
export class PdfJsTextExtractor extends BaseTextExtractor { 
  async extractText(pages: pdfjsLib.PDFPageProxy[], scale: number) {
    // Needed to convert pt to px
    const textResults: TextResult[] = await Promise.all(
      pages.map(async (page) => {
        let pageTexts: string[] = [];
        const textContent = await page.getTextContent();
        // We are sure it is only TextItem bc according to docs
        // TextMarkedContent items are ONLY included when includeMarkedContent is true.
        let items = textContent.items as TextItem[];
        // Make sure not empty or any falsy value
        items = items.filter((textItem) => textItem.str.trim());
        const textObjs = items.map((textItem) => {
          const text = textItem.str.trim();
          pageTexts.push(text);

          // I need to figure out how to convert these bounds to canvas
          // The transform is in spec of W3 2D transformation
          const rawLeftBound= textItem.transform[4];
          const rawBottomBound = textItem.transform[5];

          const rawRightBound = rawLeftBound + textItem.width;
          const rawTopBound = rawBottomBound + textItem.height;
          const viewport = page.getViewport({ scale });
          const  [leftBound, bottomBound, rightBound, topBound]= viewport.convertToViewportRectangle([rawLeftBound, rawBottomBound, rawRightBound, rawTopBound])
          return {
            text,
            bbox: {
              top: topBound,
              bottom: bottomBound,
              left: leftBound,
              right: rightBound,
            },
          };
        });
        let pageText = pageTexts.join(" ");

        let image = await this.convertPageToImage(page, scale);

        return {
          pageText,
          image,
          textObjs,
        };
      }),
    );

    return textResults;
  }
}

export class TesseractTextExtractor extends BaseTextExtractor {
  async extractText(pages: pdfjsLib.PDFPageProxy[], scale: number) {
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

    const images = await Promise.all(pages.map((page) => this.convertPageToImage(page, scale)));

    // Debug: Log image URLs
    console.log('Tesseract page images:', images.map((img, i) => ({
      page: i + 1,
      url: URL.createObjectURL(img)
    })));

    const textPromises = images.map(async (image) => {
      const result = await scheduler.addJob(
        "recognize",
        image,
        {},
        { blocks: true },
      );

      let textObjs = [];

      // Blocks = true so it will never be null 
      for (let block of result.data.blocks!) {
        for (let paragraph of block.paragraphs) {
          for (let line of paragraph.lines) {
            let tesseractBBox = line.bbox;
            textObjs.push({
              text: line.text,
              bbox: {
                left: tesseractBBox.x0,
                top: tesseractBBox.y0,
                right: tesseractBBox.x1,
                bottom: tesseractBBox.y1,
              },
            });
          }
        }
      }

      return {
        pageText: result.data.text,
        image,
        textObjs,
      };
    });

    const textResults = await Promise.all(textPromises);

    await scheduler.terminate();

    return textResults;
  }
}
