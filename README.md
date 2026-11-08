# Textuppgifter

Fristående app för att skapa svenska textuppgifter med AI eller lägga in egna
uppgifter, med elevblad och facit för utskrift eller PDF. Årskurs, fokusområde,
tema och antal uppgifter kan anpassas. Med **Utökad text** får AI-uppgifterna
sammanhängande berättelser där eleverna får öva på att välja vilken information
som behövs för att lösa uppgiften. Läs alltid igenom AI-genererade
uppgifter och facit före utskrift.

## Lovable

Detta är en lokal projektkopia och är inte automatiskt ansluten till Lovable.
Lovable skapar ett nytt GitHub-repo när ett nytt Lovable-projekt ansluts till
GitHub; kopiera därefter in projektfilerna i den klonade Lovable-skapade
repositoryn och skicka ändringarna till dess anslutna gren utan att skriva om
git-historiken.

Be Lovable att aktivera den inbyggda AI-anslutningen för det nya projektet och
koppla uppgiftsgenereringen till en säker backend-funktion med projektets
automatiskt hanterade AI-nyckel. Den befintliga serverfunktionen använder
`LOVABLE_API_KEY`, men en ny Lovable-anslutning och tillgång till nyckeln i
servermiljön är inte konfigurerade av denna lokala kopia. Kontrollera
generering, facit och utskrift i det nya projektet efter anslutningen. Ingen
nyckel ska läggas in i koden eller skickas till webbläsaren.

Se [Lovables dokumentation om AI](https://docs.lovable.dev/features/ai) och
[GitHub-synkronisering](https://docs.lovable.dev/integrations/github).

## Lokal utveckling

Installera Node.js och kör `npm ci`, följt av `npm run dev`. Utan en giltig
serverkonfigurerad AI-anslutning kan sidan visas men uppgifter inte genereras.
Kör `npm run build` för produktionsbygge och `npx vitest run` för tester.
Test från VS Code 2026-11-08
