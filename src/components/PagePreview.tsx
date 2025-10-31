import { useCallback, useEffect, useState } from "react"
import {
    HoverCard,
    HoverCardContent,
    HoverCardTrigger,
} from "@/components/ui/hover-card"
import { Info } from "lucide-react";
import { TextObject } from "../lib/ValidatorTypes";

type pagePreviewProps = {
    pageImage: Blob, 
    matchingBlocks: TextObject[]
}

export function PagePreview({pageImage, matchingBlocks}: pagePreviewProps) {

    const canvasCallbackRef = useCallback((canvas: HTMLCanvasElement | null) => {
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        createImageBitmap(pageImage).then(imageBitmap => {
            canvas.width = imageBitmap.width;
            canvas.height = imageBitmap.height;
            ctx.drawImage(imageBitmap, 0, 0, imageBitmap.width, imageBitmap.height);
            for (let block of matchingBlocks) {
                const width = block.bbox.right - block.bbox.left;
                const height = block.bbox.bottom - block.bbox.top;

                ctx.strokeStyle = 'red';
                ctx.lineWidth = 2;
                ctx.strokeRect(block.bbox.left, block.bbox.top, width, height);
            }
        });
    }, []);

    return (
        <HoverCard>
            <HoverCardTrigger asChild>
                <Info size={16} className="inline"/>
            </HoverCardTrigger>
            <HoverCardContent className="w-fit">
                <canvas 
                    ref={canvasCallbackRef}
                />
            </HoverCardContent>
        </HoverCard>
    );
}
