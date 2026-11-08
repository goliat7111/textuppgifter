export type Orientation = "portrait" | "landscape";

import { toPng } from "html-to-image";
import { jsPDF } from "jspdf";

/** Exporterar alla synliga blad (.a4-page i utskriftsområdet) som en
 *  utskriftsklar A4-PDF med bevarad layout. Varje blad blir exakt en
 *  PDF-sida, så uppgifter hålls alltid ihop (även i liggande A4).
 *  Diskreta sidnummer ritas i bladets nedre marginal. */
export async function buildSheetsPdf(
  orientation: Orientation,
): Promise<{ blob: Blob; pages: number; images: string[] } | null> {
  const pages = Array.from(
    document.querySelectorAll<HTMLElement>(".print-area .a4-page:not(.measurement-page)"),
  );
  if (pages.length === 0) return null;
  const getPageOrientation = (page: HTMLElement): Orientation =>
    page.classList.contains("portrait-page")
      ? "portrait"
      : page.classList.contains("landscape")
        ? "landscape"
        : orientation;
  const firstOrientation = getPageOrientation(pages[0]!);
  const pdf = new jsPDF({
    orientation: firstOrientation,
    unit: "mm",
    format: "a4",
    compress: true,
  });
  const images: string[] = [];
  for (let i = 0; i < pages.length; i++) {
    const page = pages[i]!;
    const pageOrientation = getPageOrientation(page);
    const w = pageOrientation === "portrait" ? 210 : 297;
    const h = pageOrientation === "portrait" ? 297 : 210;
    // Skärmzoomen (CSS zoom på .a4-page) får aldrig följa med i PDF:en –
    // bladet fångas alltid i exakt A4-storlek (96 px per tum).
    const pxW = Math.round((w * 96) / 25.4);
    const pxH = Math.round((h * 96) / 25.4);
    const prevZoom = page.style.zoom;
    page.style.zoom = "1";
    const png = await toPng(page, {
      pixelRatio: 2,
      backgroundColor: "#ffffff",
      width: pxW,
      height: pxH,
      style: {
        boxShadow: "none",
        height: `${h}mm`,
        minHeight: `${h}mm`,
        maxHeight: `${h}mm`,
        width: `${w}mm`,
        maxWidth: `${w}mm`,
        overflow: "visible",
      },
    }).finally(() => {
      page.style.zoom = prevZoom;
    });
    images.push(png);
    if (i > 0) pdf.addPage("a4", pageOrientation);
    pdf.addImage(png, "PNG", 0, 0, w, h);
    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(8);
    pdf.setTextColor(160);
    pdf.text(`Sida ${i + 1} av ${pages.length}`, w / 2, h - 6, { align: "center" });
    pdf.setTextColor(0);
  }
  return { blob: pdf.output("blob"), pages: pages.length, images };
}

/** Gör ett säkert filnamn som slutar på .pdf */
export function safePdfName(name: string): string {
  const base = name
    .trim()
    .replace(/\.pdf$/i, "")
    .replace(/[\\/:*?"<>|]+/g, "")
    .replace(/\s+/g, "-")
    .toLowerCase();
  return `${base || "raknebladet"}.pdf`;
}

export function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = safePdfName(filename);
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function exportSheetsToPdf(
  orientation: Orientation,
  filename = "raknebladet.pdf",
): Promise<number> {
  const r = await buildSheetsPdf(orientation);
  if (!r) return 0;
  saveBlob(r.blob, filename);
  return r.pages;
}
