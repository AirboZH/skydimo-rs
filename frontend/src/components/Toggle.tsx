import { ThemeTokens } from "../lib/theme";

interface Props {
  t: ThemeTokens;
  on: boolean;
  onChange?: (next: boolean) => void;
}

export function Toggle({ t, on, onChange }: Props) {
  return (
    <button
      onClick={() => onChange?.(!on)}
      aria-pressed={on}
      style={{
        width: 28,
        height: 16,
        borderRadius: 8,
        background: on ? t.fg : t.inset,
        boxShadow: on ? "none" : t.insetShadow,
        position: "relative",
        flexShrink: 0,
        cursor: "pointer",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 2,
          left: on ? 14 : 2,
          width: 12,
          height: 12,
          borderRadius: 6,
          background: on ? t.bg : t.raised,
          transition: "left .15s",
          boxShadow: on ? "none" : `0 0 0 1px ${t.border}`,
        }}
      />
    </button>
  );
}
