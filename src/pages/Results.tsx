import { Link, useLocation } from "react-router";
import { checkPDF } from "../lib/pdfChecker.ts";
import { useState, useEffect, useMemo } from "react";
import {PagePreview} from "@/components/PagePreview";
import Confetti from "react-confetti";
import Error from "./Error.tsx";
import { MoveLeft } from "lucide-react";
import GagueChart from "../components/GaugeChart.tsx";
import ResultSummary from "../components/ResultSummary.tsx";
import {Result} from"../lib/ValidatorTypes.ts";

function Results() {
  const location = useLocation();
  const [windowSize, setWindowSize] = useState({
    height: document.body.scrollHeight,
    width: document.body.clientWidth,
  });

  const state = location.state;

  const [results, setResults] = useState<Result | null>(null);
  const [progress, setProgress] = useState<{
    status: string;
    progress: number;
  }>({ status: "Initializing", progress: 0 });

  const pdfLink = useMemo(() => {
    if (state) {
      return URL.createObjectURL(state.pdf);
    }
  }, [state]);

  useEffect(() => {
    if (pdfLink && state) {
      const fetchResults = async () => {
        setResults(
          await checkPDF({
            pdfLink,
            pageNumber: state.pageNumber,
            useImage: state.useImages,
            event: state.event
        }),
        );
      };
      fetchResults();
    }
  }, []); 
  console.log(results)
  
  useEffect(() => {
    function handleResize() {
      setWindowSize({
        height: document.body.scrollHeight,
        width: document.body.clientWidth,
      });
    }

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  if (!state || !pdfLink) {
    return <Error message="No PDF File!" />;
  }

  return (
    <>
      <div className='flex flex-row gap-2 items-center mr-auto hover:underline mb-4'>
        <MoveLeft />
        <Link to="/">Go Home</Link>
      </div>
      
      {results &&
        Object.values(results).every((item) => item === true) &&
        state.isIntegrityDone && (
          <Confetti
            className="w-full overflow-hidden"
            width={windowSize.width}
            height={windowSize.height}
            // DECA Colors :)
            colors={["#0072ce", "#85754e", "#8c9091"]}
          />
        )}

      <h1 className="text-2xl md:text-5xl font-semibold">
        Prepared Event Penalty Checker
      </h1>
            <GagueChart percentage={results?.score}/>
            <div className="w-full max-w-4xl p-6 rounded-xl border space-y-2">
                <h2 className="text-xl font-semibold mb-4">Submission Checklist</h2>
                <ResultSummary isDone={results?.isPageLimit.isValid} text={"Within max number of pages"}>
                    {results && (
                        <div className="space-y-3">
                            <h3 className="font-semibold text-gray-200 text-base">
                                This event accepts a max of {results.isPageLimit.expectedPages} pages
                            </h3>
                            <p>
                                Your submission contains {results.isPageLimit.actualPages} pages
                            </p>
                        </div>
                    )}

                </ResultSummary>
                <ResultSummary
                    isDone={results?.isRightDimensions.isValid}
                    text="Prepared event fits in the required dimensions"
                >
                    {results && (
                        <div className="space-y-3">
                            <h3 className="font-semibold text-gray-200 text-base">
                                This event requires a size of{" "}
                                {results.isRightDimensions.expectedWidth} × {results.isRightDimensions.expectedHeight}
                                {" "}{results.isRightDimensions.inches ? "inches" : "pixels"}
                            </h3>

                            <div className="space-y-1">
                                {results.isRightDimensions.isValid ? (
                                    <p>
                                        All of your pages are {results.isRightDimensions.expectedWidth} ×{" "}
                                        {results.isRightDimensions.expectedHeight}!
                                    </p>
                                ) : (
                                        results.isRightDimensions.invalidPages
                                        .map((page) => (
                                            <p key={page.pageNumber} className="text-red-400">
                                                Page {page.pageNumber} has a size of {page.width} × {page.height}
                                            </p>
                                        ))
                                    )}


                            </div>
                        </div>
                    )}
                </ResultSummary>
                <ResultSummary
                    isDone={results?.isProperStructure.isValid}
                    text="Prepared event follows the required structure"
                >
                    {results && (
                        <div className="space-y-3">
                            <div>
                            <h3 className="font-semibold text-gray-200 text-base">
                                This event requires the following sections:
                            </h3>
                            <ul className="list-disc">
                                {results.isProperStructure.title.found 
                                    ? <li><div className="flex items-center gap-1">Title <PagePreview matchingBlocks={results.isProperStructure.title.matchingBlocks} pageImage={results.isProperStructure.title.image} /></div></li>
                                    : <li className="text-gray-400">Title</li>
                                }

                                {results.isProperStructure.toc.found 
                                    ? <li><div className="flex items-center gap-1">Table of Contents <PagePreview matchingBlocks={results.isProperStructure.toc.matchingBlocks} pageImage={results.isProperStructure.toc.image} /></div></li>
                                    : <li className="text-gray-400">Table of Contents</li>
                                }
                                
                                {results.isProperStructure.requiredSections.map((section) => {
                                    return <li className="text-gray-400">{section}</li>
                                })}
                            </ul>

                            </div>
                        </div>
                    )}
                </ResultSummary>

            </div>
        </>
    );
}

export default Results;
