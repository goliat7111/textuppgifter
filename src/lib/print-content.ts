export type PrintContent = "both" | "sheet" | "key";

export const showSheet = (c: PrintContent) => c !== "key";
export const showKey = (c: PrintContent) => c !== "sheet";
export const pagesLabel = (c: PrintContent) =>
  c === "both" ? "2 sidor (blad + facit)" : c === "sheet" ? "1 sida (bladet)" : "1 sida (facit)";
export const keySuffix = (c: PrintContent) => (c === "key" ? "-facit" : "");
