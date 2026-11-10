"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

const reduceMotion = "(prefers-reduced-motion: reduce)";

export function ExperimentScrollMotion() {
  const pathname = usePathname();

  useEffect(() => {
    const path = pathname;
    if (!path || path === "/") return;
    const preference = window.matchMedia(reduceMotion);
    let dispose: (() => void) | undefined;
    let frame = 0;
    let revision = 0;

    function sync() {
      const current = ++revision;
      cancelAnimationFrame(frame);
      dispose?.();
      dispose = undefined;
      if (preference.matches) return;

      frame = requestAnimationFrame(() => {
        void import("./experiment-scroll-presets").then(({ startScrollMotion }) => {
          if (current === revision) dispose = startScrollMotion(path);
        }).catch(() => {
          // Motion is progressive enhancement. The original page stays visible.
        });
      });
    }

    preference.addEventListener("change", sync);
    sync();

    return () => {
      ++revision;
      cancelAnimationFrame(frame);
      dispose?.();
      preference.removeEventListener("change", sync);
    };
  }, [pathname]);

  return null;
}
