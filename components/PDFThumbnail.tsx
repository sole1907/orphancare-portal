"use client";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";

// Worker setup
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

export default function PDFThumbnail({ url }: { url: string }) {
  return (
    <div className="relative w-full max-w-[300px] h-32 border rounded overflow-hidden">
      <Document file={url}>
        <Page pageNumber={1} width={300} />
      </Document>
    </div>
  );
}
