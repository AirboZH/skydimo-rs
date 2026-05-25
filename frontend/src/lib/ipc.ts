import { invoke } from "@tauri-apps/api/core";
import type {
  ColorMapInfo,
  Mode,
  ModeParams,
  ModelInfo,
  PortInfo,
  StateSnapshot,
  StrapInfo,
} from "./types";

// In dev (vite) we may render outside Tauri; the bridge gracefully no-ops then.
const inTauri = typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

async function call<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
  if (!inTauri) {
    throw new Error(`IPC '${cmd}' called outside Tauri runtime`);
  }
  return invoke<T>(cmd, args);
}

export const ipc = {
  inTauri,
  listPorts: () => call<PortInfo[]>("list_ports"),
  listModels: () => call<ModelInfo[]>("list_models"),
  listStraps: () => call<StrapInfo[]>("list_straps"),
  listColormaps: () => call<ColorMapInfo[]>("list_colormaps"),
  connect: (port: string | null, nLeds: number, model: string | null) =>
    call<StateSnapshot>("connect", { port, nLeds, model }),
  disconnect: () => call<StateSnapshot>("disconnect"),
  getState: () => call<StateSnapshot>("get_state"),
  setMode: (mode: Mode, params: ModeParams) =>
    call<StateSnapshot>("set_mode", { mode, params }),
  setBrightness: (value: number) =>
    call<StateSnapshot>("set_brightness", { value }),
  setMasterSwitch: (on: boolean) =>
    call<StateSnapshot>("set_master_switch", { on }),
  quit: () => call<void>("quit_app"),
};
