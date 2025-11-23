// pages/_app.tsx
import "../styles/globals.css";
import type { AppProps } from "next/app";
import { pdfjs } from "react-pdf";

pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjs.version}/pdf.worker.min.js`;

export default function MyApp({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />;
}
