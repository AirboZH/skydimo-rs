import { ThemeTokens, FONTS } from "../lib/theme";
import { Icon } from "./Icon";
import { Toggle } from "./Toggle";

interface Props {
  t: ThemeTokens;
  brightness: number;
  brightnessOpen: boolean;
  hookActive: boolean;
  connected: boolean;
  onBrightnessChange: (value: number) => void;
  onToggleBrightness: () => void;
  onOpenSettings: () => void;
}

const QUICK_PICKS = [10, 30, 60, 100];

function BrightnessTrack({
  t,
  brightness,
  onChange,
}: {
  t: ThemeTokens;
  brightness: number;
  onChange: (v: number) => void;
}) {
  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    target.setPointerCapture(e.pointerId);
    const rect = target.getBoundingClientRect();
    const update = (clientX: number) => {
      const ratio = ((clientX - rect.left) / rect.width) * 100;
      onChange(Math.max(0, Math.min(100, Math.round(ratio))));
    };
    update(e.clientX);
    const move = (ev: PointerEvent) => update(ev.clientX);
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
  };

  return (
    <div
      onPointerDown={onPointerDown}
      style={{
        height: 10,
        borderRadius: 5,
        background: t.inset,
        boxShadow: t.insetShadow,
        position: "relative",
        marginBottom: 12,
        cursor: "pointer",
        touchAction: "none",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          width: `${brightness}%`,
          borderRadius: 5,
          background: `linear-gradient(90deg, ${t.fgDim}, ${t.fg})`,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: `${brightness}%`,
          width: 18,
          height: 18,
          borderRadius: 9,
          background: t.raised,
          boxShadow: `0 0 0 1px ${t.borderStrong}, 0 2px 6px rgba(0,0,0,0.25)`,
          transform: "translate(-50%, -50%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          pointerEvents: "none",
        }}
      >
        <Icon name="sun" size={9} color={t.fg} />
      </div>
    </div>
  );
}

export function Footer({
  t,
  brightness,
  brightnessOpen,
  hookActive,
  connected,
  onBrightnessChange,
  onToggleBrightness,
  onOpenSettings,
}: Props) {
  if (brightnessOpen) {
    return (
      <div
        style={{
          borderTop: `1px solid ${t.border}`,
          padding: "14px 18px 16px",
          background: t.panel,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            marginBottom: 10,
          }}
        >
          <div>
            <div
              style={{
                fontFamily: FONTS.mono,
                fontSize: 10,
                letterSpacing: 1,
                color: t.fgMuted,
                textTransform: "uppercase",
              }}
            >
              Brightness
            </div>
            <div
              style={{
                fontFamily: FONTS.display,
                fontSize: 22,
                fontWeight: 500,
                letterSpacing: -0.4,
                lineHeight: 1,
                marginTop: 4,
                color: t.fg,
              }}
            >
              {brightness}
              <span style={{ fontSize: 12, color: t.fgMuted, marginLeft: 4 }}>%</span>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            {QUICK_PICKS.map((p) => {
              const on = p === brightness;
              return (
                <button
                  key={p}
                  onClick={() => onBrightnessChange(p)}
                  aria-pressed={on}
                  style={{
                    padding: "4px 9px",
                    borderRadius: 6,
                    fontFamily: FONTS.mono,
                    fontSize: 10,
                    color: on ? t.fg : t.fgMuted,
                    background: on ? t.chip : "transparent",
                    border: `1px solid ${on ? t.borderStrong : "transparent"}`,
                    cursor: "pointer",
                  }}
                >
                  {p}
                </button>
              );
            })}
          </div>
        </div>
        <BrightnessTrack t={t} brightness={brightness} onChange={onBrightnessChange} />
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <Icon name="moon" size={11} color={t.fgMuted} />
          <span style={{ fontSize: 11, color: t.fgMuted, flex: 1 }}>
            Dim to 20% when display sleeps
          </span>
          <Toggle t={t} on={true} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
          <Icon name="sun" size={11} color={t.fgMuted} />
          <span style={{ fontSize: 11, color: t.fgMuted, flex: 1 }}>
            Match ambient (lux sensor)
          </span>
          <Toggle t={t} on={false} />
        </div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginTop: 10,
            fontFamily: FONTS.mono,
            fontSize: 10,
            color: t.fgDim,
          }}
        >
          <span>applies to all modes</span>
          <button
            onClick={onToggleBrightness}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 4,
              color: t.fgDim,
              cursor: "pointer",
            }}
          >
            collapse
            <span style={{ transform: "rotate(180deg)", display: "inline-block" }}>
              <Icon name="chevron" size={10} color={t.fgDim} />
            </span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        borderTop: `1px solid ${t.border}`,
        padding: "10px 16px 10px 18px",
        display: "flex",
        alignItems: "center",
        gap: 10,
        fontFamily: FONTS.mono,
        fontSize: 10,
        color: t.fgMuted,
      }}
    >
      <Icon name="hook" size={11} color={hookActive ? t.fg : t.fgMuted} />
      {hookActive ? (
        <>
          <span style={{ color: t.fg }}>focus-mode</span>
          <span
            style={{
              width: 5,
              height: 5,
              borderRadius: 2.5,
              background: "#3AC8B0",
              boxShadow: "0 0 6px #3AC8B0",
            }}
          />
        </>
      ) : (
        <span>{connected ? "0 hooks idle" : "not connected"}</span>
      )}
      <div style={{ flex: 1 }} />
      <button
        onClick={onToggleBrightness}
        aria-label="Open brightness panel"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "4px 10px 4px 8px",
          borderRadius: 9,
          background: t.chip,
          boxShadow: `0 0 0 1px ${t.border}`,
          cursor: "pointer",
        }}
      >
        <Icon name="sun" size={11} color={t.fg} />
        <div
          style={{
            width: 56,
            height: 4,
            borderRadius: 2,
            background: t.inset,
            position: "relative",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              width: `${brightness}%`,
              borderRadius: 2,
              background: t.fg,
            }}
          />
        </div>
        <span style={{ color: t.fg, fontSize: 10, minWidth: 22, textAlign: "right" }}>
          {brightness}
        </span>
        <Icon name="chevron" size={9} color={t.fgMuted} />
      </button>
      <button
        onClick={onOpenSettings}
        aria-label="Settings"
        style={{
          width: 22,
          height: 22,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: t.fgMuted,
          cursor: "pointer",
        }}
      >
        <Icon name="settings" size={12} />
      </button>
    </div>
  );
}
