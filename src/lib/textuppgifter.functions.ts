import { FOCUS_PROMPTS, GEOMETRY_PROMPTS } from "./textuppgifter-focus";
import {
  EXTENDED_ANSWER_MAX_LENGTH,
  EXTENDED_QUESTION_MAX_LENGTH,
  textTaskInstructions,
} from "./textuppgifter-extra";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export type TextTask = { question: string; answer: string };

const Input = z.object({
  geometry: z.enum(["plane", "solids", "space", "scale"]).default("plane"),
  focus: z
    .enum(["arithmetic", "algebra", "geometry", "probabilityStatistics", "combinatorics"])
    .default("arithmetic"),
  grade: z.number().int().min(1).max(9),
  tableMin: z.number().int().min(0).max(12),
  tableMax: z.number().int().min(0).max(12),
  theme: z.string().trim().min(1).max(80),
  count: z.number().int().min(3).max(12),
  op: z.enum(["add", "sub", "mul", "div", "all"]).default("all"),
  maxNumber: z.number().int().min(10).max(100000).default(100),
  extendedText: z.boolean().default(false),
});

const OP_TEXT = {
  add: (lo: number, hi: number, max: number) =>
    `Varje uppgift ska lösas med addition, med tal upp till ${max}. Använd additionens språk varierat: "tillsammans", "sammanlagt", "fler", "ökar med", "hur många blir det", "summan".`,
  sub: (lo: number, hi: number, max: number) =>
    `Varje uppgift ska lösas med subtraktion, med tal upp till ${max}. Använd subtraktionens språk varierat: "hur många är kvar", "skillnaden", "hur många fler/färre", "minskar med", "tar bort", "ger bort". Svaret ska alltid vara positivt.`,
  mul: (lo: number, hi: number) =>
    `Varje uppgift ska lösas med multiplikation (ibland kombinerat med addition/subtraktion för äldre elever) där minst en faktor ligger i tabellerna ${lo}–${hi}. Använd multiplikationens språk: "lika många i varje", "gånger så många", "dubbelt", "rader med", "varje ... har".`,
  div: (lo: number, hi: number) =>
    `Varje uppgift ska lösas med division där divisorn eller kvoten ligger i tabellerna ${lo}–${hi}. Blanda delningsdivision ("dela lika mellan", "hur många får var och en") och innehållsdivision ("hur många grupper/påsar räcker det till", "hur många gånger ryms"). Om det blir rest, låt frågan hantera den naturligt.`,
  all: (lo: number, hi: number, max: number) =>
    `Blanda räknesätten så att bladet innehåller ungefär lika många uppgifter i addition, subtraktion, multiplikation och division, i blandad ordning. Addition och subtraktion med tal upp till ${max}; multiplikation och division med tabellerna ${lo}–${hi}. Använd respektive räknesätts typiska språk (t.ex. "sammanlagt", "hur många är kvar", "lika många i varje", "dela lika").`,
};

export const generateTextTasks = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data }): Promise<{ tasks: TextTask[] } | { error: string }> => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) return { error: "AI-tjänsten är inte konfigurerad." };
    const lo = Math.min(data.tableMin, data.tableMax),
      hi = Math.max(data.tableMin, data.tableMax);
    const prompt = `Skriv ${data.count} textuppgifter (problemlösning) i matematik på svenska för elever i årskurs ${data.grade}.
Tema: ${data.theme}.
${data.focus === "arithmetic" ? OP_TEXT[data.op](lo, hi, data.maxNumber) : FOCUS_PROMPTS[data.focus]}
${data.focus === "geometry" ? GEOMETRY_PROMPTS[data.geometry] : ""}
${textTaskInstructions(data.extendedText)}
Svara ENDAST med JSON: {"tasks":[{"question":"...","answer":"kort svar med enhet, t.ex. '24 äpplen' och uträkning i parentes, t.ex. '(6 · 4 = 24)', med rätt räknetecken (+, −, ·, /)"}]}`;
    const res = await fetch("https://ai.gateway.lovable.dev/v1/responses", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
        "Lovable-API-Key": key,
        "X-Lovable-AIG-SDK": "fetch",
      },
      body: JSON.stringify({
        model: "openai/gpt-6-astra",
        input: prompt,
        stream: true,
        store: false,
        reasoning: { effort: "low" },
      }),
    });
    if (!res.ok || !res.body) {
      if (res.status === 429)
        return { error: "För många förfrågningar just nu. Vänta en stund och försök igen." };
      if (res.status === 402)
        return {
          error: "AI-krediterna är slut. Fyll på under Inställningar → Planer och krediter.",
        };
      return { error: `Uppgifterna kunde inte skapas (fel ${res.status}).` };
    }
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = "",
      text = "";
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      let i;
      while ((i = buf.indexOf("\n")) >= 0) {
        const line = buf.slice(0, i).trim();
        buf = buf.slice(i + 1);
        if (!line.startsWith("data:")) continue;
        const p = line.slice(5).trim();
        if (!p || p === "[DONE]") continue;
        try {
          const ev = JSON.parse(p);
          if (ev.type === "response.output_text.delta") text += ev.delta;
          if (ev.type === "response.failed" || ev.type === "error")
            return { error: "AI-tjänsten svarade med ett fel. Försök igen." };
        } catch {
          /* ofullständig rad */
        }
      }
    }
    const m = text.match(/\{[\s\S]*\}/);
    try {
      const parsed = z
        .object({ tasks: z.array(z.object({ question: z.string(), answer: z.string() })) })
        .parse(JSON.parse(m?.[0] ?? ""));
      if (!parsed.tasks.length) throw new Error();
      if (
        data.extendedText &&
        parsed.tasks
          .slice(0, data.count)
          .some(
            (task) =>
              task.question.length > EXTENDED_QUESTION_MAX_LENGTH ||
              task.answer.length > EXTENDED_ANSWER_MAX_LENGTH,
          )
      ) {
        return { error: "AI:n skapade för långa uppgifter för utskrift. Försök igen." };
      }
      return { tasks: parsed.tasks.slice(0, data.count) };
    } catch {
      return { error: "Svaret från AI:n gick inte att tolka. Försök igen." };
    }
  });
