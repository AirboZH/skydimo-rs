interface Props {
  fill: string;
  size?: number;
  offset?: string;
}

export function Notch({ fill, size = 9, offset = "86%" }: Props) {
  return (
    <svg
      style={{
        position: "absolute",
        width: size * 2,
        height: size,
        top: -size,
        left: offset,
        transform: "translateX(-50%)",
        zIndex: 2,
      }}
      width={size * 2}
      height={size}
      viewBox={`0 0 ${size * 2} ${size}`}
    >
      <path d={`M0 ${size}L${size} 0L${size * 2} ${size}Z`} fill={fill} />
    </svg>
  );
}
