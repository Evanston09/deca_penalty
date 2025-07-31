import {
  ValidationRule,
  PDFParams,
  TextResult,
  TextBlockSearchResult,
  StructureValidationRule,
} from "./ValidatorTypes";

export class PitchLengthValidator implements ValidationRule {
  name = "Checking Page Count...";
  async validate(pdfParams: PDFParams) {
    return pdfParams.pdf.numPages <= pdfParams.pageNumber;
  }
}

export class PitchDimenstionValidator implements ValidationRule {
  name = "Checking Dimensions...";
  async validate(pdfParams: PDFParams) {
    const NECESSARY_HEIGHT = 1920;
    const NECESSARY_WIDTH = 1080;
    return pdfParams.pages.every((page) => {
      const length = page.view[2] - page.view[0];
      const width = page.view[3] - page.view[1];
      console.log(length);
      console.log(width);

      // Arbitrary value to round off to due to inaccuraccy of PDF
      return (
        +length.toFixed(5) === NECESSARY_HEIGHT &&
        +width.toFixed(5) === NECESSARY_WIDTH
      );
    });
  }
}

export class PitchStructureValidator implements StructureValidationRule {
  name = "Analyzing Structure...";
  async validate(pdfParams: PDFParams) {
    // add some protecction from too little pages
    // Check if name is there
    const titleResult = this.findTextBlocks(
      pdfParams.event.name,
      pdfParams.textResults[1],
    );

    const tocResult = this.findTextBlocks(
      "Table of Contents",
      pdfParams.textResults[2],
    );

    let otherSectionsResults = [];
    const otherSections = pdfParams.event.sections;
    let section = 0;
    for (let text of pdfParams.textResults.slice(3)) {
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
