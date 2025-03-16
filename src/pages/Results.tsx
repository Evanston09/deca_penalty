import { useLocation } from 'react-router';
import { useState, useEffect } from 'react';
import { useWindowSize } from 'react-use'
import { checkPDF } from '../lib/pdfTester';
import StatusIndicator from '../components/StatusIndicator';
import Confetti from 'react-confetti'

function Results() {
  type Result = {
        isPageLimit: boolean,
        isRightDimensions: boolean,
        isClearNumbering: boolean
  }

  const location = useLocation();
  const { width, height } = useWindowSize();
  
  const [results, setResults] = useState<Result | null>(null);

  const state = location.state

  useEffect(() => {
      if (state) {
            async function getResults() {
                setResults(await checkPDF(state.pdf, state.pageNumber, state.useImages));
            }
            getResults();
        }
  }, [state]);

  if (!state) {
      return <p>Error: No PDF provided.</p>;
  }

    console.log(state.isIntegrityDone);

  return (
    <>
            <h1 className='text-5xl font-semibold mb-8'>DECA Written Event Penalty Checker</h1>

        <iframe src={state.pdf} className='h-164 min-w-xl mb-4'/>
        {results ? (
            <>
                {(Object.values(results).every(item=>item===true) && state.isIntegrityDone) && (
                    <Confetti
                        width={width}
                        height={height}
                    />
                )}
                <StatusIndicator isDone={state.isIntegrityDone} text="Statement of Academic Integrity Completed" />
                <StatusIndicator isDone={results.isPageLimit} text="Within max number of pages including Table of Contents and Title page" />
                <StatusIndicator isDone={results.isRightDimensions} text="PDF fits in the required dimensions (8.5 x 11)" />
                <StatusIndicator isDone={results.isClearNumbering} text="All pages are clearly numbered (ensure there are no separate pages between sections)" />
            </>
        ) : (
            <p>Loading results...</p>
        )}
    </>
  );
}

export default Results;
