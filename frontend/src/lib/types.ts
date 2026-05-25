export type Mode = "solid" | "rainbow" | "strap" | "colormap" | "breathe" | "off";

export interface ModeParams {
  color?: string;
  speed?: number;
  sat?: number;
  fps?: number;
  strap_index?: number;
  colormap_id?: string;
  cycle_s?: number;
  depth?: number;
}

export interface StateSnapshot {
  connected: boolean;
  port: string | null;
  n_leds: number | null;
  model: string | null;
  mode: Mode;
  params: ModeParams;
  brightness: number;
  master_on: boolean;
  error: string | null;
}

export interface PortInfo {
  name: string;
  vid: number | null;
  pid: number | null;
  manufacturer: string | null;
  product: string | null;
  is_ch340: boolean;
}

export interface ModelInfo {
  id: string;
  n_leds: number;
  lines: number[];
}

export interface StrapInfo {
  index: number;
  name: string;
  stops: string[];
}

export interface ColorMapInfo {
  id: string;
  name: string;
}
