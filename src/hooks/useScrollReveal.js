"use client";

import { useEffect, useRef } from "react";

/**
 * useScrollReveal — Observes child elements with `data-reveal` attribute
 * and adds `data-revealed` when they enter the viewport.
 *
 * Usage:
 *   const containerRef = useScrollReveal();
 *   <div ref={containerRef}>
 *     <div data-reveal>...</div>
 *     <div data-reveal="delay-200">...</div>
 *   </div>
 *
 * Options via data-reveal attribute value:
 *   - "delay-100" through "delay-1000" — stagger delay
 *   - "from-left" / "from-right" — slide direction
 */
export default function useScrollReveal(options = {}) {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const elements = container.querySelectorAll("[data-reveal]");

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
            observer.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: options.rootMargin || "0px 0px -60px 0px",
        threshold: options.threshold || 0.1,
      }
    );

    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [options.rootMargin, options.threshold]);

  return containerRef;
}
