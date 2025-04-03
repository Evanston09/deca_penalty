import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { useNavigate } from "react-router";

function Upload() {
  const navigate = useNavigate();
  const [pageNumber, setPageNumber] = useState(10);
  const [isIntegrityDone, setIntegrityDone] = useState(false);
  const [useImages, setUseImages] = useState(false);
  const [pdfUpload, setPDFUpload] = useState<File | null>(null);
  const [pdfError, setPDFError] = useState(false);

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
    navigate("/results", {
      state: {
        pdf: pdfUpload,
        pageNumber: pageNumber,
        isIntegrityDone: isIntegrityDone,
        useImages: useImages,
      },
    });
  }

  return (
    <>
      <h1 className="text-2xl md:text-5xl font-semibold mb-4">
        Written Event Penalty Checker
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
            Have you completed the Written Statement of Assurances and Academic
            Integrity?
            <input
              checked={isIntegrityDone}
              onChange={(e) => setIntegrityDone(e.target.checked)}
              type="checkbox"
              name="integrity"
              className="ml-2 accent-deca-blue"
            />
          </label>
          <label>
            Analyze images? (Helpful if page numbers are images. Takes more
            time.)
            <input
              checked={useImages}
              onChange={(e) => setUseImages(e.target.checked)}
              type="checkbox"
              name="integrity"
              className="ml-2 accent-deca-blue"
            />
          </label>

          <label>
            How many pages are in your event:
            <select
              value={pageNumber}
              onChange={(e) => setPageNumber(Number(e.target.value))}
              name="pages"
              className="ml-2"
            >
              <option className="text-black" value="10">
                10
              </option>
              <option className="text-black" value="20">
                20
              </option>
            </select>
          </label>
        </div>

        <button className="text-base md:text-lg font-semibold w-full bg-deca-blue hover:bg-deca-blue-hover p-4 rounded-lg">
          Check Written Event!
        </button>
      </form>
    </>
  );
}

export default Upload;
