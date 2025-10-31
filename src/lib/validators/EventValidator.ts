import {
  PDFParams,
  StructureConfig,
  TextBlockSearchResult,
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
  },
  written: {
    // Counting title and TOC
    maxPages: 22,
    dimensions: { width: 8.5, height: 11, inches: true },
    pageIndexes: {
      titleIndex: 0,
      tocIndex: 1,
    },
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

    let validSections = [];
    let sectionPool = pdfParams.event.sections;

    for (let text of pdfParams.textResults.slice(
      this.config.pageIndexes.tocIndex + 1,
    )) {
      let foundSections = [];
      for (const section of sectionPool) {
        for (const possibility of section) {
          const result = this.findTextBlocks(possibility, text);

          if (result.found) {
            validSections.push(result);
            foundSections.push(section);
            break;
          }
        }
      }
      // When section is found remove it from the pool
      sectionPool = sectionPool.filter(
        (section) => !foundSections.includes(section),
      );
    }

    const isValid =
      validSections.length === pdfParams.event.sections.length &&
      tocResult.found &&
      titleResult.found;
    const requiredSections = pdfParams.event.sections.map((section) =>
      section.length > 1 ? section.join("/") : section[0],
    );

    return {
      isValid,
      requiredSections,
      title: titleResult,
      toc: tocResult,
      validSections,
    };
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
        targetText,
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
      targetText,
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
