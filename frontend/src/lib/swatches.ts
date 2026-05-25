// Design-time swatches used to render thumbnails. The real animation lives in
// the Rust controller — these are visual previews only.

export interface StrapSwatch {
  id: string;
  name: string;
  stops: string[];
}

export const STRAPS: StrapSwatch[] = [
  { id: "aurora", name: "Aurora", stops: ["#7CFFCB", "#74F2CE", "#5EE2D6", "#3CB1E5", "#3973F4", "#6E4BFF"] },
  { id: "sunset", name: "Sunset", stops: ["#FFB199", "#FF8A70", "#FF5E62", "#E94560", "#9B2D5C"] },
  { id: "lagoon", name: "Lagoon", stops: ["#0FA5C0", "#23C9D6", "#5BE3D2", "#8FF0C2", "#D6FA9B"] },
  { id: "ember", name: "Ember", stops: ["#FFD15C", "#FFA94D", "#FF6F3C", "#E03E2E", "#A11A2A"] },
  { id: "orchid", name: "Orchid", stops: ["#FF8FCB", "#E160C9", "#A24CD4", "#5B41E0", "#283AA8"] },
  { id: "mono", name: "Mono", stops: ["#0F0F12", "#3B3B44", "#777783", "#BFBFC9", "#F2F2F4"] },
  { id: "forest", name: "Forest", stops: ["#0F4C2C", "#1F7A3F", "#5BB870", "#B8E6A8", "#F2F0CD"] },
  { id: "coral", name: "Coral", stops: ["#FFE9D6", "#FFB997", "#FF7E6B", "#E84855", "#7E1B41"] },
  { id: "glacier", name: "Glacier", stops: ["#E5F4FF", "#9EC8E8", "#5A8FB8", "#2F557A", "#0F1B2D"] },
  { id: "mango", name: "Mango", stops: ["#FFF089", "#FFD05A", "#FF9A2E", "#F25F1B", "#A82A0F"] },
  { id: "plum", name: "Plum", stops: ["#FCE6F2", "#E6A8D2", "#A24CB1", "#562B85", "#1B1240"] },
  { id: "mint", name: "Mint Cream", stops: ["#F4FFF8", "#C8F2DA", "#7DD8AE", "#3AAE82", "#0F5E47"] },
  { id: "midnight", name: "Midnight", stops: ["#0A0E27", "#1A2A6C", "#2E4FB0", "#5B8DEF", "#A5C7FF"] },
  { id: "rose", name: "Rose Gold", stops: ["#F8E2DA", "#F2B5A7", "#D88575", "#9F4B47", "#3F1D24"] },
  { id: "cyber", name: "Cyber", stops: ["#06FFCB", "#0AE3FF", "#5C5CFF", "#B440FF", "#FF40A0"] },
];

export interface ColorMapSwatch {
  id: string;
  name: string;
  bg: string;
}

export const COLORMAPS: ColorMapSwatch[] = [
  { id: "3", name: "Flow",   bg: "linear-gradient(110deg, #FF6B9D 0%, #C06CFF 30%, #5B7CFF 60%, #2EE8C5 100%)" },
  { id: "4", name: "Bands",  bg: "repeating-linear-gradient(90deg, #FF7A59 0 14px, #FFB663 14px 28px, #5BD4C5 28px 42px, #5B7CFF 42px 56px)" },
  { id: "5", name: "Cells",  bg: "radial-gradient(circle at 25% 30%, #FFB85C 0 18%, transparent 40%), radial-gradient(circle at 75% 70%, #FF5E8A 0 18%, transparent 40%), radial-gradient(circle at 50% 50%, #5B7CFF 0 30%, #1A1F3D 70%)" },
  { id: "6", name: "Aurora", bg: "linear-gradient(180deg, #0E1130 0%, #1A2B6E 30%, #2E7DB8 60%, #5BE3A5 90%, #C8F58F 100%)" },
  { id: "7", name: "Noise",  bg: "conic-gradient(from 45deg at 50% 50%, #FF6B9D, #FFB663, #5BE3A5, #5B7CFF, #B265FF, #FF6B9D)" },
  { id: "8", name: "Rings",  bg: "repeating-radial-gradient(circle at 50% 50%, #1A1F3D 0 8px, #5B7CFF 8px 14px, #FF5E8A 14px 22px, #FFB85C 22px 28px)" },
];

export interface SolidPreset {
  hex: string;
  name: string;
}

export const SOLID_PRESETS: SolidPreset[] = [
  { hex: "#F5EDE2", name: "Cream" },
  { hex: "#FFB85C", name: "Amber" },
  { hex: "#FF5E62", name: "Coral" },
  { hex: "#E94560", name: "Ruby" },
  { hex: "#B265FF", name: "Orchid" },
  { hex: "#5B7CFF", name: "Cobalt" },
  { hex: "#3AC8E8", name: "Aqua" },
  { hex: "#2EE8B0", name: "Mint" },
];

export function strapGradient(stops: string[]): string {
  return `linear-gradient(90deg, ${stops
    .map((c, i) => `${c} ${((i / (stops.length - 1)) * 100).toFixed(1)}%`)
    .join(", ")})`;
}

export function withAlpha(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function colorName(hex: string): string {
  const found = SOLID_PRESETS.find(
    (p) => p.hex.toUpperCase() === hex.toUpperCase()
  );
  return found ? found.name : hex.toUpperCase();
}
