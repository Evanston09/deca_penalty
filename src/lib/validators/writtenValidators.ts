import { ValidationRule, PDFParams, StructureValidationRule} from "./ValidatorTypes";

export class WrittenLengthValidator implements ValidationRule {
  name = "Checking Page Count...";
  async validate(pdfParams: PDFParams) {
    // the 2 represents the TOC and the title
    return pdfParams.pdf.numPages <= pdfParams.pageNumber + 2;
  }
}

export class WrittenDemensionValidator implements ValidationRule {
  name = "Checking Dimensions...";
  async validate(pdfParams: PDFParams) {
    const DPI = 72;
    const NECESSARY_HEIGHT = 8.5;
    const NECESSARY_WIDTH = 11;
    return pdfParams.pages.every((page) => {
      const length = ((page.view[2] - page.view[0]) / DPI) * page.userUnit;
      const width = ((page.view[3] - page.view[1]) / DPI) * page.userUnit;

      // Arbitrary value to round off to due to inaccuraccy of PDF
      return (
        +length.toFixed(5) === NECESSARY_HEIGHT &&
        +width.toFixed(5) === NECESSARY_WIDTH
      );
    });
  }
}

// Add funcctionality to figure out where the numbering is getting messed up
export class WrittenPageNumberingValidator implements ValidationRule {
  name = "Checking numbering";
  async validate(pdfParams: PDFParams) {
    let pageCount = 0;
    // Slice avoids first 2 pages being counted(Title and TOC)
    pdfParams.textResults.slice(2).forEach((textResult) => {
      const numbersRegex = textResult.pageText.match(/\d+/g);
      const numbers = numbersRegex ? numbersRegex.map(Number) : [];

      if (numbers.includes(pageCount + 1)) {
        pageCount++;
      } else {
        pageCount = 1;
      }

      // Again 2 is for TOC and title
    });
    if (pageCount >= pdfParams.pages.length - 2) {
      return true;
    }
    return false;
  }
}

export class WrittenStrcutureValidator implements StructureValidationRule {
  name = "Analyzing Structure...";
  async validate(pdfParams: PDFParams) {
    // add some protecction from too little pages
    // Check if name is there
    const titleResult = this.findTextBlocks(
      pdfParams.event.name,
      pdfParams.textResults[0],
    );

    const tocResult = this.findTextBlocks(
      "Table of Contents",
      pdfParams.textResults[1],
    );

    let otherSectionsResults = [];
    const otherSections = pdfParams.event.sections;
    let section = 0;
    for (let text of pdfParams.textResults.slice(2)) {
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
}
