import * as pdfjsLib from "pdfjs-dist";
import {
  EventValidator,
  eventValidatorConfigs,
} from "./validators/EventValidator";
import {
  PdfJsTextExtractor,
  TesseractTextExtractor,
} from "./validators/textExtrators";
import { EventFormat, UserParams } from "./validators/ValidatorTypes";
import { DECA_EVENTS, DECA_EVENTS_OBJECT } from "./decaEvents";

export async function checkPDF(userParams: UserParams) {
    pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
        "pdfjs-dist/build/pdf.worker.min.mjs",
        import.meta.url,
    ).toString();

    let eventValidator;

    const pdf = await pdfjsLib.getDocument({
        url: new URL(userParams.pdfLink),
    }).promise;

    const pages = await EventValidator.getPages(pdf);

    const textExtractor = new TesseractTextExtractor();
    const textResults = await textExtractor.extractText(pages);
    console.log(textResults);

    switch (userParams.eventType) {
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
        event: DECA_EVENTS_OBJECT.SMG,
    };

    console.log(eventValidator.validateDimensions(pdfParams));
    return {
        isPageLimit: true,
        isRightDimensions: true,
        isClearNumbering:true
    }
}
