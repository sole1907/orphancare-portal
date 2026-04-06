"use client";
import { Document, Page } from "react-pdf";
import "react-pdf/dist/esm/Page/AnnotationLayer.css";
import "react-pdf/dist/esm/Page/TextLayer.css";

export default function PDFThumbnail({
  url,
  scale = 0.8,
  className,
}: {
  url: string;
  scale?: number;
  className?: string;
}) {
  return (
    <div className={className}>
      <Document file={url}>
        <Page pageNumber={1} scale={scale} />
      </Document>
    </div>
  );
}
