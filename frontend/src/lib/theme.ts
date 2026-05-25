// Token sheet derived from panel-halo-v2.jsx — pixel-equivalent to the design.

export interface ThemeTokens {
  bg: string;
  panel: string;
  border: string;
  borderStrong: string;
  fg: string;
  fgMuted: string;
  fgDim: string;
  chip: string;
  chipActive: string;
  inset: string;
  insetShadow: string;
  raised: string;
  raisedShadow: string;
  notchFill: string;
  haloBg: string;
  haloRing: string;
  glowAlpha: number;
}

export const darkTheme: ThemeTokens = {
  bg: "#141318",
  panel: "#1B1A22",
  border: "rgba(255,255,255,0.06)",
  borderStrong: "rgba(255,255,255,0.14)",
  fg: "#F4F3F8",
  fgMuted: "#9B98A6",
  fgDim: "#5A5766",
  chip: "#22212A",
  chipActive: "#2C2A36",
  inset: "#0E0D12",
  insetShadow:
    "inset 0 2px 4px rgba(0,0,0,0.55), inset 0 -1px 0 rgba(255,255,255,0.03)",
  raised: "#2A2832",
  raisedShadow:
    "0 1px 0 rgba(255,255,255,0.06) inset, 0 6px 12px rgba(0,0,0,0.5)",
  notchFill: "#141318",
  haloBg: "#0E0D12",
  haloRing: "rgba(255,255,255,0.04)",
  glowAlpha: 0.55,
};

export const lightTheme: ThemeTokens = {
  bg: "#F2EFE9",
  panel: "#FFFCF4",
  border: "rgba(60,40,20,0.08)",
  borderStrong: "rgba(60,40,20,0.20)",
  fg: "#221E18",
  fgMuted: "#7A715F",
  fgDim: "#B5AB97",
  chip: "#EAE5DA",
  chipActive: "#FFFFFF",
  inset: "#E2DDD0",
  insetShadow:
    "inset 0 2px 4px rgba(60,40,20,0.10), inset 0 -1px 0 rgba(255,255,255,0.6)",
  raised: "#FFFFFF",
  raisedShadow:
    "0 1px 0 rgba(255,255,255,0.95) inset, 0 -1px 0 rgba(0,0,0,0.04) inset, 0 4px 10px rgba(60,40,20,0.10)",
  notchFill: "#F2EFE9",
  haloBg: "#E6E1D5",
  haloRing: "rgba(60,40,20,0.04)",
  glowAlpha: 0.3,
};

export const FONTS = {
  body: '"Inter", -apple-system, BlinkMacSystemFont, system-ui, sans-serif',
  display: '"Fraunces", "Iowan Old Style", Georgia, serif',
  mono: '"JetBrains Mono", "SF Mono", ui-monospace, monospace',
};
