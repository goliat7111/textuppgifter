import {
  FOCUS_AREAS,
  GEOMETRY_AREAS,
  type GeometryArea,
  type FocusArea,
} from "@/lib/textuppgifter-focus";
import { PdfPagesPreview } from "@/components/PdfPagesPreview";
import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { FileDown, Printer, Wand2 } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { PrintContentChoice } from "@/components/PrintContentChoice";
import { keySuffix, showKey, showSheet, type PrintContent } from "@/lib/print-content";
import { SheetHeader } from "@/components/SheetHeader";
import { ZoomControls } from "@/components/ZoomControls";
import { useSheetZoom } from "@/hooks/use-sheet-zoom";
import { generateTextTasks, type TextTask } from "@/lib/textuppgifter.functions";
import { paginateTaskItems } from "@/lib/textuppgifter-extra";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Textuppgifter" },
      {
        name: "description",
        content:
          "Skapa nivåanpassade textuppgifter i alla fyra räknesätten med valfritt tema och facit, utskriftsklara på A4.",
      },
      { property: "og:title", content: "Textuppgifter" },
      {
        property: "og:description",
        content:
          "AI-skapade textuppgifter i alla fyra räknesätten, anpassade efter årskurs och tema.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TextuppgifterPage,
});

type Op = "add" | "sub" | "mul" | "div" | "all";
const OPS: { v: Op; label: string }[] = [
  { v: "add", label: "Addition" },
  { v: "sub", label: "Subtraktion" },
  { v: "mul", label: "Multiplikation" },
  { v: "div", label: "Division" },
  { v: "all", label: "Alla räknesätt" },
];

export function Sheet({
  tasks,
  answers,
  grade,
  theme,
  opLabel,
  startIndex,
  total,
  titlePrefix = "Textuppgifter",
  measurement = false,
}: {
  tasks: TextTask[];
  answers: boolean;
  grade: number;
  theme: string;
  opLabel: string;
  startIndex: number;
  total: number;
  titlePrefix?: string;
  measurement?: boolean;
}) {
  return (
    <div className={`a4-page text-task-page${measurement ? " measurement-page" : ""}`}>
      <SheetHeader
        title={answers ? `${titlePrefix} – Facit` : titlePrefix}
        subtitle={`Åk ${grade} · ${opLabel} · ${theme}`}
        score={`av ${total}`}
      />
      <ol className="mt-5 flex flex-col gap-4 text-[15px] leading-snug text-sheet-ink">
        {tasks.map((t, i) => (
          <li key={i} className="flex gap-3" style={{ breakInside: "avoid" }}>
            <span className="w-6 shrink-0 font-bold">{startIndex + i + 1})</span>
            <div className="min-w-0 flex-1 break-words">
              <p className="whitespace-pre-line">{t.question}</p>
              {answers ? (
                <p className="mt-1 whitespace-pre-line font-semibold text-destructive">
                  Svar: {t.answer || "____________________"}
                </p>
              ) : (
                <div className="mt-2 h-16 border-b border-sheet-muted" aria-hidden>
                  <span className="text-sm text-sheet-muted">Svar:</span>
                </div>
              )}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

type PageStatus = { signature: string; error: string };
type SheetProps = React.ComponentProps<typeof Sheet>;

function PaginatedSheets({
  signature,
  onStatus,
  ...props
}: SheetProps & {
  signature: string;
  onStatus: (status: PageStatus) => void;
}) {
  const measurementRef = useRef<HTMLDivElement>(null);
  const [layout, setLayout] = useState<{ signature: string; pages: TextTask[][] }>({
    signature: "",
    pages: [],
  });

  useLayoutEffect(() => {
    const page = measurementRef.current?.querySelector<HTMLElement>(".measurement-page");
    const list = page?.querySelector<HTMLOListElement>("ol");
    if (!page || !list) return;
    let active = true;
    const measure = () => {
      if (!active || window.matchMedia("print").matches) return;
      const pageRect = page.getBoundingClientRect();
      const listRect = list.getBoundingClientRect();
      const pageStyle = getComputedStyle(page);
      const listStyle = getComputedStyle(list);
      const items = Array.from(list.children);
      const heights = items.map((item) => item.getBoundingClientRect().height);
      const availableHeight =
        (pageRect.width * 297) / 210 -
        (listRect.top - pageRect.top) -
        parseFloat(pageStyle.paddingBottom) -
        1;
      const gap = parseFloat(listStyle.rowGap) || 0;
      if (
        availableHeight <= 0 ||
        heights.length !== props.tasks.length ||
        heights.some((height) => height <= 0)
      ) {
        setLayout({ signature, pages: [] });
        onStatus({ signature, error: "Sidindelningen kunde inte beräknas. Försök igen." });
        return;
      }
      if (heights.some((height) => height > availableHeight)) {
        setLayout({ signature, pages: [] });
        onStatus({
          signature,
          error: "En uppgift är för lång för att rymmas på en sida. Ta bort eller förkorta den.",
        });
        return;
      }
      const pages = paginateTaskItems(props.tasks, heights, availableHeight, gap);
      setLayout((current) =>
        current.signature === signature &&
        current.pages.map((part) => part.length).join(",") ===
          pages.map((part) => part.length).join(",")
          ? current
          : { signature, pages },
      );
      onStatus({ signature, error: "" });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(list);
    if (page.firstElementChild) observer.observe(page.firstElementChild);
    document.fonts.ready.then(measure);
    document.fonts.addEventListener("loadingdone", measure);
    return () => {
      active = false;
      observer.disconnect();
      document.fonts.removeEventListener("loadingdone", measure);
    };
  }, [signature, onStatus, props.tasks]);

  let startIndex = 0;
  return (
    <>
      <div ref={measurementRef} className="text-task-measurement no-print" aria-hidden="true">
        <Sheet {...props} measurement />
      </div>
      {layout.signature === signature &&
        layout.pages.map((page, index) => {
          const firstIndex = startIndex;
          startIndex += page.length;
          return <Sheet key={index} {...props} tasks={page} startIndex={firstIndex} />;
        })}
    </>
  );
}

function TextuppgifterPage() {
  const gen = useServerFn(generateTextTasks);
  const [grade, setGrade] = useState(5);
  const [tMin, setTMin] = useState("2");
  const [tMax, setTMax] = useState("9");
  const [theme, setTheme] = useState("");
  const [count, setCount] = useState(6);
  const [geometry, setGeometry] = useState<GeometryArea>("plane");
  const [focus, setFocus] = useState<FocusArea>("arithmetic");
  const [op, setOp] = useState<Op>("mul");
  const [maxNumber, setMaxNumber] = useState(100);
  const [extendedText, setExtendedText] = useState(false);
  const [content, setContent] = useState<PrintContent>("sheet");
  const { mainProps, zoom, setZoom, zoomStep } = useSheetZoom();
  const [tasks, setTasks] = useState<TextTask[]>([]);
  const [meta, setMeta] = useState({
    grade: 5,
    theme: "",
    op: "mul" as Op,
    focus: "arithmetic" as FocusArea,
    geometry: "plane" as GeometryArea,
    extendedText: false,
  });
  const [manualMode, setManualMode] = useState(false);
  const [manualGrade, setManualGrade] = useState(5);
  const [manualTheme, setManualTheme] = useState("");
  const [manualTasks, setManualTasks] = useState<TextTask[]>([]);
  const [draftQuestion, setDraftQuestion] = useState("");
  const [draftAnswer, setDraftAnswer] = useState("");
  const [manualMeta, setManualMeta] = useState({
    grade: 5,
    theme: "",
    op: "all" as Op,
    focus: "arithmetic" as FocusArea,
    geometry: "plane" as GeometryArea,
    extendedText: false,
  });
  const activeTasks = manualMode ? manualTasks : tasks;
  const activeMeta = manualMode
    ? { ...manualMeta, grade: manualGrade, theme: manualTheme.trim() }
    : meta;
  const [sheetStatus, setSheetStatus] = useState<PageStatus>({ signature: "", error: "" });
  const [keyStatus, setKeyStatus] = useState<PageStatus>({ signature: "", error: "" });
  const updateSheetStatus = useCallback(
    (status: PageStatus) =>
      setSheetStatus((current) =>
        current.signature === status.signature && current.error === status.error ? current : status,
      ),
    [],
  );
  const updateKeyStatus = useCallback(
    (status: PageStatus) =>
      setKeyStatus((current) =>
        current.signature === status.signature && current.error === status.error ? current : status,
      ),
    [],
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [exporting, setExporting] = useState(false);
  const [preview, setPreview] = useState<{
    url: string;
    blob: Blob;
    pages: number;
    images: string[];
  } | null>(null);
  const [fileName, setFileName] = useState("");
  const previewUrl = useRef<string | null>(null);
  useEffect(
    () => () => {
      if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
    },
    [],
  );
  const closePreview = () => {
    if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
    previewUrl.current = null;
    setPreview(null);
  };
  const downloadPdf = async () => {
    setExporting(true);
    setError("");
    try {
      const { buildSheetsPdf } = await import("@/lib/exportPdf");
      const result = await buildSheetsPdf("portrait");
      if (!result) throw new Error("Inga blad att spara. Skapa uppgifter först.");
      if (previewUrl.current) URL.revokeObjectURL(previewUrl.current);
      const url = URL.createObjectURL(result.blob);
      previewUrl.current = url;
      setPreview({ ...result, url });
      setFileName(
        `${manualMode ? "egna-uppgifter" : "textuppgifter"}-ak${activeMeta.grade}${keySuffix(content)}-${new Date().toISOString().slice(0, 10)}`,
      );
    } catch {
      setError("PDF-filen kunde inte skapas. Försök igen eller använd Skriv ut.");
    } finally {
      setExporting(false);
    }
  };
  const savePreview = async () => {
    if (!preview) return;
    const { saveBlob } = await import("@/lib/exportPdf");
    saveBlob(preview.blob, fileName);
    closePreview();
  };
  const input = "mt-1 block rounded-md border border-input bg-background px-2 py-1.5";

  const opLabel =
    meta.focus === "arithmetic"
      ? OPS.find((o) => o.v === meta.op)!.label
      : meta.focus === "geometry"
        ? GEOMETRY_AREAS[meta.geometry]
        : FOCUS_AREAS[meta.focus];
  const activeOpLabel = manualMode ? "Egna uppgifter" : opLabel;
  const layoutSignature = JSON.stringify([
    activeTasks,
    activeMeta.grade,
    activeMeta.theme,
    activeOpLabel,
    manualMode,
  ]);
  const statuses = [
    ...(showSheet(content) ? [sheetStatus] : []),
    ...(showKey(content) ? [keyStatus] : []),
  ];
  const layoutReady = statuses.every(
    (status) => status.signature === layoutSignature && !status.error,
  );
  const layoutError = statuses.find(
    (status) => status.signature === layoutSignature && status.error,
  )?.error;
  const addManualTask = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const question = draftQuestion.trim();
    if (!question) {
      setError("Skriv en uppgift innan du lägger till den.");
      return;
    }
    setManualTasks((current) => [...current, { question, answer: draftAnswer.trim() }]);
    setManualMeta({
      grade: manualGrade,
      theme: manualTheme.trim(),
      op: "all",
      focus: "arithmetic",
      geometry: "plane",
      extendedText: false,
    });
    setDraftQuestion("");
    setDraftAnswer("");
    setError("");
  };
  const run = async () => {
    setLoading(true);
    setError("");
    try {
      const r = await gen({
        data: {
          grade,
          tableMin: Number(tMin),
          tableMax: Number(tMax),
          theme,
          count,
          op,
          maxNumber,
          focus,
          geometry,
          extendedText,
        },
      });
      if ("error" in r) setError(r.error);
      else {
        setTasks(r.tasks);
        setMeta({ grade, theme, op, focus, geometry, extendedText });
      }
    } catch {
      setError("Något gick fel. Kontrollera inställningarna och försök igen.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="no-print border-b border-border bg-card">
        <div className="mx-auto max-w-6xl px-6 py-4">
          <h1 className="font-display text-2xl font-semibold">Textuppgifter</h1>
          <p className="text-sm text-muted-foreground">
            Problemlösning inom olika matematikområden · A4
          </p>
        </div>
      </header>
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-6 py-6 lg:flex-row lg:items-start">
        <aside className="no-print w-full shrink-0 space-y-5 rounded-xl border border-border bg-card p-5 lg:sticky lg:top-6 lg:w-72">
          <h2 className="font-display text-lg font-semibold">Inställningar</h2>
          <button
            type="button"
            aria-expanded={manualMode}
            onClick={() => {
              setManualMode((value) => !value);
              setError("");
            }}
            className="w-full rounded-lg border border-primary px-4 py-2.5 text-sm font-medium text-primary hover:bg-accent"
          >
            {manualMode ? "Tillbaka till AI-uppgifter" : "Lägg in egna uppgifter"}
          </button>
          {!manualMode ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                run();
              }}
              className="space-y-5"
            >
              <label className="block text-sm font-medium">
                Årskurs
                <select
                  className={`${input} w-auto`}
                  value={grade}
                  onChange={(e) => setGrade(Number(e.target.value))}
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((g) => (
                    <option key={g} value={g}>
                      Åk {g}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm font-medium">
                Fokusområde
                <select
                  className={`${input} w-full`}
                  value={focus}
                  onChange={(e) => setFocus(e.target.value as FocusArea)}
                >
                  {Object.entries(FOCUS_AREAS).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
              {focus === "geometry" && (
                <div className="space-y-2">
                  <label className="block text-sm font-medium">
                    Geometriområde
                    <select
                      className={`${input} w-full`}
                      value={geometry}
                      onChange={(e) => setGeometry(e.target.value as GeometryArea)}
                    >
                      {Object.entries(GEOMETRY_AREAS).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <p className="text-xs text-muted-foreground">
                    {geometry === "plane"
                      ? "Plana figurer, omkrets, area och vinklar."
                      : geometry === "solids"
                        ? "Kroppars egenskaper, sidoytor, kanter och hörn."
                        : geometry === "space"
                          ? "Volym, begränsningsarea och volymenheter."
                          : "Kartor, ritningar, förstoring och förminskning."}
                  </p>
                </div>
              )}
              {focus === "arithmetic" && (
                <>
                  <fieldset>
                    <legend className="mb-2 text-sm font-medium">Räknesätt</legend>
                    <div className="flex flex-wrap gap-1.5">
                      {OPS.map((o) => (
                        <button
                          key={o.v}
                          type="button"
                          aria-pressed={op === o.v}
                          onClick={() => setOp(o.v)}
                          className={`rounded-md border px-2.5 py-1.5 text-sm ${op === o.v ? "border-primary bg-primary text-primary-foreground" : "border-input bg-background hover:bg-accent"}`}
                        >
                          {o.label}
                        </button>
                      ))}
                    </div>
                  </fieldset>
                  {(op === "add" || op === "sub" || op === "all") && (
                    <label className="block text-sm font-medium">
                      Tal upp till (+ och −)
                      <select
                        className={`${input} w-auto`}
                        value={maxNumber}
                        onChange={(e) => setMaxNumber(Number(e.target.value))}
                      >
                        {[10, 20, 100, 1000, 10000].map((n) => (
                          <option key={n} value={n}>
                            {n}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                  {(op === "mul" || op === "div" || op === "all") && (
                    <fieldset>
                      <legend className="mb-2 text-sm font-medium">Multiplikationstabeller</legend>
                      <div className="flex items-end gap-2">
                        <label className="text-sm">
                          Från
                          <input
                            aria-label="Tabell från"
                            className={`${input} w-16 text-center`}
                            type="number"
                            min={0}
                            max={12}
                            required
                            value={tMin}
                            onChange={(e) => setTMin(e.target.value)}
                          />
                        </label>
                        <span className="pb-2">till</span>
                        <label className="text-sm">
                          Till
                          <input
                            aria-label="Tabell till"
                            className={`${input} w-16 text-center`}
                            type="number"
                            min={0}
                            max={12}
                            required
                            value={tMax}
                            onChange={(e) => setTMax(e.target.value)}
                          />
                        </label>
                      </div>
                    </fieldset>
                  )}
                </>
              )}
              <label className="block text-sm font-medium">
                Tema
                <input
                  className={`${input} w-full`}
                  maxLength={80}
                  required
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  placeholder="Ämne/innehåll"
                />
              </label>
              <label className="block text-sm font-medium">
                Antal uppgifter
                <select
                  className={`${input} w-auto`}
                  value={count}
                  onChange={(e) => setCount(Number(e.target.value))}
                >
                  {[4, 5, 6, 7, 8, 10].map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              </label>
              <div>
                <button
                  type="button"
                  aria-pressed={extendedText}
                  onClick={() => setExtendedText((value) => !value)}
                  className={`rounded-md border px-3 py-1.5 text-sm font-medium ${extendedText ? "border-green-700 bg-green-700 text-white hover:bg-green-800" : "border-input bg-background hover:bg-accent"}`}
                >
                  Utökad text
                </button>
                <p className="mt-1 text-xs text-muted-foreground">
                  Lägg till tal som inte behövs för att lösa uppgiften. Skapa nya uppgifter för att
                  använda valet.
                </p>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-lg border border-input bg-background px-4 py-2.5 text-sm font-medium hover:bg-accent disabled:opacity-60"
              >
                <Wand2 className="h-4 w-4" />
                {loading
                  ? "Skapar uppgifter…"
                  : tasks.length
                    ? "Skapa nya uppgifter"
                    : "Skapa uppgifter"}
              </button>
            </form>
          ) : (
            <form onSubmit={addManualTask} className="space-y-4">
              <h3 className="font-medium">Egna uppgifter</h3>
              <p className="text-xs text-muted-foreground">
                Lägg till uppgifter en i taget. De skrivs ut med samma arbetsbladslayout.
              </p>
              <label className="block text-sm font-medium">
                Årskurs
                <select
                  className={`${input} w-auto`}
                  value={manualGrade}
                  onChange={(e) => setManualGrade(Number(e.target.value))}
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((g) => (
                    <option key={g} value={g}>
                      Åk {g}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm font-medium">
                Tema/område
                <input
                  className={`${input} w-full`}
                  maxLength={80}
                  required
                  value={manualTheme}
                  onChange={(e) => setManualTheme(e.target.value)}
                  placeholder="Till exempel bråk eller geometri"
                />
              </label>
              <label className="block text-sm font-medium">
                Uppgift
                <textarea
                  className={`${input} min-h-24 w-full`}
                  maxLength={300}
                  required
                  value={draftQuestion}
                  onChange={(e) => setDraftQuestion(e.target.value)}
                  placeholder="Skriv uppgiftstexten"
                />
              </label>
              <label className="block text-sm font-medium">
                Svar (valfritt)
                <textarea
                  className={`${input} min-h-16 w-full`}
                  maxLength={200}
                  value={draftAnswer}
                  onChange={(e) => setDraftAnswer(e.target.value)}
                  placeholder="Visas bara på facit"
                />
              </label>
              <button
                type="submit"
                className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                Lägg till uppgift
              </button>
              {manualTasks.length > 0 && (
                <div className="space-y-2 border-t border-border pt-3">
                  <p className="text-sm font-medium">Tillagda uppgifter ({manualTasks.length})</p>
                  <ol className="space-y-2">
                    {manualTasks.map((task, index) => (
                      <li
                        key={`${index}-${task.question}`}
                        className="flex items-start justify-between gap-2 text-sm"
                      >
                        <span className="line-clamp-2">
                          {index + 1}. {task.question}
                        </span>
                        <button
                          type="button"
                          aria-label={`Ta bort uppgift ${index + 1}`}
                          onClick={() =>
                            setManualTasks((current) =>
                              current.filter((_, taskIndex) => taskIndex !== index),
                            )
                          }
                          className="shrink-0 rounded px-2 text-destructive hover:bg-accent"
                        >
                          Ta bort
                        </button>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </form>
          )}
          {!manualMode && (
            <p className="text-xs text-muted-foreground">
              Uppgifterna skrivs av AI – läs igenom dem och facit innan utskrift.
            </p>
          )}
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          {layoutError && activeTasks.length > 0 && (
            <p role="alert" className="text-sm text-destructive">
              {layoutError}
            </p>
          )}
          <PrintContentChoice value={content} onChange={setContent} />
          <ZoomControls zoom={zoom} setZoom={setZoom} zoomStep={zoomStep} />
          <div className="space-y-2">
            <button
              disabled={exporting || !activeTasks.length || !layoutReady}
              onClick={downloadPdf}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-input bg-background px-4 py-2.5 text-sm font-medium hover:bg-accent disabled:opacity-60"
            >
              <FileDown className="h-4 w-4" />
              {exporting ? "Skapar förhandsgranskning…" : "Förhandsgranska & ladda ner PDF"}
            </button>
            <button
              disabled={!activeTasks.length || !layoutReady}
              onClick={() => window.print()}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-60"
            >
              <Printer className="h-4 w-4" />
              Skriv ut
            </button>
          </div>
        </aside>
        <main {...mainProps} className="print-area flex min-w-0 flex-1 flex-col items-center gap-8">
          {!activeTasks.length && (
            <p className="no-print mt-10 text-muted-foreground">
              {manualMode
                ? "Lägg till egna uppgifter för att se arbetsbladet."
                : loading
                  ? "Skapar uppgifter – det tar några sekunder…"
                  : "Välj inställningar och klicka på Skapa uppgifter."}
            </p>
          )}
          {activeTasks.length > 0 && (
            <>
              {showSheet(content) && (
                <PaginatedSheets
                  signature={layoutSignature}
                  onStatus={updateSheetStatus}
                  tasks={activeTasks}
                  answers={false}
                  {...activeMeta}
                  opLabel={activeOpLabel}
                  startIndex={0}
                  total={activeTasks.length}
                  titlePrefix={manualMode ? "Egna uppgifter" : "Textuppgifter"}
                />
              )}
              {showKey(content) && (
                <PaginatedSheets
                  signature={layoutSignature}
                  onStatus={updateKeyStatus}
                  tasks={activeTasks}
                  answers
                  {...activeMeta}
                  opLabel={activeOpLabel}
                  startIndex={0}
                  total={activeTasks.length}
                  titlePrefix={manualMode ? "Egna uppgifter" : "Textuppgifter"}
                />
              )}
            </>
          )}
        </main>
      </div>
      {preview && (
        <div
          className="no-print fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-4"
          role="dialog"
          aria-label="Förhandsgranskning av PDF"
          aria-modal="true"
        >
          <div className="flex h-full max-h-[95vh] w-full max-w-4xl flex-col gap-3 rounded-xl bg-background p-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">
                Förhandsgranskning av PDF · {preview.pages} {preview.pages === 1 ? "sida" : "sidor"}
              </h2>
              <button
                onClick={closePreview}
                className="rounded-md px-2 py-1 text-sm hover:bg-accent"
              >
                Stäng
              </button>
            </div>
            <PdfPagesPreview images={preview.images} />
            <div className="flex flex-wrap items-end gap-2">
              <label className="flex-1 text-sm font-medium">
                Filnamn
                <div className="mt-1 flex items-center gap-1">
                  <input
                    className="w-full rounded-md border border-input bg-background px-2 py-1.5"
                    value={fileName}
                    onChange={(e) => setFileName(e.target.value)}
                  />
                  <span>.pdf</span>
                </div>
              </label>
              <button
                onClick={closePreview}
                className="rounded-lg border border-input px-4 py-2 text-sm"
              >
                Avbryt
              </button>
              <button
                onClick={savePreview}
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
              >
                Ladda ner
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
