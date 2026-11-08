/** Visar PDF:ens sidor som bilder — fungerar i alla webbläsare, även där
 *  inbäddade PDF-visare blockeras. */
export function PdfPagesPreview({ images }: { images: string[] }) {
  return (
    <div className="min-h-0 flex-1 overflow-auto rounded-md border border-input bg-muted p-4">
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-4">
        {images.map((src, i) => (
          <figure key={i} className="w-full">
            <img
              src={src}
              alt={`Sida ${i + 1} av ${images.length}`}
              className="w-full bg-background shadow-md"
            />
            <figcaption className="mt-1 text-center text-xs text-muted-foreground">
              Sida {i + 1} av {images.length}
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}
