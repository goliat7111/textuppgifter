export const EXTENDED_QUESTION_MAX_LENGTH = 300;
export const EXTENDED_ANSWER_MAX_LENGTH = 200;

export type ReadingLevel = 1 | 2 | 3 | 4;

const READING_LEVEL_INSTRUCTIONS: Record<ReadingLevel, string> = {
  1: "Nivå 1 – lätt: Använd mycket korta, raka meningar och vanliga ord. Skriv ut den information som behövs tydligt och nära frågan; eleven ska främst förstå texten och hitta uppgiftens tal.",
  2: "Nivå 2 – grund: Använd vardagliga ord och korta, sammanhängande meningar. Eleven får hitta den viktiga informationen i texten och förstå en enkel koppling mellan händelse och fråga.",
  3: "Nivå 3 – utmanande: Variera meningsbyggnaden och använd några mindre vanliga men begripliga ord. Eleven får koppla ihop information från olika delar av texten och skilja viktig information från bakgrundsdetaljer.",
  4: "Nivå 4 – avancerad: Använd ett rikare ordförråd och mer varierad meningsbyggnad, fortfarande begriplig för vald årskurs. Eleven får dra en enkel slutsats eller kombinera ledtrådar från flera delar av texten. Håll frågan tydlig och lösbar utan gissningar.",
};

export function readingComprehensionInstructions(level: ReadingLevel): string {
  return `Läsförståelse: ${READING_LEVEL_INSTRUCTIONS[level]} Denna nivå styr endast textens språkliga och läsmässiga svårighet, inte årskursen eller matematikens svårighet.`;
}

export function textTaskInstructions(extendedText: boolean): string {
  if (!extendedText) {
    return "Anpassa matematikens svårighet efter årskursen. Håll texten tydlig och uppgifterna varierade. Max 3 meningar per uppgift. Svaren ska vara korrekta och kontrollerade.";
  }
  return `Anpassa matematikens svårighet efter årskursen. Håll texten tydlig och uppgifterna varierade.
Skriv varje uppgift som en kort, sammanhängande berättelse om en tydlig situation kopplad till temat. Alla personer, händelser och detaljer ska höra ihop och vara rimliga; lägg inte till lösryckta fakta eller slumpmässiga tal. Ta med minst ett tal som passar naturligt in i situationen men inte behövs för svaret. Eleven ska behöva läsa och välja ut informationen som faktiskt behövs. Variera var den extra detaljen står: ibland i början, ibland mitt i eller mot slutet av berättelsen. Variera placeringen mellan uppgifterna och undvik att alltid lägga den i första meningen eller precis före frågan. Formulera en tydlig fråga och se till att alla nödvändiga tal och villkor finns med. Den extra detaljen får inte ändra svaret, skapa motsägelser eller göra frågan tvetydig. Använd inte det extra talet i facit eller uträkningen.
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
