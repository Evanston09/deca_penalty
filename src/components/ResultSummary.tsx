import { CircleCheck, CircleX } from "lucide-react";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import { Skeleton } from "@/components/ui/skeleton";

function ResultSummary({ children, isDone, text }: { children: React.ReactNode; isDone: boolean | undefined; text: string }) {
    if (isDone !== undefined) {
        return (
            <Accordion type="single" collapsible>
                <AccordionItem value={text}>
                    <AccordionTrigger className="text-md py-3 px-4 hover:bg-muted/50 rounded-md">
                        <div className="font-medium text-lg flex items-center gap-3 w-full">
                            {isDone ? (
                                <CircleCheck className="text-green-500" />
                            ) : (
                                    <CircleX className="text-red-500" />
                                )}
                            {text}
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4">
                        {children}
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        );
    }
    return  (
        <div className="py-3 px-4">
            <div className="flex items-center gap-3 w-full">
                <Skeleton className="h-6 w-6 rounded-full" />
                <Skeleton className="h-4 grow" />
            </div>
        </div>
    )
}


export default ResultSummary;
