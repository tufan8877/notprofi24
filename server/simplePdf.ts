import { PDFDocument, StandardFonts } from "pdf-lib";

export type PdfLine = {
  text: string;
  x: number;
  y: number;
  size?: number;
};

export function buildPdf(lines: PdfLine[]) {
  return (async () => {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]); // A4
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    for (const l of lines) {
      const size = l.size ?? 10;
      const useBold = size >= 14 || l.text.toUpperCase() === l.text;
      page.drawText(l.text ?? "", {
        x: l.x,
        y: l.y,
        size,
        font: useBold ? fontBold : font,
      });
    }

    const bytes = await pdfDoc.save();
    return Buffer.from(bytes);
  })();
}
