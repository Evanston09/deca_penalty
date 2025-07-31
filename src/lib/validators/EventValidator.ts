import { StructureConfig } from "./ValidatorTypes";

const configs = {
  pitch: {
    maxPages: 20,
    dimensions: { height: 1920, width: 1080 },
    pageIndexes: {
      titleIndex: 1,
      tocIndex: 2,
    },
  },
  written: {
    //Counting title and TOC
    maxPages: 22,
    dimensions: { height: 8.5, width: 11, useDpi: true },
    pageIndexes: {
      titleIndex: 0,
      tocIndex: 1,
    },
  },
};

class EventValidator {
    constructor(private config: StructureConfig) {}

    validatePageLimit {

        return pdfParams.pdf.numPages <= pdfParams.pageNumber;
    }


}
