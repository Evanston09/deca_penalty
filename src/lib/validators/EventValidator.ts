import {
    EventFormat,
  PDFParams,
  StructureConfig,
  TextBlockSearchResult,
  TextObject,
  TextResult,
} from "../ValidatorTypes";
import * as pdfjsLib from "pdfjs-dist";

export const eventValidatorConfigs = {
  pitch: {
    maxPages: 20,
    dimensions: { width: 1920, height: 1080, inches: false },
    pageIndexes: {
      titleIndex: 1,
      tocIndex: 2,
    },
    eventType: EventFormat.Pitch
  },
  written: {
    // Counting title and TOC
    maxPages: 22,
    dimensions: { width: 8.5, height: 11, inches: true },
    pageIndexes: {
      titleIndex: 0,
      tocIndex: 1,
    },
    eventType: EventFormat.Written
  },
};

export class EventValidator {
  constructor(private config: StructureConfig) {}

  validatePageLimit(pdfParams: PDFParams) {
    const isValid = pdfParams.pdf.numPages <= this.config.maxPages;

    return {
      isValid,
      expectedPages: this.config.maxPages,
      actualPages: pdfParams.pdf.numPages,
    };
  }

  validateDimensions(pdfParams: PDFParams) {
    const scaleFactor = this.config.dimensions.inches ? 1 / 72 : 96 / 72;
    const expectedWidth = this.config.dimensions.width;
    const expectedHeight = this.config.dimensions.height;

    const invalidPages = pdfParams.pages
      .map((page, index) => {
        const [x0, y0, x1, y1] = page.view;
        const viewWidth = (x1 - x0) * page.userUnit;
        const viewHeight = (y1 - y0) * page.userUnit;

        const rawWidth = viewWidth * scaleFactor;
        const rawHeight = viewHeight * scaleFactor;

        const width = Math.round(rawWidth * 10) / 10;
        const height = Math.round(rawHeight * 10) / 10;

        //Calculation flawed need this to round to the first decimal
        const isValid = width === expectedWidth && height === expectedHeight;

        return {
          isValid,
          pageNumber: index + 1,
          width,
          height,
        };
      })
      .filter((pageResult) => !pageResult.isValid);

    return {
      isValid: invalidPages.length === 0,
      invalidPages,
      expectedHeight,
      expectedWidth,
      inches: this.config.dimensions.inches,
    };
  }

  validateStructure(pdfParams: PDFParams) {
    // add some protecction from too little pages
    // Check if name is there
    const titleResult = this.findTextBlocks(
      pdfParams.event.name,
      pdfParams.textResults[this.config.pageIndexes.titleIndex],
    );

    const tocResult = this.findTextBlocks(
      "Table of Contents",
      pdfParams.textResults[this.config.pageIndexes.tocIndex],
    );

    let foundSections = new Map<string, TextBlockSearchResult>();

    for (let text of pdfParams.textResults.slice(
      this.config.pageIndexes.tocIndex + 1,
    )) {
      for (const section of pdfParams.event.sections) {
        const sectionName = section.length > 1 ? section.join("/") : section[0];

        // Skip if already found
        if (foundSections.has(sectionName)) continue;

        for (const possibility of section) {
          const result = this.findTextBlocks(possibility, text);

          if (result.found) {
            foundSections.set(sectionName, result);
            break;
          }
        }
      }
    }

    // Create sections array with all required sections
    const sections: TextBlockSearchResult[] = pdfParams.event.sections.map((section) => {
      const sectionName = section.length > 1 ? section.join("/") : section[0];
      const foundResult = foundSections.get(sectionName);

      if (foundResult && foundResult.found) {
        return foundResult;
      } else {
        return {
          found: false,
          name: sectionName,
        };
      }
    });

    const isValid =
      foundSections.size === pdfParams.event.sections.length &&
      tocResult.found &&
      titleResult.found;

    return {
      isValid,
      title: titleResult,
      toc: tocResult,
      sections,
    };
  }

  validateClearNumbering(pdfParams: PDFParams) {
        let results: TextBlockSearchResult[] = []
        // If written event start numbering from after TOC; if pitch start numbering from the beginning
        const startPageIndex = this.config.eventType === EventFormat.Written
            ? this.config.pageIndexes.tocIndex + 1
            : 0;

        for (let i = 0; i < (pdfParams.pages.length - startPageIndex); i++) {
            const pageIndex = startPageIndex + i;
            const text = pdfParams.textResults[pageIndex];
            const page = pdfParams.pages[pageIndex];
            const expectedPageNum = i + 1;

            // Get accurate height/width dimensions for the bbox within textResults
            const viewport = page.getViewport({ scale: 0.5 });
            const pageWidth = viewport.width;
            const pageHeight = viewport.height;

            const inEdge = text.textObjs.filter((textObj) => this.isTxtObjInEdge(pageWidth, pageHeight, textObj))

            let found = false;
            for (let textObj of inEdge) {
                let matches = textObj.text.match(/\d+/g)
                if (!matches)
                    continue;
                let nums = matches.map((match) => Number(match));
                if (nums.includes(expectedPageNum)) {
                    results.push({
                        found: true,
                        name: String(expectedPageNum),
                        matchingBlocks: [textObj],
                        image: text.image
                    })
                    found = true;
                    break;
                }
            }

            if (!found) {
                results.push({
                    found: false,
                    name: String(expectedPageNum),
                })
            }
        }

        const isValid = results.every((result) => result.found);

        return {
            isValid, 
            pages: results
        };
    }

    private isTxtObjInEdge(width: number, height: number, textObj: TextObject, cutoff = 0.1) {
        const x = textObj.bbox.left;
        const y = textObj.bbox.bottom;

        const isLeft = x < cutoff * width;
        const isRight = x > (1 - cutoff) * width;
        const isTop = y < cutoff * height;
        const isBottom = y > (1 - cutoff) * height;

        return isLeft || isRight || isTop || isBottom;
    }

  private findTextBlocks(
    targetText: string,
    block: TextResult,
  ): TextBlockSearchResult {
    const startPosition = block.pageText
      .toLowerCase()
      .indexOf(targetText.toLowerCase());
    if (startPosition === -1) {
      return {
        found: false,
        name: targetText,
      };
    }
//2161
    const endPosition = startPosition + targetText.length - 1;
    let tempStartPosition = 0;
    let matchingBlocks = [];
    for (let textObject of block.textObjs) {
      let tempEndPosition = tempStartPosition + textObject.text.length - 1;
      if (
        (tempStartPosition <= startPosition &&
          startPosition <= tempEndPosition) ||
        (tempStartPosition <= endPosition && endPosition <= tempEndPosition)
      ) {
        matchingBlocks.push(textObject);
      }
      tempStartPosition = tempEndPosition + 2;
    }

    return {
      found: true,
      image: block.image,
      name: targetText,
      matchingBlocks,
    };
  }

  static getPages(pdf: pdfjsLib.PDFDocumentProxy) {
    const pagesPromises = [];

    for (let i = 1; i <= pdf.numPages; i++) {
      pagesPromises.push(pdf.getPage(i));
    }

    return Promise.all(pagesPromises);
  }
}
