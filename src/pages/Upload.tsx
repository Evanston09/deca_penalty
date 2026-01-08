import { useCallback, useState, useMemo } from "react";
import { ChevronDown } from "lucide-react";
import { useDropzone } from "react-dropzone";
import { useNavigate } from "react-router";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DECA_EVENTS_OBJECT } from "../lib/decaEvents";

function Upload() {
  const navigate = useNavigate();
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);
  const [isIntegrityFilled, setIntegrityFilled] = useState(false);
  const [pdfUpload, setPDFUpload] = useState<File | null>(null);
  const [pdfError, setPDFError] = useState(false);
  const [eventError, setEventError] = useState(false);
  

   console.log(selectedEvent);
   const decaEventsByCategory = useMemo(() => {
        let decaEventsByCategory: Record<string, string[]> = {};
        for (const event of Object.values(DECA_EVENTS_OBJECT)) {
            if (!decaEventsByCategory[event.category]) {
                decaEventsByCategory[event.category] = [];
            }
            decaEventsByCategory[event.category].push(event.name);
        }
        return decaEventsByCategory
    }, [])

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length) {
        setPDFUpload(acceptedFiles[0]);
        setPDFError(false);
      }
    },
    [setPDFUpload, setPDFError],
  );

  const { getRootProps, getInputProps, fileRejections, isDragActive } =
    useDropzone({
      onDrop,
      accept: {
        "application/pdf": [".pdf"],
      },
      maxFiles: 1,
    });
async function submit() {
    if (!pdfUpload) {
      setPDFError(true);
      return;
    }
    if (!selectedEvent) {
      setEventError(true);
      return;
    }
    navigate("/results", {
      state: {
        pdf: pdfUpload,
        isIntegrityFilled,
        event: selectedEvent,
      },
    });
  }

  return (
    <>
      <h1 className="text-2xl md:text-5xl font-semibold mb-4">
        Prepared Event Penalty Checker
      </h1>

      <form action={submit} className="flex flex-col gap-4 max-w-full">
        <div>
          <div
            className="text-lg p-4 h-64 flex items-center justify-center border-1 border-zinc-200 border-dashed rounded-lg"
            {...getRootProps()}
          >
            <input {...getInputProps()} />
            {pdfUpload ? (
              <p className="underline overflow-hidden text-ellipsis">
                {pdfUpload.name}
              </p>
            ) : isDragActive ? (
              <p>Drop the file here ...</p>
            ) : (
              <p>Drag 'n' drop a PDF file here, or click to select file</p>
            )}
          </div>
          {pdfError && <p className="text-red-500">No PDF Uploaded</p>}
          {fileRejections.length > 0 && (
            <p className="text-red-500">
              {fileRejections[0].errors[0].message}
            </p>
          )}
        </div>

        <div className="text-sm md:text-base flex flex-col gap-1">
          <label>
            Have you signed the Prepared Event Statement of Assurances and Academic
            Integrity?
            <input
              checked={isIntegrityFilled}
              onChange={(e) => setIntegrityFilled(e.target.checked)}
                            type="checkbox"
                            name="integrity"
                            className="ml-2 accent-deca-blue"
                        />
                    </label>
                    <label>
                        What event are you in?:
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <button
                                    className="inline-flex items-center justify-between border rounded px-3 py-1 ml-2"
                                >
                                    {selectedEvent ?? "Select an event"}
                                    <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-56" align="start">
                                    {Object.keys(decaEventsByCategory).map((category) => 
                                    <DropdownMenuSub>
                                        <DropdownMenuSubTrigger>{category}</DropdownMenuSubTrigger>
                                        <DropdownMenuPortal>
                                            <DropdownMenuSubContent>
                                                {decaEventsByCategory[category].map((event) => {
                                                    return <DropdownMenuItem key={event} onSelect={()=>{setSelectedEvent(event); setEventError(false);}}>{event}</DropdownMenuItem>
                                                })}
                                            </DropdownMenuSubContent>
                                        </DropdownMenuPortal>
                                    </DropdownMenuSub>
                                )}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </label>
                    {eventError && <p className="text-red-500">No event selected</p>}
        </div>

        <button className="text-base md:text-lg font-semibold w-full bg-deca-blue hover:bg-deca-blue-hover p-4 rounded-lg">
          Check Prepared Event!
        </button>
      </form>
    </>
  );
}

export default Upload;
