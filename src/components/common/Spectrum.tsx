// @ts-nocheck
/* @jsxRuntime classic */
import React, { useMemo, useRef, useState } from "react";
import { CenteredColumn, CenteredRow } from "./LayoutElements";
import { GetContrastingColors } from "./GetContrastingColors";
import { GetContrastingText } from "./GetContrastingText";

export function Spectrum(props: {
  spectrumCard: [string, string];
  handleValue?: number;
  targetValue?: number;
  guessingValue?: number;
  onChange?: (newValue: number) => void;
}) {
  const [primary, secondary] = GetContrastingColors(
    getStringHash(props.spectrumCard[0])
  );

  const cardBackStyle: React.CSSProperties = {
    padding: 8,
    fontWeight: "bold",
  };
  const primaryText = GetContrastingText(primary);
  const secondaryText = GetContrastingText(secondary);

  const svgRef = useRef<SVGSVGElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const currentDialValue = useMemo(() => {
    if (props.handleValue !== undefined) {
      return props.handleValue;
    }
    if (props.guessingValue !== undefined) {
      return props.guessingValue;
    }
    return undefined;
  }, [props.handleValue, props.guessingValue]);

  const size = 260; // view size in px
  const centerX = size / 2;
  const centerY = size * 0.9; // lower to give space above
  const radius = size * 0.42;

  // Map values [0..20] to angles along the TOP semicircle [180..0]
  const angleForValue = (value: number) => 180 - (value / 20) * 180;
  // Convert a screen point to value along the top semicircle. Ignore events outside top half.
  const valueForPoint = (clientX: number, clientY: number) => {
    const svg = svgRef.current;
    if (!svg) return undefined;
    const rect = svg.getBoundingClientRect();
    // Convert client (CSS pixel) coordinates to SVG viewBox coordinates
    const scaleX = size / rect.width;
    const scaleY = size / rect.height;
    const svgX = (clientX - rect.left) * scaleX;
    const svgY = (clientY - rect.top) * scaleY;
    const dx = svgX - centerX;
    const dy = svgY - centerY;
    // Angle relative to positive X axis, with Y inverted so 0=right, 180=left, only top half yields 0..180
    const theta = Math.atan2(-dy, dx);
    const deg = (theta * 180) / Math.PI; // deg in (-180..180]
    if (deg < 0 || deg > 180) {
      return undefined; // outside top semicircle
    }
    const ratio = (180 - deg) / 180; // 0 at left, 1 at right
    return Math.max(0, Math.min(20, Math.round(ratio * 20)));
  };

  const toRadians = (angle: number) => (angle * Math.PI) / 180;
  const polarToCartesian = (angle: number, r: number) => {
    const rad = toRadians(angle);
    return {
      x: centerX + r * Math.cos(rad),
      y: centerY - r * Math.sin(rad),
    };
  };

  const arcPath = (startAngle: number, endAngle: number, r: number) => {
    const start = polarToCartesian(startAngle, r);
    const end = polarToCartesian(endAngle, r);
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
  };

  const handlePointer = (clientX: number, clientY: number) => {
    if (!props.onChange) return;
    const v = valueForPoint(clientX, clientY);
    if (v === undefined) return;
    props.onChange(v);
  };

  const dialAngle = currentDialValue !== undefined ? angleForValue(currentDialValue) : undefined;

  // Build target spectrum segments (2, 3, 4 points) around targetValue
  const targetSegments = useMemo(() => {
    if (props.targetValue === undefined) {
      return [] as Array<{ start: number; end: number; color: string; points: number }>;
    }

    const center = props.targetValue;
    const boundaries = [
      center - 2.5,
      center - 1.5,
      center - 0.5,
      center + 0.5,
      center + 1.5,
      center + 2.5,
    ].map((v) => Math.max(-0.5, Math.min(20.5, v)));

    const colors = {
      two: "#FDD835", // 2 points
      three: "#FB8C00", // 3 points
      four: "#E53935", // 4 points (center)
    };

    const segments: Array<{ start: number; end: number; color: string; points: number }> = [];
    // Left outer (2 points)
    segments.push({ start: boundaries[0], end: boundaries[1], color: colors.two, points: 2 });
    // Left middle (3 points)
    segments.push({ start: boundaries[1], end: boundaries[2], color: colors.three, points: 3 });
    // Center (4 points)
    segments.push({ start: boundaries[2], end: boundaries[3], color: colors.four, points: 4 });
    // Right middle (3 points)
    segments.push({ start: boundaries[3], end: boundaries[4], color: colors.three, points: 3 });
    // Right outer (2 points)
    segments.push({ start: boundaries[4], end: boundaries[5], color: colors.two, points: 2 });

    return segments
      .filter((s) => s.end > s.start)
      .map((s) => ({
        start: angleForValue(s.start),
        end: angleForValue(s.end),
        color: s.color,
        points: s.points,
      }));
  }, [props.targetValue]);

  const backgroundGradientId = useMemo(() => `grad-${primary.replace("#", "")}-${secondary.replace("#", "")}`,[primary, secondary]);

  return (
    <div style={{ padding: 8 }}>
      <CenteredColumn style={{ alignItems: "stretch" }}>
        <div style={{ padding: "16px 16px" }}>
          <svg
            ref={svgRef}
            width="100%"
            height={size}
            viewBox={`0 0 ${size} ${size}`}
            style={{ touchAction: props.onChange ? "none" : undefined, cursor: props.onChange ? (isDragging ? "grabbing" : "grab") : "default" }}
            onPointerDown={(e: React.PointerEvent<SVGSVGElement>) => {
              setIsDragging(true);
              handlePointer(e.clientX, e.clientY);
            }}
            onPointerMove={(e: React.PointerEvent<SVGSVGElement>) => {
              if (isDragging) {
                handlePointer(e.clientX, e.clientY);
              }
            }}
            onPointerUp={() => setIsDragging(false)}
            onPointerLeave={() => setIsDragging(false)}
            tabIndex={props.onChange ? 0 : -1}
            onKeyDown={(e: React.KeyboardEvent<SVGSVGElement>) => {
              if (!props.onChange) return;
              if (e.key === "ArrowLeft") {
                const next = Math.max(0, (currentDialValue ?? 10) - 1);
                props.onChange(next);
              } else if (e.key === "ArrowRight") {
                const next = Math.min(20, (currentDialValue ?? 10) + 1);
                props.onChange(next);
              }
            }}
          >
            <defs>
              <linearGradient id={backgroundGradientId} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor={primary} />
                <stop offset="100%" stopColor={secondary} />
              </linearGradient>
            </defs>

            {/* Base semi-circle (top arc) */}
            <path
              d={arcPath(180, 0, radius)}
              fill="none"
              stroke={`url(#${backgroundGradientId})`}
              strokeWidth={14}
              strokeLinecap="round"
              opacity={0.35}
            />

            {/* Target spectrum segments */
            {targetSegments.map((seg: { start: number; end: number; color: string }, idx: number) => (
              <path
                key={`seg-${idx}`}
                d={arcPath(seg.start, seg.end, radius)}
                fill="none"
                stroke={seg.color}
                strokeWidth={22}
                strokeLinecap="butt"
                opacity={0.9}
              />
            ))}

            {/* Point labels over segments */}
            {targetSegments.map(
              (
                seg: { start: number; end: number; color: string; points: number },
                idx: number
              ) => {
                const midAngle = (seg.start + seg.end) / 2;
                // Position the label roughly centered on the stroke
                const labelPos = polarToCartesian(midAngle, radius);
                const textColor = GetContrastingText(seg.color);
                return (
                  <text
                    key={`seg-label-${idx}`}
                    x={labelPos.x}
                    y={labelPos.y}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fontWeight="bold"
                    fontSize={14}
                    fill={textColor}
                    style={{ pointerEvents: "none" }}
                  >
                    {seg.points}
                  </text>
                );
              }
            )}

            {/* Dial center */}
            <circle cx={centerX} cy={centerY} r={18} fill="#D32F2F" />

            {/* Guess dial */}
            {dialAngle !== undefined && (
              <g>
                <path
                  d={`M ${centerX} ${centerY} L ${polarToCartesian(dialAngle, radius + 6).x} ${polarToCartesian(dialAngle, radius + 6).y}`}
                  stroke="#4DB6AC"
                  strokeWidth={10}
                  strokeLinecap="round"
                  fill="none"
                />
              </g>
            )}
          </svg>
        </div>
        <CenteredRow style={{ justifyContent: "space-between" }}>
          <div style={{ ...cardBackStyle, backgroundColor: primary, color: primaryText }}>
            {props.spectrumCard[0]}
          </div>
          <div style={{ ...cardBackStyle, backgroundColor: secondary, color: secondaryText }}>
            {props.spectrumCard[1]}
          </div>
        </CenteredRow>
      </CenteredColumn>
    </div>
  );
}

function getStringHash(value: string) {
  let acc = 0;
  for (let i = 0; i < value.length; i++) {
    acc += value.charCodeAt(i);
  }
  return acc;
}
