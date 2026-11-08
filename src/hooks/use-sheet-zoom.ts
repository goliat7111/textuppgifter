import { useEffect, useRef, useState, type CSSProperties } from "react";

export function calculateSheetFit(
  width: number,
  viewportHeight: number,
  contentTop: number,
  landscape: boolean,
) {
  const pageWidth = landscape ? 297 : 210;
  const pageHeight = landscape ? 210 : 297;
  const availableHeight = Math.max(1, viewportHeight - Math.max(0, contentTop) - 32);
  return Math.max(
    0.01,
    Math.min(1, width / ((pageWidth * 96) / 25.4), availableHeight / ((pageHeight * 96) / 25.4)),
  );
}

/** Skalning av arbetsbladen på skärmen: --fit anpassar efter både sidans bredd och fönstrets höjd,
 *  --zoom är användarens manuella zoom. Påverkar aldrig utskrift eller PDF. */
export function useSheetZoom() {
  const mainRef = useRef<HTMLElement>(null);
  const [fit, setFit] = useState(1);
  const [zoom, setZoom] = useState(1);
  const zoomStep = (dir: number) =>
    setZoom((z) => Math.min(3, Math.max(0.5, Math.round((z + dir * 0.25) * 100) / 100)));
  useEffect(() => {
    const el = mainRef.current;
    if (!el) return;
    const updateFit = () => {
      const rect = el.getBoundingClientRect();
      const width = el.clientWidth || rect.width;
      if (width <= 0) return;
      const page = el.querySelector(".a4-page");
      const landscape = page?.classList.contains("landscape");
      const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
      setFit(calculateSheetFit(width, viewportHeight, rect.top, Boolean(landscape)));
    };
    const ro = new ResizeObserver(updateFit);
    const observer = new MutationObserver(updateFit);
    observer.observe(el, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class"],
    });
    updateFit();
    ro.observe(el);
    window.addEventListener("resize", updateFit);
    window.visualViewport?.addEventListener("resize", updateFit);
    return () => {
      ro.disconnect();
      observer.disconnect();
      window.removeEventListener("resize", updateFit);
      window.visualViewport?.removeEventListener("resize", updateFit);
    };
  }, []);
  const mainProps = {
    ref: mainRef,
    style: { "--fit": fit, "--zoom": zoom } as CSSProperties,
  };
  const changeZoom = (value: number) => {
    setZoom(value);
    if (value === 1)
      requestAnimationFrame(() => {
        const page = mainRef.current?.querySelector(".a4-page");
        if (!page) return;
        const rect = page.getBoundingClientRect();
        if (rect.top < 0 || rect.bottom > window.innerHeight)
          page.scrollIntoView({ block: "start", inline: "nearest" });
      });
  };
  return { mainProps, zoom, setZoom: changeZoom, zoomStep };
}
