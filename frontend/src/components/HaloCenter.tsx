import { Mode, ModeParams } from "../lib/types";
import { ThemeTokens, FONTS } from "../lib/theme";
import { COLORMAPS, STRAPS, colorName } from "../lib/swatches";
import { Icon } from "./Icon";

interface Props {
  t: ThemeTokens;
  mode: Mode | "hook";
  params: ModeParams;
  brightness: number;
  hookName?: string;
}

export function HaloCenter({ t, mode, params, brightness, hookName = "focus-mode" }: Props) {
  const eyebrow = (() => {
    if (mode === "solid") return "Solid";
    if (mode === "rainbow") return "Rainbow";
    if (mode === "strap") return "Color Strap";
    if (mode === "colormap") return "ColorMap";
    if (mode === "breathe") return "Breathe";
    if (mode === "hook") return "Hook · running";
    return "Standby";
  })();

  const title = (() => {
    if (mode === "solid") return colorName(params.color ?? "#FFB85C");
    if (mode === "rainbow") return "Rainbow";
    if (mode === "strap") {
      const s = STRAPS[params.strap_index ?? 4] ?? STRAPS[0];
      return s.name;
    }
    if (mode === "colormap") {
      const c = COLORMAPS.find((c) => c.id === (params.colormap_id ?? "3")) ?? COLORMAPS[0];
      return c.name;
    }
    if (mode === "breathe") return "Breathe";
    if (mode === "hook") return hookName;
    return "Off";
  })();

  const sub = (() => {
    if (mode === "solid") return `${(params.color ?? "#FFB85C").toUpperCase()} · ${brightness}%`;
    if (mode === "rainbow")
      return `${params.fps ?? 60} fps · ${(params.speed ?? 0.2).toFixed(1)}×`;
    if (mode === "strap") return `${(params.speed ?? 0.2).toFixed(1)}× · ${brightness}%`;
    if (mode === "colormap") return `${(params.speed ?? 0.1).toFixed(1)}× · ${brightness}%`;
    if (mode === "breathe") return `${(params.cycle_s ?? 4).toFixed(1)}s · ${brightness}%`;
    if (mode === "hook") return `via api · ${brightness}%`;
    return "lights off";
  })();

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "0 28px",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          fontFamily: FONTS.mono,
          fontSize: 9,
          letterSpacing: 1.4,
          color: t.fgMuted,
          textTransform: "uppercase",
        }}
      >
        {eyebrow}
      </div>
      <div
        style={{
          fontFamily: FONTS.display,
          fontSize: title.length > 9 ? 24 : 30,
          fontWeight: 500,
          letterSpacing: -0.6,
          marginTop: 2,
          lineHeight: 1.05,
          color: t.fg,
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontFamily: FONTS.mono,
          fontSize: 10,
          color: t.fgMuted,
          marginTop: 6,
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        {mode !== "off" && <Icon name={mode === "breathe" ? "pulse" : "bolt"} size={10} />}
        <span>{sub}</span>
      </div>
    </div>
  );
}
