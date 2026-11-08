/** Gemensamt sidhuvud för alla hela arbetsblad; klippbladet Snabba tal är undantaget.
 *  compact ger ett lägre sidhuvud (används av tät layout, t.ex. 100-rutan 8 rutor per A4). */
export function SheetHeader({
  title,
  subtitle,
  score,
  compact,
}: {
  title: string;
  subtitle: string;
  score: string;
  compact?: boolean;
}) {
  return (
    <div className={`border-b-2 border-sheet-ink ${compact ? "pb-2" : "pb-3"}`}>
      <div className="flex items-baseline justify-between">
        <h2
          className={`font-display font-semibold text-sheet-ink ${compact ? "text-[16px]" : "text-[22px]"}`}
        >
          {title}
        </h2>
        <span
          className={`uppercase tracking-widest text-sheet-muted ${compact ? "text-[10px]" : "text-[12px]"}`}
        >
          {subtitle}
        </span>
      </div>
      <div
        className={`flex items-end text-sheet-ink ${compact ? "mt-1 gap-4 text-[11px]" : "mt-3 gap-6 text-[13px]"}`}
      >
        <Field label="Namn" grow lineEndOffset="40mm" />
        <Field label="Datum" w={compact ? "26mm" : "32mm"} />
        <div className="flex items-end gap-2">
          <span>Poäng:</span>
          <span className="inline-block w-[14mm] border-b border-sheet-ink" />
          <span>{score}</span>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  grow,
  w,
  lineEndOffset,
}: {
  label: string;
  grow?: boolean;
  w?: string;
  lineEndOffset?: string;
}) {
  return (
    <div className={`flex items-end gap-2 ${grow ? "flex-1" : ""}`}>
      <span>{label}:</span>
      <span
        className="inline-block flex-1 border-b border-sheet-ink"
        style={
          w || lineEndOffset
            ? {
                ...(w ? { width: w, flex: "none" } : {}),
                ...(lineEndOffset ? { marginRight: lineEndOffset } : {}),
              }
            : undefined
        }
      />
    </div>
  );
}
