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
  eventType: EventFormat;
};
export type StructureConfig = {
  maxPages: number;
  dimensions: { length: number; width: number; useDpi: boolean };
  pageIndexes: {
    titleIndex: number;
    tocIndex: number;
  };
};

export type StructureValidationResult = {
  isValid: boolean;
  title: TextBlockSearchResult;
  toc: TextBlockSearchResult;
  otherSections: TextBlockSearchResult[];
};
export interface StructureValidationRule {
  name: string;
  validate(pdfParams: PDFParams): Promise<StructureValidationResult>;
}

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
  textObjs: TextObject[];
};
export type TextBlockSearchResult =
  | { found: false; targetText: string }
  | { found: true; targetText: string; matchingBlocks: TextObject[] };

export interface TextExtractor {
  extractText(pages: pdfjsLib.PDFPageProxy[]): Promise<TextResult[]>;
}

export enum EventFormat {
  Written = "Written",
  Pitch = "Pitch",
}
export type DecaEvent = {
  name: string;
  sections: string[];
  type: EventFormat;
};
