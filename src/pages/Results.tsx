import { Link, useLocation } from "react-router";
import { checkPDF } from "../lib/pdfChecker";
import { useState, useEffect, useMemo } from "react";
import StatusIndicator from "../components/StatusIndicator";
import Confetti from "react-confetti";
import Error from "./Error.tsx";
import { MoveLeft } from "lucide-react";

function Results() {
  type Result = {
    isPageLimit: boolean;
    isRightDimensions: boolean;
    isClearNumbering: boolean;
  };

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
          await checkPDF(
            pdfLink,
            state.pageNumber,
            state.useImages,
            (status, progress) => setProgress({ status, progress }),
          ),
        );
      };
      fetchResults();
    }
  }, [pdfLink, state]);

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
  }, [results]);

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

      <h1 className="text-2xl md:text-5xl font-semibold mb-4">
        Written Event Penalty Checker
      </h1>

      <iframe src={pdfLink} className="h-120 md:h-164 max-w-lg w-full mb-4" />
      {results ? (
        <div className="space-y-1">
          <StatusIndicator
            isDone={results.isClearNumbering}
            text="All pages are numbered consecutively (ensure no blank pages in between)"
          />
          <StatusIndicator
            isDone={results.isPageLimit}
            text="Within max number of pages including Table of Contents and Title page"
          />
          <StatusIndicator
            isDone={results.isRightDimensions}
            text='Written Event fits within the required dimensions (8.5" x 11")'
          />
          <StatusIndicator
            isDone={state.isIntegrityDone}
            text="Written Statement of Assurances and Academic Integrity Completed"
          />
          <p className="text-xs text-zinc-500">*May be inaccurate</p>
        </div>
      ) : (
        <>
          <p>{progress.status}</p>
          <progress
            className="[&::-webkit-progress-value]:bg-deca-blue [&::-moz-progress-bar]:bg-deca-blue rounded-lg h-2 max-w-lg w-full"
            max="1"
            value={progress.progress}
          >
            {progress.progress}
          </progress>
        </>
      )}
    </>
  );
}

export default Results;
