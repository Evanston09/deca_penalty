import * as pdfjsLib from "pdfjs-dist";

export type PDFParams = {
  pdf: pdfjsLib.PDFDocumentProxy;
  pages: pdfjsLib.PDFPageProxy[];
  analyzeImages: boolean;
  textResults: TextResult[];
  event: DecaEvent;
};

export type UserParams = {
  pdfLink: string;
  pageNumber: number;
  useImage: boolean;
  event: string;
};
export type StructureConfig = {
  maxPages: number;
  dimensions: { width: number; height: number; inches: boolean };
  pageIndexes: {
    titleIndex: number;
    tocIndex: number;
  };
};

export type TextBBox = {
  top: number;
  bottom: number;
  left: number;
  right: number;
};
export type TextObject = {
  text: string;
  bbox: TextBBox;
};
export type TextResult = {
  pageText: string;
  image: Blob
  textObjs: TextObject[];
};
export type TextBlockSearchResult =
  | { found: false; targetText: string }
  | { found: true; targetText: string; matchingBlocks: TextObject[], image: Blob };

export interface TextExtractor {
  extractText(pages: pdfjsLib.PDFPageProxy[], scale: number): Promise<TextResult[]>;
}

export enum EventFormat {
  Written = "Written",
  Pitch = "Pitch",
}
export type DecaEvent = {
  name: string;
  sections: string[][];
  category: string;
  type: EventFormat;
};

export type Result = {
  isPageLimit: {
    isValid: boolean;
    expectedPages: number;
    actualPages: number;
  };
  isRightDimensions: {
    isValid: boolean;
    invalidPages: {
      pageNumber: number;
      height: number;
      width: number;
      isValid: boolean;
    }[];
    inches: boolean;
    expectedHeight: number;
    expectedWidth: number;
  };
  isProperStructure: {
    isValid: boolean;
    requiredSections: string[];
    title: TextBlockSearchResult;
    toc: TextBlockSearchResult;
    validSections: TextBlockSearchResult[];
  };
  isClearNumbering: boolean;
  score: number;
};
