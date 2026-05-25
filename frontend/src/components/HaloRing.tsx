import { CSSProperties } from "react";
import { Mode, ModeParams } from "../lib/types";
import { ThemeTokens } from "../lib/theme";
import { COLORMAPS, STRAPS, withAlpha } from "../lib/swatches";

interface Props {
  dark: boolean;
  t: ThemeTokens;
  mode: Mode | "hook";
  params: ModeParams;
  hookColor?: string;
}

const RING_SIZE = 200;
const INNER_SIZE = 156;

export function HaloRing({ dark, t, mode, params, hookColor = "#5B7CFF" }: Props) {
  let ringBg = "transparent";
  let glowColor = "transparent";

  if (mode === "solid") {
    const c = params.color ?? "#FFB85C";
    ringBg = c;
    glowColor = c;
  } else if (mode === "rainbow") {
    ringBg =
      "conic-gradient(from 0deg, #FF3B5B, #FF8A3B, #F2D74E, #5BD17A, #3AC8E8, #5B7CFF, #B265FF, #FF3B5B)";
    glowColor = "#B265FF";
  } else if (mode === "strap") {
    const idx = params.strap_index ?? 4;
    const strap = STRAPS[idx] ?? STRAPS[0];
    const stops = [...strap.stops, ...strap.stops.slice().reverse(), strap.stops[0]];
    ringBg = `conic-gradient(from 0deg, ${stops.join(", ")})`;
    glowColor = strap.stops[Math.floor(strap.stops.length / 2)];
  } else if (mode === "colormap") {
    const id = params.colormap_id ?? "3";
    const cm = COLORMAPS.find((c) => c.id === id) ?? COLORMAPS[0];
    ringBg = cm.bg;
    glowColor = "#5B7CFF";
  } else if (mode === "breathe") {
    const c = params.color ?? "#FF8A3B";
    ringBg = `radial-gradient(circle, ${c} 0%, ${c} 40%, ${withAlpha(c, 0)} 75%)`;
    glowColor = c;
  } else if (mode === "hook") {
    ringBg = `conic-gradient(from 0deg, ${hookColor}, ${withAlpha(
      hookColor,
      0.4
    )}, ${hookColor})`;
    glowColor = hookColor;
  }

  const off = mode === "off";
  const breathe = mode === "breathe";

  const wrapStyle: CSSProperties = {
    position: "relative",
    width: RING_SIZE,
    height: RING_SIZE,
  };

  const ringStyle: CSSProperties = {
    position: "absolute",
    inset: 0,
    borderRadius: "50%",
    background: ringBg,
    opacity: off ? 1 : breathe ? 0.95 : 1,
    boxShadow: off ? `inset 0 0 0 1px ${t.borderStrong}` : "none",
  };

  const innerStyle: CSSProperties = {
    position: "absolute",
    inset: (RING_SIZE - INNER_SIZE) / 2,
    borderRadius: "50%",
    background: t.haloBg,
    boxShadow: `inset 0 2px 8px rgba(0,0,0,${dark ? 0.7 : 0.18}), 0 0 0 1px ${
      t.haloRing
    }`,
  };

  const ticks = Array.from({ length: 60 }).map((_, i) => {
    const a = (i / 60) * Math.PI * 2 - Math.PI / 2;
    const r1 = i % 5 === 0 ? 92 : 93;
    const r2 = 96;
    const x1 = 100 + Math.cos(a) * r1;
    const y1 = 100 + Math.sin(a) * r1;
    const x2 = 100 + Math.cos(a) * r2;
    const y2 = 100 + Math.sin(a) * r2;
    return (
      <line
        key={i}
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={off ? t.fgDim : "#fff"}
        strokeOpacity={off ? 0.35 : i % 5 === 0 ? 0.7 : 0.35}
        strokeWidth={i % 5 === 0 ? 1.5 : 1}
      />
    );
  });

  return (
    <div style={wrapStyle}>
      {!off && (
        <div
          style={{
            position: "absolute",
            inset: -20,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${withAlpha(
              glowColor,
              t.glowAlpha
            )} 0%, transparent 65%)`,
            pointerEvents: "none",
          }}
        />
      )}
      <div style={ringStyle} />
      {off && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "50%",
            border: `1px dashed ${t.borderStrong}`,
            opacity: 0.5,
          }}
        />
      )}
      <div style={innerStyle} />
      <svg viewBox="0 0 200 200" style={{ position: "absolute", inset: 0, pointerEvents: "none" }}>
        {ticks}
      </svg>
    </div>
  );
}
