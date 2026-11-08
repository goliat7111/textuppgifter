export const EXTENDED_QUESTION_MAX_LENGTH = 300;
export const EXTENDED_ANSWER_MAX_LENGTH = 200;

export function textTaskInstructions(extendedText: boolean): string {
  if (!extendedText) {
    return "Anpassa språk, meningslängd och svårighet till årskursen. Öka svårigheten något genom bladet. Max 3 meningar per uppgift. Svaren ska vara korrekta och kontrollerade.";
  }
  return `Anpassa språk, meningslängd och svårighet till årskursen. Öka svårigheten något genom bladet.
Skriv varje uppgift som en kort, sammanhängande berättelse om en tydlig situation kopplad till temat. Alla personer, händelser och detaljer ska höra ihop och vara rimliga; lägg inte till lösryckta fakta eller slumpmässiga tal. Ta med minst ett tal som passar naturligt in i situationen men inte behövs för svaret. Eleven ska behöva läsa och välja ut informationen som faktiskt behövs. Formulera en tydlig fråga och se till att alla nödvändiga tal och villkor finns med. Den extra detaljen får inte ändra svaret, skapa motsägelser eller göra frågan tvetydig. Använd inte det extra talet i facit eller uträkningen.
Max 3 meningar och ${EXTENDED_QUESTION_MAX_LENGTH} tecken per uppgift, inklusive frågan. Svaret med uträkning får vara högst ${EXTENDED_ANSWER_MAX_LENGTH} tecken. Svaren ska vara korrekta och kontrollerade.`;
}

export function paginateTaskItems<T>(
  items: T[],
  heights: number[],
  availableHeight: number,
  gap: number,
): T[][] {
  if (!items.length) return [];
  const pages: T[][] = [];
  let pageStart = 0;
  let pageHeight = 0;
  for (let i = 0; i < items.length; i++) {
    const itemHeight = heights[i] ?? 0;
    const nextHeight = pageHeight + (i > pageStart ? gap : 0) + itemHeight;
    if (i > pageStart && nextHeight > availableHeight) {
      pages.push(items.slice(pageStart, i));
      pageStart = i;
      pageHeight = itemHeight;
    } else {
      pageHeight = nextHeight;
    }
  }
  pages.push(items.slice(pageStart));
  return pages;
}
