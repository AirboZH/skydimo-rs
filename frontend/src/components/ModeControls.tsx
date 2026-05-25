import { Mode, ModeParams } from "../lib/types";
import { ThemeTokens, FONTS } from "../lib/theme";
import {
  COLORMAPS,
  STRAPS,
  SOLID_PRESETS,
  colorName,
  strapGradient,
} from "../lib/swatches";
import { Icon } from "./Icon";
import { SliderRow } from "./SliderRow";

interface Props {
  t: ThemeTokens;
  mode: Mode | "hook";
  params: ModeParams;
  onParamsChange: (next: ModeParams) => void;
  hookName?: string;
}

const labelStyle = (t: ThemeTokens): React.CSSProperties => ({
  display: "flex",
  justifyContent: "space-between",
  fontFamily: FONTS.mono,
  fontSize: 10,
  letterSpacing: 1,
  color: t.fgMuted,
  textTransform: "uppercase",
  marginBottom: 8,
});

const swatchRing = (t: ThemeTokens, on: boolean): string =>
  on
    ? `0 0 0 2px ${t.bg}, 0 0 0 3.5px ${t.fg}`
    : `inset 0 0 0 1px ${t.borderStrong}`;

export function ModeControls({ t, mode, params, onParamsChange, hookName }: Props) {
  if (mode === "solid") {
    const selected = (params.color ?? "#FFB85C").toUpperCase();
    return (
      <div style={{ padding: "14px 18px 0" }}>
        <div style={labelStyle(t)}>
          <span>Color</span>
          <span style={{ color: t.fg }}>{colorName(selected)}</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: 6 }}>
          {SOLID_PRESETS.map((p) => {
            const on = p.hex.toUpperCase() === selected;
            return (
              <button
                key={p.hex}
                onClick={() => onParamsChange({ ...params, color: p.hex })}
                aria-pressed={on}
                style={{
                  aspectRatio: "1 / 1",
                  borderRadius: 8,
                  background: p.hex,
                  boxShadow: swatchRing(t, on),
                  cursor: "pointer",
                }}
              />
            );
          })}
        </div>
      </div>
    );
  }

  if (mode === "rainbow") {
    const speed = params.speed ?? 0.2;
    const sat = params.sat ?? 88;
    const fps = params.fps ?? 60;
    return (
      <div style={{ padding: "14px 18px 0", display: "flex", flexDirection: "column", gap: 12 }}>
        <SliderRow
          t={t}
          label="Speed"
          value={speed.toFixed(1) + "×"}
          pct={Math.min(100, (speed / 1.5) * 100)}
          onChange={(pct) => onParamsChange({ ...params, speed: (pct / 100) * 1.5 })}
        />
        <SliderRow
          t={t}
          label="Saturation"
          value={sat + "%"}
          pct={sat}
          onChange={(pct) => onParamsChange({ ...params, sat: Math.round(pct) })}
        />
        <SliderRow
          t={t}
          label="FPS"
          value={String(fps)}
          pct={Math.min(100, (fps / 60) * 100)}
          onChange={(pct) =>
            onParamsChange({ ...params, fps: Math.max(10, Math.round((pct / 100) * 60)) })
          }
        />
      </div>
    );
  }

  if (mode === "strap") {
    const idx = params.strap_index ?? 4;
    const current = STRAPS[idx] ?? STRAPS[0];
    const speed = params.speed ?? 0.2;
    return (
      <div style={{ padding: "14px 18px 0" }}>
        <div style={labelStyle(t)}>
          <span>Strap</span>
          <span style={{ color: t.fg }}>{current.name}</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 5 }}>
          {STRAPS.map((s, i) => {
            const on = i === idx;
            return (
              <button
                key={s.id}
                onClick={() => onParamsChange({ ...params, strap_index: i })}
                aria-pressed={on}
                aria-label={s.name}
                style={{
                  aspectRatio: "1 / 1",
                  borderRadius: 7,
                  background: strapGradient(s.stops),
                  boxShadow: swatchRing(t, on),
                  cursor: "pointer",
                }}
              />
            );
          })}
        </div>
        <div style={{ marginTop: 12 }}>
          <SliderRow
            t={t}
            label="Speed"
            value={speed.toFixed(1) + "×"}
            pct={Math.min(100, (speed / 1.5) * 100)}
            onChange={(pct) => onParamsChange({ ...params, speed: (pct / 100) * 1.5 })}
          />
        </div>
      </div>
    );
  }

  if (mode === "colormap") {
    const id = params.colormap_id ?? "3";
    const current = COLORMAPS.find((c) => c.id === id) ?? COLORMAPS[0];
    const speed = params.speed ?? 0.1;
    return (
      <div style={{ padding: "14px 18px 0" }}>
        <div style={labelStyle(t)}>
          <span>Map</span>
          <span style={{ color: t.fg }}>{current.name}</span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 6 }}>
          {COLORMAPS.map((c) => {
            const on = c.id === id;
            return (
              <button
                key={c.id}
                onClick={() => onParamsChange({ ...params, colormap_id: c.id })}
                aria-pressed={on}
                aria-label={c.name}
                style={{
                  aspectRatio: "1 / 1",
                  borderRadius: 8,
                  background: c.bg,
                  boxShadow: swatchRing(t, on),
                  cursor: "pointer",
                }}
              />
            );
          })}
          <div
            title="Custom upload (coming soon)"
            style={{
              aspectRatio: "1 / 1",
              borderRadius: 8,
              border: `1.5px dashed ${t.borderStrong}`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: t.fgMuted,
              cursor: "not-allowed",
            }}
          >
            <Icon name="plus" size={12} />
          </div>
        </div>
        <div style={{ marginTop: 12 }}>
          <SliderRow
            t={t}
            label="Scroll Speed"
            value={speed.toFixed(1) + "×"}
            pct={Math.min(100, (speed / 0.5) * 100)}
            onChange={(pct) => onParamsChange({ ...params, speed: (pct / 100) * 0.5 })}
          />
        </div>
      </div>
    );
  }

  if (mode === "breathe") {
    const selected = (params.color ?? "#FF8A3B").toUpperCase();
    const cycle = params.cycle_s ?? 4;
    const depth = params.depth ?? 80;
    return (
      <div style={{ padding: "14px 18px 0", display: "flex", flexDirection: "column", gap: 12 }}>
        <div>
          <div style={labelStyle(t)}>
            <span>Color</span>
            <span style={{ color: t.fg }}>{colorName(selected)}</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: 6 }}>
            {SOLID_PRESETS.map((p) => {
              const on = p.hex.toUpperCase() === selected;
              return (
                <button
                  key={p.hex}
                  onClick={() => onParamsChange({ ...params, color: p.hex })}
                  aria-pressed={on}
                  style={{
                    aspectRatio: "1 / 1",
                    borderRadius: 8,
                    background: p.hex,
                    boxShadow: swatchRing(t, on),
                    cursor: "pointer",
                  }}
                />
              );
            })}
          </div>
        </div>
        <SliderRow
          t={t}
          label="Cycle"
          value={cycle.toFixed(1) + "s"}
          pct={Math.min(100, (cycle / 8) * 100)}
          onChange={(pct) =>
            onParamsChange({
              ...params,
              cycle_s: Math.max(0.5, (pct / 100) * 8),
            })
          }
        />
        <SliderRow
          t={t}
          label="Depth"
          value={depth + "%"}
          pct={depth}
          onChange={(pct) => onParamsChange({ ...params, depth: Math.round(pct) })}
        />
      </div>
    );
  }

  if (mode === "off") {
    return (
      <div
        style={{
          padding: "14px 18px 0",
          textAlign: "center",
          color: t.fgMuted,
          fontSize: 12,
          lineHeight: 1.6,
        }}
      >
        <div
          style={{
            fontFamily: FONTS.mono,
            fontSize: 10,
            letterSpacing: 1,
            textTransform: "uppercase",
            color: t.fgDim,
            marginBottom: 8,
          }}
        >
          Standby
        </div>
        <div style={{ maxWidth: 240, margin: "0 auto", color: t.fgMuted }}>
          Lights are off. Pick another mode above to resume, or trigger a hook to take over remotely.
        </div>
      </div>
    );
  }

  if (mode === "hook") {
    return (
      <div style={{ padding: "14px 18px 0" }}>
        <div style={labelStyle(t)}>
          <span>Driven by</span>
          <span style={{ color: t.fg }}>{hookName ?? "focus-mode"}</span>
        </div>
        <div
          style={{
            padding: "12px 14px",
            borderRadius: 11,
            background: t.inset,
            boxShadow: t.insetShadow,
            fontFamily: FONTS.mono,
            fontSize: 11,
            color: t.fgMuted,
            lineHeight: 1.5,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: 3,
                background: "#3AC8B0",
                boxShadow: "0 0 6px #3AC8B0",
              }}
            />
            <span style={{ color: t.fg }}>POST /hook/focus</span>
          </div>
          <div>
            last call <span style={{ color: t.fg }}>2s ago</span> · 14 today
          </div>
        </div>
        <div style={{ marginTop: 10, fontSize: 11, color: t.fgMuted, lineHeight: 1.5 }}>
          Hook controls the strip directly. Pick another mode to release.
        </div>
      </div>
    );
  }

  return null;
}
