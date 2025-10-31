import { useLayoutEffect, useRef, useState } from "react";

function GagueChart({percentage}: {percentage: number | undefined}) {
    let ref  = useRef<SVGGeometryElement>(null);

    let [dash, setDash] = useState({length: 0, visible:0})

    useLayoutEffect(() => {
        if (ref.current && percentage !== undefined) {
            const totalLength = ref.current.getTotalLength()
            setDash({length: totalLength, visible: totalLength * (percentage/100)})
        }
    }, [percentage])
     


    if (percentage !== undefined) {
        return (
            <div className="relative min-w-sm max-w-full h-64">
                <svg className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" width="300" height="200">
                    <path 
                        d="M 22.5 175 A 130 130 0 1 1 277.5 175" 
                        className="stroke-gray-700" strokeWidth="20" fill="none"
                    />
                    <path 
                        ref={ref}
                        d="M 22.5 175 A 130 130 0 1 1 277.5 175" 
                        className="stroke-deca-blue" strokeWidth="20" fill="none"
                        strokeDasharray={`${dash.visible} ${dash.length}`}
                    />
                </svg>
                <p className="absolute top-1/2 left-1/2 -translate-x-1/2 text-6xl font-semibold">
                    {percentage}%
                </p>
            </div>
        )
    }
    return (
            <div className="relative min-w-sm max-w-full h-64">
                <svg className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" width="300" height="200">
                    <path 
                        d="M 22.5 175 A 130 130 0 1 1 277.5 175" 
                        className="stroke-gray-700" strokeWidth="20" fill="none"
                    />
                </svg>
                <p className="absolute top-1/2 left-1/2 -translate-x-1/2 text-6xl font-semibold">
                    ...
                </p>
            </div>
    )
}

export default GagueChart;
