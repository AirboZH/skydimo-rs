import { useCallback, useEffect, useRef, useState } from "react";
import { HaloPanel } from "./components/HaloPanel";
import { ConnectionPanel } from "./components/ConnectionPanel";
import { darkTheme, lightTheme } from "./lib/theme";
import { ipc } from "./lib/ipc";
import { Mode, ModeParams, StateSnapshot } from "./lib/types";

const DEFAULT_PARAMS_BY_MODE: Record<Mode, ModeParams> = {
  solid: { color: "#FFB85C" },
  rainbow: { speed: 0.2, sat: 88, fps: 60 },
  strap: { strap_index: 4, speed: 0.2 },
  colormap: { colormap_id: "3", speed: 0.1 },
  breathe: { color: "#FF8A3B", cycle_s: 4, depth: 80 },
  off: {},
};

const INITIAL_STATE: StateSnapshot = {
  connected: false,
  port: null,
  n_leds: null,
  model: null,
  mode: "off",
  params: {},
  brightness: 72,
  master_on: true,
  error: null,
};

function useSystemDark(): boolean {
  const [dark, setDark] = useState<boolean>(() =>
    typeof window !== "undefined" && window.matchMedia
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
      : true
  );
  useEffect(() => {
    if (!window.matchMedia) return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const update = (e: MediaQueryListEvent) => setDark(e.matches);
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return dark;
}

export function App() {
  const dark = useSystemDark();
  const t = dark ? darkTheme : lightTheme;

  const [state, setState] = useState<StateSnapshot>(INITIAL_STATE);
  const [brightnessOpen, setBrightnessOpen] = useState(false);
  const [showConnection, setShowConnection] = useState(false);

  // Pull initial state on mount.
  useEffect(() => {
    if (!ipc.inTauri) return;
    ipc.getState().then(setState).catch(() => {
      /* ignore — controller may not be initialized in some dev paths */
    });
  }, []);

  // Auto-open the connection sheet the first time we open the panel without
  // a device. Only inside Tauri — in browser preview we want the Halo visible.
  const openedOnce = useRef(false);
  useEffect(() => {
    if (!ipc.inTauri || openedOnce.current) return;
    if (!state.connected && !state.port) {
      setShowConnection(true);
      openedOnce.current = true;
    }
  }, [state.connected, state.port]);

  const flushTimer = useRef<number | null>(null);

  const pushMode = useCallback(
    (mode: Mode, params: ModeParams) => {
      if (!ipc.inTauri || !state.connected) return;
      if (flushTimer.current) {
        window.clearTimeout(flushTimer.current);
      }
      flushTimer.current = window.setTimeout(() => {
        ipc.setMode(mode, params).then(setState).catch(() => {});
      }, 30);
    },
    [state.connected]
  );

  const onModeChange = useCallback(
    (mode: Mode) => {
      const merged: ModeParams = {
        ...DEFAULT_PARAMS_BY_MODE[mode],
        ...(mode === state.mode ? state.params : {}),
      };
      setState((s) => ({ ...s, mode, params: merged }));
      pushMode(mode, merged);
    },
    [state.mode, state.params, pushMode]
  );

  const onParamsChange = useCallback(
    (params: ModeParams) => {
      setState((s) => ({ ...s, params }));
      pushMode(state.mode, params);
    },
    [state.mode, pushMode]
  );

  const onBrightnessChange = useCallback((value: number) => {
    setState((s) => ({ ...s, brightness: value }));
    if (ipc.inTauri) {
      ipc.setBrightness(value).then(setState).catch(() => {});
    }
  }, []);

  const onToggleBrightness = useCallback(() => {
    setBrightnessOpen((b) => !b);
  }, []);

  const onMasterToggle = useCallback(() => {
    const next = !state.master_on;
    setState((s) => ({ ...s, master_on: next }));
    if (ipc.inTauri) {
      ipc.setMasterSwitch(next).then(setState).catch(() => {});
    }
  }, [state.master_on]);

  const onOpenSettings = useCallback(() => {
    setShowConnection(true);
  }, []);

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "stretch",
        justifyContent: "stretch",
        background: "transparent",
      }}
    >
      <div style={{ position: "relative", width: 360, height: 620 }}>
        <HaloPanel
          dark={dark}
          t={t}
          state={state}
          brightnessOpen={brightnessOpen}
          onModeChange={onModeChange}
          onParamsChange={onParamsChange}
          onBrightnessChange={onBrightnessChange}
          onToggleBrightness={onToggleBrightness}
          onMasterToggle={onMasterToggle}
          onOpenSettings={onOpenSettings}
        />
        {showConnection && (
          <ConnectionPanel
            t={t}
            state={state}
            onClose={() => setShowConnection(false)}
            onState={setState}
          />
        )}
      </div>
    </div>
  );
}
