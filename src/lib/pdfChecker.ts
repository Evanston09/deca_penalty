import * as pdfjsLib from "pdfjs-dist";
import {
  EventValidator,
  eventValidatorConfigs,
} from "./validators/EventValidator";
import {
  PdfJsTextExtractor,
  TesseractTextExtractor,
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
    analyzeImages: userParams.useImage,
    textResults,
    event
  };

  const pageLimitResult = eventValidator.validatePageLimit(pdfParams);
  const dimenstionResult = eventValidator.validateDimensions(pdfParams);
  const structureResult = eventValidator.validateStructure(pdfParams);
 
  const score = 100 - (pageLimitResult.isValid ? 0 : 5)

  return {
    isPageLimit: pageLimitResult,
    isRightDimensions: dimenstionResult,
    isProperStructure: structureResult,
    isClearNumbering: true,
    score: 100
  };
}
