import * as pdfjsLib from "pdfjs-dist";
import {
  EventValidator,
  eventValidatorConfigs,
} from "./validators/EventValidator";
import {
  PdfJsTextExtractor,
} from "./validators/textExtrators";
import { EventFormat, UserParams } from "./ValidatorTypes";
import { DECA_EVENTS_OBJECT } from "./decaEvents";

export async function checkPDF(userParams: UserParams) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url,
  ).toString();

  let eventValidator;

  const pdf = await pdfjsLib.getDocument({
    url: new URL(userParams.pdfLink),
  }).promise;

  const event = DECA_EVENTS_OBJECT[userParams.event];

  const pages = await EventValidator.getPages(pdf);

  const textExtractor = new PdfJsTextExtractor();
  const textResults = await textExtractor.extractText(pages, .5);


switch (event.type) {
    case EventFormat.Pitch:
      eventValidator = new EventValidator(eventValidatorConfigs.pitch);
      break;
    case EventFormat.Written:
      eventValidator = new EventValidator(eventValidatorConfigs.written);
      break;
  }

  const pdfParams = {
    pdf,
    pages,
    textResults,
    event
  };

  const pageLimitResult = eventValidator.validatePageLimit(pdfParams);
  const dimensionResult = eventValidator.validateDimensions(pdfParams);
  const structureResult = eventValidator.validateStructure(pdfParams);
  const clearNumResult = eventValidator.validateClearNumbering(pdfParams);

  let score = 100;

  // Integrity not filled: -15 points
  if (!userParams.isIntegrityFilled) {
    score -= 15;
  }

  // Page over limit: -5 points per extra page
  if (!pageLimitResult.isValid) {
    const extraPages = Math.max(0, pageLimitResult.actualPages - pageLimitResult.expectedPages);
    score -= extraPages * 5;
  }

  if (!dimensionResult.isValid) {
    score -= 5;
  }
  if (!structureResult.isValid) {
    score -= 5;
  }
  if (!clearNumResult.isValid) {
    score -= 5;
  }

  score = Math.max(0, score);

  return {
    isIntegrityFilled: userParams.isIntegrityFilled,
    isPageLimit: pageLimitResult,
    isRightDimensions: dimensionResult,
    isProperStructure: structureResult,
    isClearNumbering: clearNumResult,
    score: score
  };
}
