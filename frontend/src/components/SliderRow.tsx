import { useCallback, useRef } from "react";
import { ThemeTokens, FONTS } from "../lib/theme";

interface Props {
  t: ThemeTokens;
  label: string;
  value: string;
  pct: number;
  onChange?: (pct: number) => void;
  height?: number;
  thumbSize?: number;
}

export function SliderRow({
  t,
  label,
  value,
  pct,
  onChange,
  height = 6,
  thumbSize = 14,
}: Props) {
  const trackRef = useRef<HTMLDivElement | null>(null);

  const updateFromEvent = useCallback(
    (clientX: number) => {
      const el = trackRef.current;
      if (!el || !onChange) return;
      const r = el.getBoundingClientRect();
      const ratio = ((clientX - r.left) / r.width) * 100;
      const clamped = Math.max(0, Math.min(100, ratio));
      onChange(clamped);
    },
    [onChange]
  );

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!onChange) return;
    (e.target as HTMLDivElement).setPointerCapture(e.pointerId);
    updateFromEvent(e.clientX);
    const move = (ev: PointerEvent) => updateFromEvent(ev.clientX);
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontFamily: FONTS.mono,
          fontSize: 10,
          letterSpacing: 1,
          color: t.fgMuted,
          textTransform: "uppercase",
          marginBottom: 6,
        }}
      >
        <span>{label}</span>
        <span style={{ color: t.fg }}>{value}</span>
      </div>
      <div
        ref={trackRef}
        onPointerDown={onPointerDown}
        style={{
          height,
          borderRadius: height / 2,
          background: t.inset,
          boxShadow: t.insetShadow,
          position: "relative",
          cursor: onChange ? "pointer" : "default",
          touchAction: "none",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            width: `${pct}%`,
            borderRadius: height / 2,
            background: t.fg,
          }}
        />
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: `${pct}%`,
            width: thumbSize,
            height: thumbSize,
            borderRadius: thumbSize / 2,
            background: t.raised,
            boxShadow: `0 0 0 1px ${t.borderStrong}, 0 2px 4px rgba(0,0,0,0.2)`,
            transform: "translate(-50%, -50%)",
            pointerEvents: "none",
          }}
        />
      </div>
    </div>
  );
}
