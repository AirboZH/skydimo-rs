import { Mode, ModeParams, StateSnapshot } from "../lib/types";
import { ThemeTokens, FONTS } from "../lib/theme";
import { HaloRing } from "./HaloRing";
import { HaloCenter } from "./HaloCenter";
import { ModeSegmented } from "./ModeSegmented";
import { ModeControls } from "./ModeControls";
import { Footer } from "./Footer";
import { Notch } from "./Notch";
import { Icon } from "./Icon";

interface Props {
  dark: boolean;
  t: ThemeTokens;
  state: StateSnapshot;
  brightnessOpen: boolean;
  onModeChange: (mode: Mode) => void;
  onParamsChange: (params: ModeParams) => void;
  onBrightnessChange: (value: number) => void;
  onToggleBrightness: () => void;
  onMasterToggle: () => void;
  onOpenSettings: () => void;
}

export function HaloPanel({
  dark,
  t,
  state,
  brightnessOpen,
  onModeChange,
  onParamsChange,
  onBrightnessChange,
  onToggleBrightness,
  onMasterToggle,
  onOpenSettings,
}: Props) {
  // Hook visualization is reserved for future API integration; the design
  // shows it as a non-local mode. Today we only render local modes.
  const visualMode: Mode | "hook" = state.mode;

  return (
    <div
      style={{
        width: 360,
        height: 620,
        position: "relative",
        fontFamily: FONTS.body,
        color: t.fg,
        background: t.bg,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        borderRadius: 18,
        boxShadow: dark
          ? "0 24px 64px rgba(0,0,0,0.55), 0 4px 12px rgba(0,0,0,0.4)"
          : "0 24px 64px rgba(40,30,20,0.28), 0 4px 12px rgba(40,30,20,0.14)",
      }}
    >
      <Notch fill={t.notchFill} offset="86%" size={9} />

      <div
        data-tauri-drag-region
        style={{
          padding: "14px 18px 10px",
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <div
          style={{
            fontFamily: FONTS.display,
            fontSize: 16,
            fontWeight: 500,
            letterSpacing: -0.4,
          }}
        >
          Screenlight
        </div>
        <div
          title={state.connected ? "Connected" : "Not connected"}
          style={{
            width: 4,
            height: 4,
            borderRadius: 2,
            background: state.connected ? "#3AC8B0" : t.fgDim,
            boxShadow: state.connected ? "0 0 6px #3AC8B0" : "none",
            marginLeft: 4,
          }}
        />
        <div style={{ flex: 1 }} />
        <button
          onClick={onMasterToggle}
          aria-pressed={state.master_on}
          aria-label={state.master_on ? "Turn off" : "Turn on"}
          style={{
            width: 28,
            height: 28,
            borderRadius: 14,
            border: `1px solid ${t.borderStrong}`,
            background: state.master_on ? "transparent" : t.chip,
            color: t.fg,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: state.master_on ? 1 : 0.7,
          }}
        >
          <Icon name="power" size={12} />
        </button>
      </div>

      <div
        style={{
          position: "relative",
          height: 218,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 0 10px",
        }}
      >
        <HaloRing dark={dark} t={t} mode={visualMode} params={state.params} />
        <HaloCenter
          t={t}
          mode={visualMode}
          params={state.params}
          brightness={state.brightness}
        />
      </div>

      <ModeSegmented t={t} mode={state.mode} onChange={onModeChange} />

      <ModeControls
        t={t}
        mode={visualMode}
        params={state.params}
        onParamsChange={onParamsChange}
      />

      <div style={{ flex: 1 }} />

      <Footer
        t={t}
        brightness={state.brightness}
        brightnessOpen={brightnessOpen}
        hookActive={false}
        connected={state.connected}
        onBrightnessChange={onBrightnessChange}
        onToggleBrightness={onToggleBrightness}
        onOpenSettings={onOpenSettings}
      />
    </div>
  );
}
