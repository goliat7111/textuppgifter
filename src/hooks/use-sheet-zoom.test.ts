import { describe, expect, it } from "vitest";
import { calculateSheetFit } from "./use-sheet-zoom";

describe("calculateSheetFit", () => {
  it("fits the page in the space below the preview area", () => {
    const pageHeight = (297 * 96) / 25.4;
    const viewportHeight = 900;
    const contentTop = 140;
    const fit = calculateSheetFit(1000, viewportHeight, contentTop, false);

    expect(fit).toBeCloseTo((viewportHeight - contentTop - 32) / pageHeight);
  });

  it("keeps the width limit and landscape dimensions", () => {
    const pageWidth = (297 * 96) / 25.4;
    const fit = calculateSheetFit(pageWidth * 0.7, 1200, 0, true);

    expect(fit).toBeCloseTo(0.7);
  });
});
