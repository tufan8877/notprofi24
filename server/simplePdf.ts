// Minimal, dependency-free PDF generator (text-only) for simple downloads.
// Produces a valid PDF with Helvetica font and one page (A4).

export type PdfLine = {
  text: string;
  x: number;
  y: number;
  size?: number;
};

function escapePdfText(input: string): string {
  return input
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)")
    .replace(/\r/g, "")
    .replace(/\n/g, "\\n");
}

function buildContentStream(lines: PdfLine[]): string {
  return lines
    .map((l) => {
      const size = l.size ?? 11;
      const txt = escapePdfText(l.text);
      // Use matrix positioning so every line is independent.
      return `BT /F1 ${size} Tf 1 0 0 1 ${l.x} ${l.y} Tm (${txt}) Tj ET`;
    })
    .join("\n");
}

export function buildPdf(lines: PdfLine[]): Buffer {
  const content = buildContentStream(lines);
  const contentBytes = Buffer.from(content, "utf8");

  const objects: string[] = [];
  objects.push("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");
  objects.push("2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n");
  objects.push(
    "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>\nendobj\n",
  );
  objects.push("4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n");
  objects.push(
    `5 0 obj\n<< /Length ${contentBytes.length} >>\nstream\n${content}\nendstream\nendobj\n`,
  );

  // Build xref
  let pdf = "%PDF-1.4\n";
  const offsets: number[] = [0];
  for (const obj of objects) {
    offsets.push(Buffer.byteLength(pdf, "utf8"));
    pdf += obj;
  }
  const xrefStart = Buffer.byteLength(pdf, "utf8");
  pdf += `xref\n0 ${objects.length + 1}\n`;
  pdf += `0000000000 65535 f \n`;
  for (let i = 1; i < offsets.length; i++) {
    const off = offsets[i].toString().padStart(10, "0");
    pdf += `${off} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefStart}\n%%EOF\n`;
  return Buffer.from(pdf, "utf8");
}
