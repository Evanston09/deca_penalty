import { useLocation } from "react-router";
import { checkPDF } from "../lib/pdfChecker";
import { useState, useEffect, useMemo } from "react";
import { useWindowSize } from "react-use";
import StatusIndicator from "../components/StatusIndicator";
import Confetti from "react-confetti";

function Results() {
    type Result = {
        isPageLimit: boolean;
        isRightDimensions: boolean;
        isClearNumbering: boolean;
    };

    const location = useLocation();
    const { width, height } = useWindowSize();

    const state = location.state;

    const [results, setResults] = useState<Result | null>(null);
    const pdfLink = useMemo(() => URL.createObjectURL(state.pdf), [state]);

    useEffect(() => {
        const fetchResults = async () => {
            setResults(await checkPDF(pdfLink, state.pageNumber, state.useImages))
        };
        if (pdfLink && state) {
            fetchResults();
        }
    }, [pdfLink, state])


    if (!state || !pdfLink) {
        return <p>Error: No PDF provided.</p>;
    }

    return (
        <>
            <h1 className="text-2xl md:text-5xl font-semibold mb-8">
                Written Event Penalty Checker
            </h1>

            <iframe src={pdfLink} className="h-164 max-w-lg w-full mb-8" />
            {results ? (
                <div className='space-y-1'>
                    {Object.values(results).every((item) => item === true) &&
                        state.isIntegrityDone && (
                            <Confetti
                                width={width}
                                height={height}
                                // DECA Colors :)
                                colors={["#0072ce", "#85754e", "#8c9091"]}
                            />
                        )}
                    <StatusIndicator
                        isDone={results.isClearNumbering}
                        text='All pages are numbered consecutively (ensure no blank pages in between)'
                    />
                    <StatusIndicator
                        isDone={results.isPageLimit}
                        text='Within max number of pages including Table of Contents and Title page'
                    />
                    <StatusIndicator
                        isDone={results.isRightDimensions}
                        text='Written Event fits within the required dimensions (8.5" x 11")'
                    />
                    <StatusIndicator
                        isDone={state.isIntegrityDone}
                        text='Written Statement of Assurances and Academic Integrity Completed'
                    />
                </div>
            ) : (
                <p>Loading results...</p>
            )}
        </>
    );
}

export default Results;
