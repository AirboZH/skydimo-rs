import { ReactNode } from "react";

export type IconName =
  | "power"
  | "chevron"
  | "plus"
  | "upload"
  | "settings"
  | "sun"
  | "moon"
  | "spark"
  | "bolt"
  | "drop"
  | "check"
  | "grid"
  | "pulse"
  | "hook"
  | "palette"
  | "waves"
  | "info";

interface IconProps {
  name: IconName;
  size?: number;
  stroke?: number;
  color?: string;
}

const PATHS: Record<IconName, ReactNode> = {
  power: (
    <>
      <path d="M12 2v9" />
      <path d="M5.5 6.5a8 8 0 1 0 13 0" />
    </>
  ),
  chevron: <path d="M5 8l4 4 4-4" />,
  plus: (
    <>
      <path d="M9 3v12" />
      <path d="M3 9h12" />
    </>
  ),
  upload: (
    <>
      <path d="M9 11V3" />
      <path d="M5 7l4-4 4 4" />
      <path d="M3 13h12" />
    </>
  ),
  settings: (
    <>
      <circle cx="9" cy="9" r="2.4" />
      <path d="M9 1v2M9 15v2M1 9h2M15 9h2M3.6 3.6l1.4 1.4M13 13l1.4 1.4M3.6 14.4L5 13M13 5l1.4-1.4" />
    </>
  ),
  sun: (
    <>
      <circle cx="9" cy="9" r="3" />
      <path d="M9 1.5v2M9 14.5v2M1.5 9h2M14.5 9h2M3.6 3.6l1.4 1.4M13 13l1.4 1.4M3.6 14.4L5 13M13 5l1.4-1.4" />
    </>
  ),
  moon: <path d="M14.5 11A6 6 0 0 1 7 3.5a6 6 0 1 0 7.5 7.5z" />,
  spark: (
    <>
      <path d="M9 1.5v4M9 12.5v4M1.5 9h4M12.5 9h4" />
      <path d="M9 6.5l1 1.5L11.5 9 10 10l-1 1.5L8 10 6.5 9 8 8z" />
    </>
  ),
  bolt: <path d="M10 1L3 10h5l-1 7 7-9H9l1-7z" />,
  drop: <path d="M9 1.5s5 6 5 9.5a5 5 0 1 1-10 0c0-3.5 5-9.5 5-9.5z" />,
  check: <path d="M3 9l4 4 8-9" />,
  grid: (
    <>
      <rect x="2" y="2" width="5" height="5" rx="1" />
      <rect x="11" y="2" width="5" height="5" rx="1" />
      <rect x="2" y="11" width="5" height="5" rx="1" />
      <rect x="11" y="11" width="5" height="5" rx="1" />
    </>
  ),
  pulse: <path d="M1 9h4l2-5 4 10 2-5h4" />,
  hook: (
    <>
      <path d="M11 2v6a3 3 0 0 1-6 0" />
      <circle cx="11" cy="2" r="1.4" />
    </>
  ),
  palette: (
    <>
      <path d="M9 1.5a7.5 7.5 0 1 0 5 13.1c.7-.7.4-1.6-.5-1.8l-1.5-.4c-1.2-.3-1.6-1.6-.7-2.5L13 8a3 3 0 0 0-2-5.4A7.5 7.5 0 0 0 9 1.5z" />
      <circle cx="5.5" cy="7" r="1" />
      <circle cx="5.5" cy="11" r="1" />
      <circle cx="9" cy="13.5" r="1" />
    </>
  ),
  waves: (
    <>
      <path d="M1 6c2 0 2-2 4-2s2 2 4 2 2-2 4-2 2 2 4 2" />
      <path d="M1 11c2 0 2-2 4-2s2 2 4 2 2-2 4-2 2 2 4 2" />
    </>
  ),
  info: (
    <>
      <circle cx="9" cy="9" r="7" />
      <path d="M9 8.5v4M9 5.5v.5" />
    </>
  ),
};

export function Icon({ name, size = 14, stroke = 1.6, color = "currentColor" }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 18 18"
      fill="none"
      stroke={color}
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {PATHS[name]}
    </svg>
  );
}
