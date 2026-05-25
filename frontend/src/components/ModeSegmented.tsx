import { Mode } from "../lib/types";
import { ThemeTokens } from "../lib/theme";
import { Icon, IconName } from "./Icon";

interface Item {
  id: Mode;
  icon: IconName;
}

const ITEMS: Item[] = [
  { id: "solid", icon: "drop" },
  { id: "rainbow", icon: "palette" },
  { id: "strap", icon: "waves" },
  { id: "colormap", icon: "grid" },
  { id: "breathe", icon: "pulse" },
  { id: "off", icon: "power" },
];

interface Props {
  t: ThemeTokens;
  mode: Mode | null;
  onChange: (mode: Mode) => void;
}

export function ModeSegmented({ t, mode, onChange }: Props) {
  const idx = mode ? ITEMS.findIndex((m) => m.id === mode) : -1;
  const safeIdx = idx < 0 ? 0 : idx;
  return (
    <div
      style={{
        margin: "0 18px",
        padding: 4,
        borderRadius: 14,
        background: t.inset,
        boxShadow: t.insetShadow,
        display: "flex",
        position: "relative",
      }}
    >
      {idx >= 0 && (
        <div
          style={{
            position: "absolute",
            top: 4,
            bottom: 4,
            left: `calc(4px + ${safeIdx} * ((100% - 8px) / ${ITEMS.length}))`,
            width: `calc((100% - 8px) / ${ITEMS.length})`,
            borderRadius: 11,
            background: t.raised,
            boxShadow: t.raisedShadow,
            transition: "left .25s cubic-bezier(.5,1.5,.4,1)",
            pointerEvents: "none",
          }}
        />
      )}
      {ITEMS.map((m) => {
        const on = m.id === mode;
        return (
          <button
            key={m.id}
            onClick={() => onChange(m.id)}
            aria-label={m.id}
            aria-pressed={on}
            style={{
              flex: 1,
              height: 36,
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: on ? t.fg : t.fgMuted,
              transition: "color .2s ease",
            }}
          >
            <Icon name={m.icon} size={15} />
          </button>
        );
      })}
    </div>
  );
}
