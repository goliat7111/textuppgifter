export const EXTENDED_QUESTION_MAX_LENGTH = 300;
export const EXTENDED_ANSWER_MAX_LENGTH = 200;

export type ReadingLevel = 1 | 2 | 3 | 4;

const READING_LEVEL_INSTRUCTIONS: Record<ReadingLevel, string> = {
  1: "Nivå 1 – lätt: Använd mycket korta, raka meningar och vanliga ord. Skriv ut den information som behövs tydligt och nära frågan. Eleven ska främst förstå texten och hitta uppgiftens tal.",
  2: "Nivå 2 – grund: Använd vardagliga ord och korta, sammanhängande meningar. Eleven ska hitta den viktiga informationen och förstå en enkel koppling mellan händelse och fråga.",
  3: "Nivå 3 – utmanande: Variera meningsbyggnaden och använd några mindre vanliga men begripliga ord. Eleven ska koppla ihop information från olika delar av texten och skilja viktig information från bakgrundsdetaljer.",
  4: "Nivå 4 – avancerad läsförståelse: Gör läsutmaningen tydligt större än på nivå 3 genom textens uppbyggnad, inte bara svårare ord. Använd en sammanhängande berättelse med varierad meningsbyggnad och ett rikt men åldersanpassat ordförråd. Eleven ska behöva koppla ihop minst två relevanta ledtrådar från olika delar av texten och dra en rimlig slutsats utifrån det som faktiskt står. Variera hur ledtrådarna uttrycks och placeras mellan uppgifterna; undvik att alltid lägga dem i samma ordning eller precis intill frågan. Slutsatsen ska vara nödvändig för att förstå situationen eller vad frågan efterfrågar, men får inte kräva specialkunskap, gissningar eller outtalade antaganden. Håll själva matematiken på vald årskursnivå och lösningen entydig.",
};

export function readingComprehensionInstructions(level: ReadingLevel): string {
  return `Läsförståelse: ${READING_LEVEL_INSTRUCTIONS[level]} Denna nivå styr endast textens språkliga och läsmässiga svårighet, inte årskursen eller matematikens svårighet.
Kvalitetsgranska varje uppgift innan du svarar. Kontrollera att texten hänger ihop, att frågan går att besvara med informationen i texten, att läsutmaningen motsvarar vald nivå och att ingen viktig information saknas eller motsäger något annat. På nivå 3–4 ska eleven behöva läsa och koppla ihop information; gör inte uppgiften svår genom otydlighet. Kontrollera också att räknesätt, uträkning och svar stämmer. Bearbeta uppgifter som inte klarar kontrollerna. Svara endast med de färdiga uppgifterna, inte med granskningen.`;
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
