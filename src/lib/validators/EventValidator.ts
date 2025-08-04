import { PDFParams, StructureConfig, TextResult } from "./ValidatorTypes";
import * as pdfjsLib from "pdfjs-dist";

export const eventValidatorConfigs = {
  pitch: {
    maxPages: 20,
    dimensions: { length: 1920, width: 1080, useDpi: false },
    pageIndexes: {
      titleIndex: 1,
      tocIndex: 2,
    },
  },
  written: {
    // Counting title and TOC
    maxPages: 22,
    dimensions: { length: 8.5, width: 11, useDpi: true },
    pageIndexes: {
      titleIndex: 0,
      tocIndex: 1,
    },
  },
};

export class EventValidator {
  constructor(private config: StructureConfig) {}

  validatePageLimit(pdfParams: PDFParams) {
    return pdfParams.pdf.numPages <= this.config.maxPages;
  }

  validateDimensions(pdfParams: PDFParams) {
    return pdfParams.pages.every((page) => {
      const dpiFactor = this.config.dimensions.useDpi ? 72 : 1;

      const length =
        ((page.view[2] - page.view[0]) / dpiFactor) * page.userUnit;
      const width = ((page.view[3] - page.view[1]) / dpiFactor) * page.userUnit;

      // Arbitrary value to round off to due to inaccuraccy of PDF
      return (
        +length.toFixed(5) === this.config.dimensions.length &&
        +width.toFixed(5) === this.config.dimensions.width
      );
    });
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

    let otherSectionsResults = [];
    const otherSections = pdfParams.event.sections;
    let section = 0;
    for (let text of pdfParams.textResults.slice(
      this.config.pageIndexes.tocIndex + 1,
    )) {
      const result = this.findTextBlocks(otherSections[section], text);
      if (result.found) {
        section++;
        otherSectionsResults.push(result);
      } else if ((section = otherSections.length - 1)) {
        break;
      }
    }

    const isValid =
      otherSectionsResults.length === otherSections.length &&
      tocResult.found &&
      titleResult.found;

    return {
      isValid,
      title: titleResult,
      toc: tocResult,
      otherSections: otherSectionsResults,
    };
  }

  private findTextBlocks(targetText: string, block: TextResult) {
    const startPosition = block.pageText
      .toLowerCase()
      .indexOf(targetText.toLowerCase());
    if (startPosition === -1) {
      return {
        found: false,
        targetText,
      };
    }

    const endPosition = startPosition + targetText.length;

    let tempPosition = 0;
    let matchingBlocks = [];
    for (let textObject of block.textObjs) {
      if (tempPosition >= startPosition && tempPosition <= endPosition) {
        matchingBlocks.push(textObject);
      }
      // +1 Accounting for the space added in there
      tempPosition += textObject.text.length + 1;
    }

    return {
      found: true,
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
