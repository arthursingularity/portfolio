"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Icon } from "@iconify/react";

/**
 * Helper: Converts Hex string to HSV object { h: 0-360, s: 0-1, v: 0-1 }
 */
function hexToHsv(hex) {
  let clean = hex.replace("#", "").trim();
  if (clean.length === 3) {
    clean = clean
      .split("")
      .map((c) => c + c)
      .join("");
  }
  if (clean.length !== 6) {
    return { h: 0, s: 0, v: 0.7 };
  }

  const r = parseInt(clean.substring(0, 2), 16) / 255;
  const g = parseInt(clean.substring(2, 4), 16) / 255;
  const b = parseInt(clean.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;

  let h = 0;
  const s = max === 0 ? 0 : d / max;
  const v = max;

  if (max !== min) {
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h = h / 6;
  }

  return { h: h * 360, s, v };
}

/**
 * Helper: Converts HSV { h: 0-360, s: 0-1, v: 0-1 } to Hex string '#RRGGBB'
 */
function hsvToHex(h, s, v) {
  const normH = ((h % 360) + 360) % 360;
  const c = v * s;
  const x = c * (1 - Math.abs(((normH / 60) % 2) - 1));
  const m = v - c;

  let r1 = 0;
  let g1 = 0;
  let b1 = 0;

  if (normH >= 0 && normH < 60) {
    r1 = c;
    g1 = x;
    b1 = 0;
  } else if (normH >= 60 && normH < 120) {
    r1 = x;
    g1 = c;
    b1 = 0;
  } else if (normH >= 120 && normH < 180) {
    r1 = 0;
    g1 = c;
    b1 = x;
  } else if (normH >= 180 && normH < 240) {
    r1 = 0;
    g1 = x;
    b1 = c;
  } else if (normH >= 240 && normH < 300) {
    r1 = x;
    g1 = 0;
    b1 = c;
  } else {
    r1 = c;
    g1 = 0;
    b1 = x;
  }

  const r = Math.round((r1 + m) * 255);
  const g = Math.round((g1 + m) * 255);
  const b = Math.round((b1 + m) * 255);

  const toHex = (n) =>
    Math.max(0, Math.min(255, n)).toString(16).padStart(2, "0").toUpperCase();
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export default function ColorPicker({ color = "#b0b4b8", onChange }) {
  const [prevColor, setPrevColor] = useState(color);
  const [hsv, setHsv] = useState(() => hexToHsv(color));
  const [inputHex, setInputHex] = useState(() =>
    color.replace("#", "").toUpperCase()
  );
  const [copied, setCopied] = useState(false);

  const satValRef = useRef(null);
  const hueRef = useRef(null);

  // Sincroniza com alterações de cor vindas do pai (presets, undo, etc.)
  if (color && color !== prevColor) {
    setPrevColor(color);
    const parsed = hexToHsv(color);
    setHsv((prev) => ({
      h: parsed.s === 0 ? prev.h : parsed.h,
      s: parsed.s,
      v: parsed.v,
    }));
    setInputHex(color.replace("#", "").toUpperCase());
  }

  // Saturation / Value Drag
  const handleSatValPointerDown = (e) => {
    e.preventDefault();
    const el = satValRef.current;
    if (!el) return;

    const updateFromPointer = (clientX, clientY) => {
      const rect = el.getBoundingClientRect();
      const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
      const y = Math.max(0, Math.min(rect.height, clientY - rect.top));

      const newS = x / rect.width;
      const newV = 1 - y / rect.height;

      setHsv((prev) => {
        const next = { ...prev, s: newS, v: newV };
        const newHex = hsvToHex(next.h, next.s, next.v);
        setInputHex(newHex.replace("#", ""));
        onChange?.(newHex);
        return next;
      });
    };

    updateFromPointer(e.clientX, e.clientY);

    const onPointerMove = (evt) => {
      updateFromPointer(evt.clientX, evt.clientY);
    };

    const onPointerUp = () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  };

  // Hue Slider Drag
  const handleHuePointerDown = (e) => {
    e.preventDefault();
    const el = hueRef.current;
    if (!el) return;

    const updateHueFromPointer = (clientX) => {
      const rect = el.getBoundingClientRect();
      const x = Math.max(0, Math.min(rect.width, clientX - rect.left));
      const newH = (x / rect.width) * 360;

      setHsv((prev) => {
        const next = { ...prev, h: newH };
        const newHex = hsvToHex(next.h, next.s, next.v);
        setInputHex(newHex.replace("#", ""));
        onChange?.(newHex);
        return next;
      });
    };

    updateHueFromPointer(e.clientX);

    const onPointerMove = (evt) => {
      updateHueFromPointer(evt.clientX);
    };

    const onPointerUp = () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  };

  // Hex Text Input
  const handleInputChange = (e) => {
    const raw = e.target.value.replace(/[^0-9a-fA-F]/g, "").slice(0, 6);
    setInputHex(raw.toUpperCase());

    if (raw.length === 6) {
      const fullHex = `#${raw.toUpperCase()}`;
      const newHsv = hexToHsv(fullHex);
      setHsv((prev) => ({
        h: newHsv.s === 0 ? prev.h : newHsv.h,
        s: newHsv.s,
        v: newHsv.v,
      }));
      onChange?.(fullHex);
    }
  };

  const handleInputBlur = () => {
    const currentHex = hsvToHex(hsv.h, hsv.s, hsv.v);
    setInputHex(currentHex.replace("#", ""));
  };

  // Copy Hex to Clipboard
  const handleCopy = () => {
    const fullHex = `#${inputHex}`;
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(fullHex);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const currentHex = hsvToHex(hsv.h, hsv.s, hsv.v);
  const hueColor = `hsl(${hsv.h}, 100%, 50%)`;

  return (
    <div className="w-full bg-[#18181b] border border-white/[0.08] rounded-xl p-2.5 flex flex-col gap-2.5 shadow-xl select-none font-sans">
      {/* ── 1. Área 2D: Saturação & Brilho ── */}
      <div
        ref={satValRef}
        onPointerDown={handleSatValPointerDown}
        className="w-full h-[140px] rounded relative cursor-crosshair overflow-hidden touch-none"
        style={{
          backgroundColor: hueColor,
          backgroundImage: `
            linear-gradient(to top, #000000, transparent),
            linear-gradient(to right, #ffffff, transparent)
          `,
        }}
      >
        {/* Thumb circular da seleção 2D */}
        <div
          className="absolute w-4 h-4 rounded-full border-2 border-white shadow-[0_0_3px_rgba(0,0,0,0.8)] -translate-x-1/2 -translate-y-1/2 pointer-events-none transition-transform"
          style={{
            left: `${hsv.s * 100}%`,
            top: `${(1 - hsv.v) * 100}%`,
            backgroundColor: currentHex,
          }}
        />
      </div>

      {/* ── 2. Slider de Matiz (Hue Rainbow) ── */}
      <div
        ref={hueRef}
        onPointerDown={handleHuePointerDown}
        className="w-full h-2.5 rounded-full relative cursor-pointer touch-none"
        style={{
          background:
            "linear-gradient(to right, #ff0000 0%, #ffff00 17%, #00ff00 33%, #00ffff 50%, #0000ff 67%, #ff00ff 83%, #ff0000 100%)",
        }}
      >
        {/* Thumb circular do Hue */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full border-2 border-white shadow-[0_0_3px_rgba(0,0,0,0.8)] pointer-events-none flex items-center justify-center"
          style={{
            left: `${(hsv.h / 360) * 100}%`,
            backgroundColor: hueColor,
          }}
        />
      </div>

      {/* ── 3. Barra Inferior: Preview, Hex Input, Copiar e Seletor de Formato ── */}
      <div className="bg-[#121214] border border-white/[0.08] rounded-md px-2 py-1.5 flex items-center justify-between gap-1.5">
        {/* Lado Esquerdo: Amostra Circular e Hexadecimal */}
        <div className="flex items-center gap-1.5 min-w-0">
          <div
            className="w-4 h-4 rounded-full shrink-0 border border-white/20 shadow-inner"
            style={{ backgroundColor: currentHex }}
          />
          <span className="text-white/40 font-mono text-xs select-none">#</span>
          <input
            type="text"
            value={inputHex}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            maxLength={6}
            placeholder="FFFFFF"
            className="w-16 bg-transparent text-white font-mono text-xs outline-none uppercase font-medium tracking-wide"
          />
        </div>

        {/* Lado Direito: Botão Copiar e Tag 'Hex' com Chevron */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handleCopy}
            title={copied ? "Copiado!" : "Copiar Hex"}
            className="text-white/40 hover:text-white transition-colors cursor-pointer p-0.5 rounded"
          >
            <Icon
              icon={copied ? "carbon:checkmark" : "carbon:copy"}
              className={`text-[14px] ${copied ? "text-green-400" : ""}`}
            />
          </button>
        </div>
      </div>
    </div>
  );
}
