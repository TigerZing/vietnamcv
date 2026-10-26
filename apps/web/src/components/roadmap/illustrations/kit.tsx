/**
 * Shared building blocks for the roadmap illustrations. Every illustration is a pure
 * function of a looping phase `p` in [0, 1), drawn into a 240×150 SVG. Colours are theme
 * tokens, so each drawing follows light and dark mode; `currentColor` is the era hue.
 */

export const VIEW = { width: 240, height: 150 } as const;

export type Illustration = {
  /** Length of one loop in milliseconds. */
  duration?: number;
  /** Phase shown when the reader prefers reduced motion: the most telling still frame. */
  still?: number;
  render: (p: number, uid: string) => React.ReactNode;
};

export const ERA = "currentColor";
export const INK = "var(--foreground)";
export const MUTED = "var(--muted-foreground)";
export const SOFT = "var(--surface-muted)";
export const LINE = "var(--border)";
export const PAPER = "var(--surface)";
export const ACCENT = "var(--accent)";
/** Distinct hues for classes and instances, borrowed from the era palette. */
export const HUES = [
  "var(--era-classical)",
  "var(--era-transformer)",
  "var(--era-features)",
  "var(--era-generative)",
  "var(--era-deep)",
  "var(--era-origins)",
] as const;

export const clamp = (value: number, min = 0, max = 1) =>
  Math.min(max, Math.max(min, value));
/** Linear 0→1 progress of `p` across [from, to]. */
export const ramp = (p: number, from: number, to: number) =>
  clamp((p - from) / (to - from));
export const smooth = (t: number) => t * t * (3 - 2 * t);
/** Eased 0→1 progress of `p` across [from, to]. */
export const step = (p: number, from: number, to: number) =>
  smooth(ramp(p, from, to));
/** Fades in across [a, b] and back out across [c, d]. */
export const pulse = (p: number, a: number, b: number, c: number, d: number) =>
  step(p, a, b) * (1 - step(p, c, d));
export const lerp = (from: number, to: number, t: number) =>
  from + (to - from) * t;
/** Deterministic pseudo-random number in [0, 1) for index `i`. */
export const rand = (i: number) => {
  const x = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
  return x - Math.floor(x);
};
export const TAU = Math.PI * 2;

export function Arrow({
  x1,
  y1,
  x2,
  y2,
  color = MUTED,
  opacity = 1,
  width = 1.5,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color?: string;
  opacity?: number;
  width?: number;
}) {
  const angle = Math.atan2(y2 - y1, x2 - x1);
  const head = 5;
  const left = angle + Math.PI * 0.85;
  const right = angle - Math.PI * 0.85;
  return (
    <g
      stroke={color}
      strokeWidth={width}
      strokeLinecap="round"
      fill="none"
      opacity={opacity}
    >
      <line x1={x1} y1={y1} x2={x2} y2={y2} />
      <path
        d={`M${x2 + Math.cos(left) * head} ${y2 + Math.sin(left) * head} L${x2} ${y2} L${x2 + Math.cos(right) * head} ${y2 + Math.sin(right) * head}`}
      />
    </g>
  );
}

/** Clips its children to a rectangle; `uid` keeps the clip id unique on the page. */
export function ClipRect({
  uid,
  x,
  y,
  w,
  h,
  children,
}: {
  uid: string;
  x: number;
  y: number;
  w: number;
  h: number;
  children: React.ReactNode;
}) {
  const id = `${uid}-clip-${x}-${y}`;
  return (
    <g>
      <clipPath id={id}>
        <rect x={x} y={y} width={w} height={h} rx={6} />
      </clipPath>
      <g clipPath={`url(#${id})`}>{children}</g>
    </g>
  );
}

/** A rounded panel standing for an image or a feature map. */
export function Panel({
  x,
  y,
  w,
  h,
  fill = SOFT,
  stroke = LINE,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  fill?: string;
  stroke?: string;
}) {
  return (
    <rect x={x} y={y} width={w} height={h} rx={6} fill={fill} stroke={stroke} />
  );
}

/** Text-like placeholder bars: words without a language. */
export function Bars({
  x,
  y,
  widths,
  color = MUTED,
  reveal = 1,
  gap = 4,
  height = 4,
}: {
  x: number;
  y: number;
  widths: readonly number[];
  color?: string;
  reveal?: number;
  gap?: number;
  height?: number;
}) {
  const total = widths.reduce((sum, width) => sum + width, 0);
  const budget = total * reveal;
  // Where each bar starts, both along the row and along the reveal budget.
  const starts = widths.map((_, index) =>
    widths.slice(0, index).reduce((sum, width) => sum + width, 0),
  );
  return (
    <g fill={color}>
      {widths.map((width, index) => {
        const shown = clamp(budget - starts[index]!, 0, width);
        return shown > 0 ? (
          <rect
            key={index}
            x={x + starts[index]! + index * gap}
            y={y}
            width={shown}
            height={height}
            rx={height / 2}
          />
        ) : null;
      })}
    </g>
  );
}

/**
 * A small street scene (tree, person, car) in a 110×90 box, reused by the detection and
 * segmentation drawings so the objects stay recognisable from card to card.
 */
export const SCENE = { width: 110, height: 90 } as const;

export type SceneObject = {
  key: "tree" | "person" | "car";
  hue: string;
  box: { x: number; y: number; w: number; h: number };
};

export const SCENE_OBJECTS: readonly SceneObject[] = [
  { key: "tree", hue: HUES[2], box: { x: 4, y: 25, w: 26, h: 42 } },
  { key: "person", hue: HUES[0], box: { x: 41, y: 30, w: 14, h: 36 } },
  { key: "car", hue: HUES[1], box: { x: 62, y: 43, w: 40, h: 28 } },
];

export function SceneObjectShape({
  object,
  fill,
}: {
  object: SceneObject["key"];
  fill?: string;
}) {
  switch (object) {
    case "tree":
      return (
        <g>
          <rect x={14.5} y={44} width={5} height={23} fill={fill ?? MUTED} />
          <circle cx={17} cy={38} r={12.5} fill={fill ?? HUES[2]} />
        </g>
      );
    case "person":
      return (
        <g>
          <circle cx={48} cy={35} r={5} fill={fill ?? INK} />
          <rect
            x={42.5}
            y={41}
            width={11}
            height={25}
            rx={4}
            fill={fill ?? HUES[0]}
          />
        </g>
      );
    case "car":
      return (
        <g>
          <rect
            x={71}
            y={44}
            width={20}
            height={12}
            rx={4}
            fill={fill ?? HUES[1]}
          />
          <rect
            x={62}
            y={53}
            width={40}
            height={13}
            rx={4}
            fill={fill ?? HUES[1]}
          />
          <circle cx={71} cy={67} r={4} fill={fill ?? INK} />
          <circle cx={93} cy={67} r={4} fill={fill ?? INK} />
        </g>
      );
  }
}

/** The scene at (x, y), scaled by `scale`. `objects` dims everything but the given keys. */
export function Scene({
  x,
  y,
  scale = 1,
  children,
  objectOpacity = 1,
  plain = false,
}: {
  x: number;
  y: number;
  scale?: number;
  children?: React.ReactNode;
  objectOpacity?: number;
  /** Draw only the frame and ground, without the objects. */
  plain?: boolean;
}) {
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <rect
        width={SCENE.width}
        height={SCENE.height}
        rx={6}
        fill={SOFT}
        stroke={LINE}
      />
      <rect
        x={0.5}
        y={68}
        width={SCENE.width - 1}
        height={21.5}
        fill={LINE}
        opacity={0.6}
      />
      <circle cx={92} cy={17} r={7} fill={HUES[4]} opacity={0.7} />
      {plain ? null : (
        <g opacity={objectOpacity}>
          {SCENE_OBJECTS.map((object) => (
            <SceneObjectShape key={object.key} object={object.key} />
          ))}
        </g>
      )}
      {children}
    </g>
  );
}

/** Is the point inside one of the scene objects? Returns that object's index or -1. */
export function sceneObjectAt(x: number, y: number): number {
  // Tree crown and trunk.
  if ((x - 17) ** 2 + (y - 38) ** 2 <= 12.5 ** 2) return 0;
  if (x >= 14.5 && x <= 19.5 && y >= 44 && y <= 67) return 0;
  // Person head and body.
  if ((x - 48) ** 2 + (y - 35) ** 2 <= 25) return 1;
  if (x >= 42.5 && x <= 53.5 && y >= 41 && y <= 66) return 1;
  // Car cabin, body and wheels.
  if (x >= 71 && x <= 91 && y >= 44 && y <= 56) return 2;
  if (x >= 62 && x <= 102 && y >= 53 && y <= 66) return 2;
  if ((x - 71) ** 2 + (y - 67) ** 2 <= 16) return 2;
  if ((x - 93) ** 2 + (y - 67) ** 2 <= 16) return 2;
  return -1;
}

/** A simple face whose features move with the given parameters, all around 0. */
export function Face({
  cx,
  cy,
  r,
  eyes = 0,
  mouth = 0,
  smile = 0,
  fill = SOFT,
  ink = INK,
}: {
  cx: number;
  cy: number;
  r: number;
  eyes?: number;
  mouth?: number;
  smile?: number;
  fill?: string;
  ink?: string;
}) {
  const eyeGap = r * (0.36 + eyes * 0.12);
  const mouthHalf = r * (0.3 + mouth * 0.12);
  const curve = r * (0.18 + smile * 0.14);
  return (
    <g>
      <ellipse
        cx={cx}
        cy={cy}
        rx={r * 0.86}
        ry={r}
        fill={fill}
        stroke={ink}
        strokeWidth={1.2}
      />
      <circle cx={cx - eyeGap} cy={cy - r * 0.18} r={r * 0.1} fill={ink} />
      <circle cx={cx + eyeGap} cy={cy - r * 0.18} r={r * 0.1} fill={ink} />
      <path
        d={`M${cx - mouthHalf} ${cy + r * 0.38} Q${cx} ${cy + r * 0.38 + curve} ${cx + mouthHalf} ${cy + r * 0.38}`}
        stroke={ink}
        strokeWidth={1.2}
        fill="none"
        strokeLinecap="round"
      />
    </g>
  );
}

/** A labelled processing block (encoder, generator, …) drawn as a rounded box. */
export function Block({
  x,
  y,
  w,
  h,
  active = 0,
  children,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  active?: number;
  children?: React.ReactNode;
}) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={6}
        fill={PAPER}
        stroke={LINE}
      />
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={6}
        fill={ERA}
        opacity={0.12 + active * 0.35}
      />
      {children}
    </g>
  );
}

/** A dot travelling along a straight segment at progress `t`. */
export function Travel({
  x1,
  y1,
  x2,
  y2,
  t,
  color = ERA,
  r = 3,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  t: number;
  color?: string;
  r?: number;
}) {
  if (t <= 0 || t >= 1) return null;
  return (
    <circle cx={lerp(x1, x2, t)} cy={lerp(y1, y2, t)} r={r} fill={color} />
  );
}
