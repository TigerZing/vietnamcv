import {
  ACCENT,
  Arrow,
  Block,
  ERA,
  Face,
  HUES,
  INK,
  type Illustration,
  LINE,
  lerp,
  MUTED,
  PAPER,
  Panel,
  pulse,
  rand,
  ramp,
  Scene,
  SCENE_OBJECTS,
  sceneObjectAt,
  SceneObjectShape,
  SOFT,
  step,
  TAU,
  Travel,
} from "./kit";

/** A small filter slides over the image; each position becomes one value of a feature map. */
export const convolution: Illustration = {
  duration: 6000,
  still: 0.6,
  render: (p) => {
    const size = 7;
    const cell = 11;
    const digit = (c: number, r: number) =>
      (r === 1 && c >= 1 && c <= 5) ||
      (c === 5 - Math.floor((r - 1) / 1.6) && r >= 1 && r <= 5);
    const outSize = 5;
    const reached = Math.min(
      outSize * outSize - 1,
      Math.floor(ramp(p, 0, 0.7) * outSize * outSize),
    );
    const kc = reached % outSize;
    const kr = Math.floor(reached / outSize);
    const response = (c: number, r: number) => {
      let total = 0;
      for (let dy = 0; dy < 3; dy++)
        for (let dx = 0; dx < 3; dx++) total += digit(c + dx, r + dy) ? 1 : 0;
      return total / 4;
    };
    const classify = step(p, 0.75, 0.9);
    return (
      <g>
        {Array.from({ length: size * size }, (_, index) => {
          const c = index % size;
          const r = Math.floor(index / size);
          return (
            <rect
              key={index}
              x={10 + c * cell}
              y={36 + r * cell}
              width={cell - 1}
              height={cell - 1}
              rx={1}
              fill={digit(c, r) ? INK : SOFT}
            />
          );
        })}
        <rect
          x={10 + kc * cell - 1}
          y={36 + kr * cell - 1}
          width={cell * 3 + 1}
          height={cell * 3 + 1}
          rx={2}
          fill={ERA}
          fillOpacity={0.2}
          stroke={ERA}
          strokeWidth={2}
        />
        <line
          x1={10 + (kc + 3) * cell}
          y1={36 + kr * cell}
          x2={104 + kc * 10}
          y2={46 + kr * 10}
          stroke={ERA}
          strokeWidth={1}
          opacity={0.6}
        />
        <line
          x1={10 + (kc + 3) * cell}
          y1={36 + (kr + 3) * cell}
          x2={104 + kc * 10}
          y2={55 + kr * 10}
          stroke={ERA}
          strokeWidth={1}
          opacity={0.6}
        />
        {Array.from({ length: outSize * outSize }, (_, index) => {
          const c = index % outSize;
          const r = Math.floor(index / outSize);
          return (
            <rect
              key={index}
              x={104 + c * 10}
              y={46 + r * 10}
              width={9}
              height={9}
              rx={1}
              fill={ERA}
              opacity={
                index <= reached
                  ? 0.15 + Math.min(1, response(c, r)) * 0.85
                  : 0.06
              }
            />
          );
        })}
        {[0, 1, 2].map((layer) => (
          <rect
            key={layer}
            x={166 + layer * 6}
            y={50 + layer * 6}
            width={22}
            height={22}
            rx={2}
            fill={ERA}
            opacity={0.25 + layer * 0.2}
          />
        ))}
        <Arrow x1={160} y1={70} x2={164} y2={70} />
        {[0.2, 0.9, 0.35].map((score, index) => (
          <rect
            key={index}
            x={206}
            y={50 + index * 12}
            width={4 + score * 24 * classify}
            height={8}
            rx={2}
            fill={index === 1 ? ERA : MUTED}
          />
        ))}
      </g>
    );
  },
};

/** The error at the output flows backwards and nudges every weight that caused it. */
export const backprop: Illustration = {
  duration: 5000,
  still: 0.7,
  render: (p) => {
    const layers = [3, 4, 4, 2];
    const node = (layer: number, index: number) => ({
      x: 34 + layer * 58,
      y: 75 + (index - (layers[layer]! - 1) / 2) * 28,
    });
    const forward = ramp(p, 0.05, 0.45) * 3;
    const backward = ramp(p, 0.55, 0.95) * 3;
    const error = pulse(p, 0.45, 0.5, 0.55, 0.62);
    return (
      <g>
        {layers.slice(0, -1).flatMap((count, layer) =>
          Array.from({ length: count }, (_, a) =>
            Array.from({ length: layers[layer + 1]! }, (_, b) => {
              const from = node(layer, a);
              const to = node(layer + 1, b);
              const back = clampUnit(backward - (2 - layer));
              const weight =
                0.8 +
                rand(layer * 31 + a * 7 + b) * 1.6 +
                (back > 0.99 ? rand(a + b + layer) * 1.4 : 0);
              const fwd = clampUnit(forward - layer);
              return (
                <g key={`${layer}-${a}-${b}`}>
                  <line
                    x1={from.x}
                    y1={from.y}
                    x2={to.x}
                    y2={to.y}
                    stroke={LINE}
                    strokeWidth={weight}
                  />
                  <Travel
                    x1={from.x}
                    y1={from.y}
                    x2={to.x}
                    y2={to.y}
                    t={fwd}
                    r={2.2}
                  />
                  <Travel
                    x1={to.x}
                    y1={to.y}
                    x2={from.x}
                    y2={from.y}
                    t={back}
                    color={ACCENT}
                    r={2.2}
                  />
                </g>
              );
            }),
          ),
        )}
        {layers.flatMap((count, layer) =>
          Array.from({ length: count }, (_, index) => {
            const { x, y } = node(layer, index);
            return (
              <circle
                key={`${layer}-${index}`}
                cx={x}
                cy={y}
                r={7}
                fill={PAPER}
                stroke={layer === 3 && error > 0 ? ACCENT : ERA}
                strokeWidth={2}
              />
            );
          }),
        )}
        <circle
          cx={node(3, 0).x}
          cy={node(3, 0).y}
          r={7 + error * 6}
          fill={ACCENT}
          opacity={error * 0.5}
        />
      </g>
    );
  },
};

function clampUnit(value: number) {
  return Math.min(1, Math.max(0, value));
}

/** The image is squeezed through a narrow code and rebuilt from it. */
export const autoencoder: Illustration = {
  duration: 5000,
  still: 0.85,
  render: (p) => {
    const encode = ramp(p, 0.05, 0.4);
    const decode = ramp(p, 0.5, 0.85);
    const sample = { x: Math.cos(p * TAU) * 5, y: Math.sin(p * TAU) * 5 };
    const pixel = (index: number) =>
      ((index % 6) - 2.5) ** 2 + (Math.floor(index / 6) - 2.5) ** 2 < 6;
    return (
      <g>
        {Array.from({ length: 36 }, (_, index) => (
          <rect
            key={index}
            x={10 + (index % 6) * 8}
            y={51 + Math.floor(index / 6) * 8}
            width={7}
            height={7}
            fill={pixel(index) ? INK : SOFT}
          />
        ))}
        <path
          d="M66 40 L104 62 L104 88 L66 110 Z"
          fill={ERA}
          opacity={0.2 + encode * 0.3}
        />
        <circle cx={120} cy={75} r={12} fill={ERA} opacity={0.15} />
        <circle cx={120 + sample.x} cy={75 + sample.y} r={4} fill={ERA} />
        <path
          d="M136 62 L174 40 L174 110 L136 88 Z"
          fill={ERA}
          opacity={0.2 + decode * 0.3}
        />
        {Array.from({ length: 36 }, (_, index) => (
          <rect
            key={index}
            x={182 + (index % 6) * 8}
            y={51 + Math.floor(index / 6) * 8}
            width={7}
            height={7}
            fill={pixel(index) ? INK : SOFT}
            opacity={index / 36 < decode ? 0.85 : 0.08}
          />
        ))}
        <Travel x1={60} y1={75} x2={112} y2={75} t={encode} />
        <Travel x1={128} y1={75} x2={180} y2={75} t={decode} />
      </g>
    );
  },
};

/** Thousands of labelled images pour in: the fuel that made learning from data possible. */
export const datasetGrid: Illustration = {
  duration: 5000,
  still: 0.9,
  render: (p) => {
    const cols = 9;
    const rows = 5;
    const filled = Math.floor(ramp(p, 0, 0.8) * cols * rows);
    const labelled = Math.floor(ramp(p, 0.1, 0.9) * cols * rows);
    return (
      <g>
        {Array.from({ length: cols * rows }, (_, index) => {
          const x = 12 + (index % cols) * 24;
          const y = 12 + Math.floor(index / cols) * 24;
          const kind = Math.floor(rand(index) * 3);
          const hue = HUES[kind]!;
          return (
            <g key={index} opacity={index < filled ? 1 : 0.15}>
              <rect
                x={x}
                y={y}
                width={21}
                height={21}
                rx={3}
                fill={SOFT}
                stroke={LINE}
              />
              {kind === 0 ? (
                <circle cx={x + 10.5} cy={y + 10.5} r={6} fill={hue} />
              ) : kind === 1 ? (
                <rect
                  x={x + 4}
                  y={y + 7}
                  width={13}
                  height={8}
                  rx={2}
                  fill={hue}
                />
              ) : (
                <path
                  d={`M${x + 10.5} ${y + 4} L${x + 17} ${y + 16} L${x + 4} ${y + 16} Z`}
                  fill={hue}
                />
              )}
              {index < labelled ? (
                <rect
                  x={x}
                  y={y}
                  width={21}
                  height={21}
                  rx={3}
                  fill="none"
                  stroke={hue}
                  strokeWidth={1.8}
                />
              ) : null}
            </g>
          );
        })}
        <rect x={12} y={136} width={213} height={6} rx={3} fill={SOFT} />
        <rect
          x={12}
          y={136}
          width={213 * ramp(p, 0, 0.9) ** 2}
          height={6}
          rx={3}
          fill={ERA}
        />
      </g>
    );
  },
};

/** Many photos from many viewpoints are combined into one 3D point cloud and the cameras. */
export const multiView: Illustration = {
  duration: 6000,
  still: 0.9,
  render: (p) => {
    const building = Array.from({ length: 28 }, (_, index) => {
      const t = index / 28;
      const side = Math.floor(t * 4);
      const u = (t * 4) % 1;
      const corners = [
        [86, 98],
        [86, 58],
        [120, 36],
        [154, 58],
        [154, 98],
      ];
      const a = corners[side]!;
      const b = corners[side + 1]!;
      return {
        x: lerp(a[0]!, b[0]!, u) + (rand(index) - 0.5) * 3,
        y: lerp(a[1]!, b[1]!, u) + (rand(index + 3) - 0.5) * 3,
      };
    });
    const cameras = [
      { x: 30, y: 128 },
      { x: 22, y: 50 },
      { x: 120, y: 140 },
      { x: 214, y: 50 },
      { x: 210, y: 128 },
    ];
    const reveal = ramp(p, 0.05, 0.85);
    const active = Math.floor(p * 20) % cameras.length;
    return (
      <g>
        {cameras.map((camera, index) => {
          const angle = Math.atan2(70 - camera.y, 120 - camera.x);
          return (
            <g key={index}>
              {index === active
                ? building
                    .filter((_, i) => i % 4 === index % 4 && i / 28 < reveal)
                    .map((point, i) => (
                      <line
                        key={i}
                        x1={camera.x}
                        y1={camera.y}
                        x2={point.x}
                        y2={point.y}
                        stroke={ERA}
                        strokeWidth={0.8}
                        opacity={0.5}
                      />
                    ))
                : null}
              <g
                transform={`translate(${camera.x} ${camera.y}) rotate(${(angle * 180) / Math.PI})`}
              >
                <path
                  d="M6 0 L-8 -7 L-8 7 Z"
                  fill={index === active ? ERA : INK}
                />
              </g>
            </g>
          );
        })}
        {building.map((point, index) => (
          <circle
            key={index}
            cx={point.x}
            cy={point.y}
            r={2.6}
            fill={HUES[index % 3]}
            opacity={index / 28 < reveal ? 1 : 0}
          />
        ))}
      </g>
    );
  },
};

const SKELETON: [number, number][] = [
  [0, 1],
  [1, 2],
  [2, 3],
  [1, 4],
  [4, 5],
  [1, 6],
  [6, 7],
  [7, 8],
  [6, 9],
  [9, 10],
];

function joints(t: number, cx: number, cy: number, scale: number) {
  const wave = Math.sin(t * TAU);
  const hop = Math.abs(Math.sin(t * TAU)) * 6;
  return [
    [0, -42], // head
    [0, -30], // neck
    [-14 - wave * 2, -18 + wave * 14], // left elbow
    [-20 - wave * 4, -4 + wave * 24 - (wave > 0 ? 40 * wave : 0)], // left hand
    [14, -18], // right elbow
    [24 + wave * 4, -30 - wave * 12], // right hand
    [0, 0], // hip
    [-9, 18], // left knee
    [-11, 36], // left foot
    [9, 18], // right knee
    [11, 36], // right foot
  ].map(([x, y]) => ({ x: cx + x! * scale, y: cy + (y! - hop) * scale }));
}

/** The body is found as a set of joints and the limbs between them, in every frame. */
export const pose: Illustration = {
  duration: 3000,
  still: 0.25,
  render: (p) => (
    <g>
      <Panel x={14} y={8} w={212} h={134} />
      {[
        { cx: 82, cy: 84, scale: 1.25, offset: 0, hue: ERA },
        { cx: 168, cy: 92, scale: 0.95, offset: 0.4, hue: ACCENT },
      ].map((person, index) => {
        const points = joints(
          (p + person.offset) % 1,
          person.cx,
          person.cy,
          person.scale,
        );
        return (
          <g key={index}>
            {SKELETON.map(([a, b]) => (
              <line
                key={`${a}-${b}`}
                x1={points[a]!.x}
                y1={points[a]!.y}
                x2={points[b]!.x}
                y2={points[b]!.y}
                stroke={person.hue}
                strokeWidth={3}
                strokeLinecap="round"
              />
            ))}
            <circle
              cx={points[0]!.x}
              cy={points[0]!.y}
              r={7 * person.scale}
              fill={PAPER}
              stroke={person.hue}
              strokeWidth={2.5}
            />
            {points.slice(1).map((point, i) => (
              <circle key={i} cx={point.x} cy={point.y} r={3} fill={INK} />
            ))}
          </g>
        );
      })}
    </g>
  ),
};

const PROPOSALS = Array.from({ length: 12 }, (_, index) => ({
  x: 8 + rand(index) * 70,
  y: 8 + rand(index + 20) * 40,
  w: 18 + rand(index + 40) * 30,
  h: 18 + rand(index + 60) * 30,
}));

/** Candidate regions are proposed, then each is classified and its box refined. */
export const regionProposals: Illustration = {
  duration: 5500,
  still: 0.9,
  render: (p) => {
    const proposed = Math.floor(ramp(p, 0.02, 0.3) * PROPOSALS.length);
    const fade = step(p, 0.4, 0.55);
    const refine = step(p, 0.45, 0.75);
    return (
      <Scene x={10} y={10} scale={1.42}>
        {PROPOSALS.slice(0, proposed).map((box, index) => (
          <rect
            key={index}
            x={box.x}
            y={box.y}
            width={box.w}
            height={box.h}
            fill="none"
            stroke={MUTED}
            strokeWidth={0.8}
            strokeDasharray="2 2"
            opacity={1 - fade}
          />
        ))}
        {SCENE_OBJECTS.map((object, index) => {
          const start = PROPOSALS[index * 3]!;
          const box = {
            x: lerp(start.x, object.box.x, refine),
            y: lerp(start.y, object.box.y, refine),
            w: lerp(start.w, object.box.w, refine),
            h: lerp(start.h, object.box.h, refine),
          };
          return (
            <g key={object.key} opacity={step(p, 0.3, 0.42)}>
              <rect
                x={box.x}
                y={box.y}
                width={box.w}
                height={box.h}
                fill="none"
                stroke={object.hue}
                strokeWidth={1.6}
              />
              <rect
                x={box.x}
                y={box.y - 6}
                width={16 * refine}
                height={6}
                fill={object.hue}
              />
            </g>
          );
        })}
      </Scene>
    );
  },
};

/** One pass over a grid: every cell predicts the boxes whose centre falls inside it. */
export const gridDetection: Illustration = {
  duration: 4000,
  still: 0.8,
  render: (p) => {
    const sweep = ramp(p, 0.1, 0.35);
    const boxes = step(p, 0.38, 0.5);
    return (
      <Scene x={10} y={10} scale={1.42}>
        {Array.from({ length: 5 }, (_, index) => (
          <line
            key={`v${index}`}
            x1={(index + 1) * 18.3}
            y1={0}
            x2={(index + 1) * 18.3}
            y2={90}
            stroke={INK}
            strokeWidth={0.4}
            opacity={0.4}
          />
        ))}
        {Array.from({ length: 4 }, (_, index) => (
          <line
            key={`h${index}`}
            x1={0}
            y1={(index + 1) * 18}
            x2={110}
            y2={(index + 1) * 18}
            stroke={INK}
            strokeWidth={0.4}
            opacity={0.4}
          />
        ))}
        <rect
          x={0}
          y={0}
          width={110 * sweep}
          height={90}
          fill={ERA}
          opacity={sweep > 0 && sweep < 1 ? 0.15 : 0}
        />
        {SCENE_OBJECTS.map((object) => {
          const cx = object.box.x + object.box.w / 2;
          const cy = object.box.y + object.box.h / 2;
          const col = Math.floor(cx / 18.3);
          const row = Math.floor(cy / 18);
          return (
            <g key={object.key}>
              <rect
                x={col * 18.3}
                y={row * 18}
                width={18.3}
                height={18}
                fill={object.hue}
                opacity={boxes * 0.35}
              />
              <circle cx={cx} cy={cy} r={1.6} fill={INK} opacity={boxes} />
              <rect
                x={cx - (object.box.w / 2) * boxes}
                y={cy - (object.box.h / 2) * boxes}
                width={object.box.w * boxes}
                height={object.box.h * boxes}
                fill="none"
                stroke={object.hue}
                strokeWidth={1.6}
              />
            </g>
          );
        })}
      </Scene>
    );
  },
};

/** Faces become points in a space where the same person always lands close together. */
export const faceEmbedding: Illustration = {
  duration: 5000,
  still: 0.85,
  render: (p) => {
    const train = step(p, 0.1, 0.8);
    const faces = [
      { who: 0, angle: 0.4, eyes: 0.4, mouth: 0 },
      { who: 0, angle: 0.4, eyes: 0.5, mouth: 0.3 },
      { who: 1, angle: 2.4, eyes: -0.6, mouth: 1 },
      { who: 1, angle: 2.4, eyes: -0.5, mouth: 0.7 },
      { who: 2, angle: 4.3, eyes: 1, mouth: -0.8 },
      { who: 2, angle: 4.3, eyes: 0.9, mouth: -0.6 },
    ];
    return (
      <g>
        {faces.map((face, index) => (
          <Face
            key={index}
            cx={24 + (index % 2) * 34}
            cy={28 + Math.floor(index / 2) * 46}
            r={14}
            eyes={face.eyes}
            mouth={face.mouth}
            ink={HUES[face.who]}
          />
        ))}
        <Arrow x1={94} y1={75} x2={112} y2={75} />
        <circle cx={174} cy={75} r={52} fill={PAPER} stroke={LINE} />
        {[0.4, 2.4, 4.3].map((angle, who) => (
          <path
            key={who}
            d={`M174 75 L${174 + Math.cos(angle - 0.35) * 52} ${75 + Math.sin(angle - 0.35) * 52} A52 52 0 0 1 ${174 + Math.cos(angle + 0.35) * 52} ${75 + Math.sin(angle + 0.35) * 52} Z`}
            fill={HUES[who]}
            opacity={train * 0.18}
          />
        ))}
        {faces.map((face, index) => {
          const start = rand(index + 4) * TAU;
          const angle = lerp(
            start,
            face.angle + (index % 2 ? 0.08 : -0.08),
            train,
          );
          return (
            <circle
              key={index}
              cx={174 + Math.cos(angle) * 44}
              cy={75 + Math.sin(angle) * 44}
              r={5}
              fill={HUES[face.who]}
            />
          );
        })}
      </g>
    );
  },
};

/** Several filter sizes look at the same input side by side; their outputs are stacked. */
export const inception: Illustration = {
  duration: 3500,
  still: 0.5,
  render: (p) => {
    const t = ramp(p, 0, 0.9);
    const branches = [
      { y: 24, size: 8 },
      { y: 58, size: 16 },
      { y: 92, size: 24 },
      { y: 126, size: 12 },
    ];
    return (
      <g>
        <Block
          x={10}
          y={58}
          w={34}
          h={34}
          active={pulse(p, 0, 0.05, 0.15, 0.25)}
        />
        {branches.map((branch, index) => (
          <g key={index}>
            <path
              d={`M44 75 C 70 75, 70 ${branch.y}, 96 ${branch.y}`}
              fill="none"
              stroke={LINE}
              strokeWidth={2}
            />
            <rect
              x={110 - branch.size / 2}
              y={branch.y - branch.size / 2}
              width={branch.size}
              height={branch.size}
              rx={2}
              fill={index === 3 ? MUTED : HUES[index]}
              opacity={0.4 + pulse(t, 0.3, 0.4, 0.55, 0.65) * 0.6}
            />
            <path
              d={`M124 ${branch.y} C 150 ${branch.y}, 150 75, 176 75`}
              fill="none"
              stroke={LINE}
              strokeWidth={2}
            />
            <circle
              cx={lerp(44, 96, ramp(t, 0.05, 0.3))}
              cy={lerp(75, branch.y, ramp(t, 0.05, 0.3))}
              r={3}
              fill={ERA}
              opacity={t > 0.05 && t < 0.3 ? 1 : 0}
            />
            <circle
              cx={lerp(124, 176, ramp(t, 0.6, 0.8))}
              cy={lerp(branch.y, 75, ramp(t, 0.6, 0.8))}
              r={3}
              fill={ERA}
              opacity={t > 0.6 && t < 0.8 ? 1 : 0}
            />
          </g>
        ))}
        {[0, 1, 2, 3].map((index) => (
          <rect
            key={index}
            x={182 + index * 12}
            y={58}
            width={10}
            height={34}
            rx={2}
            fill={index === 3 ? MUTED : HUES[index]}
            opacity={0.35 + step(t, 0.8, 0.95) * 0.65}
          />
        ))}
      </g>
    );
  },
};

/** Activations that drift between layers are re-centred and re-scaled every batch. */
export const batchNorm: Illustration = {
  duration: 4500,
  still: 0.85,
  render: (p) => {
    const t = step(p, 0.15, 0.75);
    const mean = lerp(62, 0, t);
    const spread = lerp(36, 18, t);
    const curve = (center: number, width: number, height: number) =>
      Array.from({ length: 81 }, (_, index) => {
        const x = -100 + index * 2.5;
        const y = Math.exp(-(((x - center) / width) ** 2) / 2) * height;
        return `${index === 0 ? "M" : "L"}${120 + x} ${124 - y}`;
      }).join(" ");
    return (
      <g>
        <line
          x1={14}
          y1={124}
          x2={226}
          y2={124}
          stroke={LINE}
          strokeWidth={1.5}
        />
        <line
          x1={120}
          y1={18}
          x2={120}
          y2={128}
          stroke={LINE}
          strokeDasharray="3 3"
        />
        <path
          d={curve(62, 36, 46)}
          fill="none"
          stroke={MUTED}
          strokeWidth={1.5}
          strokeDasharray="4 3"
        />
        <path
          d={`${curve(mean, spread, lerp(46, 92, t))} L220 124 L20 124 Z`}
          fill={ERA}
          opacity={0.18}
        />
        <path
          d={curve(mean, spread, lerp(46, 92, t))}
          fill="none"
          stroke={ERA}
          strokeWidth={2.5}
        />
        <circle cx={120 + mean} cy={128} r={4} fill={ERA} />
      </g>
    );
  },
};

/** The image is shrunk to understand it, then grown back with skip links to keep detail. */
export const unet: Illustration = {
  duration: 5000,
  still: 0.9,
  render: (p) => {
    const levels = [
      { x: 18, y: 18, h: 40 },
      { x: 48, y: 52, h: 28 },
      { x: 78, y: 82, h: 18 },
      { x: 108, y: 108, h: 12 },
    ];
    const down = ramp(p, 0.02, 0.4) * 3;
    const up = ramp(p, 0.45, 0.85) * 3;
    const mask = step(p, 0.85, 0.95);
    return (
      <g>
        {levels.slice(0, 3).map((level, index) => (
          <g key={index}>
            <line
              x1={level.x + 14}
              y1={level.y + level.h / 2}
              x2={218 - (level.x - 18) - 14}
              y2={level.y + level.h / 2}
              stroke={ACCENT}
              strokeWidth={1.5}
              strokeDasharray="4 3"
              opacity={0.6 + (up > 2 - index ? 0.4 : 0)}
            />
          </g>
        ))}
        {levels.map((level, index) => (
          <g key={index}>
            <rect
              x={level.x}
              y={level.y}
              width={14}
              height={level.h}
              rx={2}
              fill={ERA}
              opacity={0.3 + (down >= index ? 0.5 : 0)}
            />
            {index < 3 ? (
              <rect
                x={218 - (level.x - 18)}
                y={level.y}
                width={14}
                height={level.h}
                rx={2}
                fill={ERA}
                opacity={0.3 + (up >= 3 - index ? 0.5 : 0)}
              />
            ) : null}
          </g>
        ))}
        {levels.slice(0, 3).map((level, index) => (
          <g key={`d${index}`}>
            <Travel
              x1={level.x + 7}
              y1={level.y + level.h}
              x2={levels[index + 1]!.x + 7}
              y2={levels[index + 1]!.y}
              t={clampUnit(down - index)}
            />
            <Travel
              x1={218 - (levels[index + 1]!.x - 18) + 7}
              y1={levels[index + 1]!.y}
              x2={218 - (level.x - 18) + 7}
              y2={level.y + level.h}
              t={clampUnit(up - (2 - index))}
            />
          </g>
        ))}
        <Scene x={18} y={112} scale={0.36} />
        <g transform="translate(186 112) scale(0.36)">
          <rect width={110} height={90} rx={6} fill={SOFT} stroke={LINE} />
          <g opacity={mask}>
            {SCENE_OBJECTS.map((object) => (
              <SceneObjectShape
                key={object.key}
                object={object.key}
                fill={object.hue}
              />
            ))}
          </g>
        </g>
      </g>
    );
  },
};

/** Each block adds a correction on top of a shortcut, so very deep networks still train. */
export const residual: Illustration = {
  duration: 3500,
  still: 0.5,
  render: (p) => {
    const blocks = [52, 112, 172];
    return (
      <g>
        <line x1={10} y1={92} x2={230} y2={92} stroke={LINE} strokeWidth={2} />
        {blocks.map((x, index) => {
          const t = ramp(p, index * 0.3, index * 0.3 + 0.35);
          return (
            <g key={x}>
              <path
                d={`M${x - 26} 92 C ${x - 26} 40, ${x + 26} 40, ${x + 26} 92`}
                fill="none"
                stroke={ACCENT}
                strokeWidth={2}
                strokeDasharray="4 3"
              />
              <Block
                x={x - 16}
                y={80}
                w={32}
                h={24}
                active={pulse(t, 0.2, 0.4, 0.6, 0.8)}
              />
              <circle
                cx={x + 26}
                cy={92}
                r={6}
                fill={PAPER}
                stroke={INK}
                strokeWidth={1.5}
              />
              <path
                d={`M${x + 23} 92 h6 M${x + 26} 89 v6`}
                stroke={INK}
                strokeWidth={1.5}
              />
              <Travel x1={x - 26} y1={92} x2={x + 26} y2={92} t={t} />
              {t > 0 && t < 1 ? (
                <circle
                  cx={x + Math.cos(Math.PI - t * Math.PI) * 26}
                  cy={92 - Math.sin(t * Math.PI) * 39}
                  r={3}
                  fill={ACCENT}
                />
              ) : null}
            </g>
          );
        })}
      </g>
    );
  },
};

/** A network learns to turn one kind of image into another, and back again. */
export const imageTranslation: Illustration = {
  duration: 6000,
  still: 0.4,
  render: (p, uid) => {
    const forward = step(p, 0.08, 0.42);
    const back = step(p, 0.58, 0.92);
    const fill = forward * (1 - back);
    return (
      <g>
        <defs>
          <clipPath id={`${uid}-out`}>
            <rect x={130} y={20} width={100 * fill} height={110} />
          </clipPath>
        </defs>
        <Panel x={10} y={30} w={90} h={90} fill={PAPER} />
        <path
          d="M30 104 L30 72 L55 50 L80 72 L80 104 Z M48 104 L48 86 L62 86 L62 104"
          fill="none"
          stroke={INK}
          strokeWidth={1.8}
          strokeLinejoin="round"
        />
        <path
          d="M108 66 C 116 58, 122 58, 128 66"
          fill="none"
          stroke={ERA}
          strokeWidth={2}
          opacity={0.4 + forward * 0.6}
        />
        <Arrow
          x1={126}
          y1={64}
          x2={128}
          y2={66}
          color={ERA}
          opacity={0.4 + forward * 0.6}
        />
        <path
          d="M128 86 C 122 94, 116 94, 108 86"
          fill="none"
          stroke={ACCENT}
          strokeWidth={2}
          opacity={0.4 + back * 0.6}
        />
        <Arrow
          x1={110}
          y1={88}
          x2={108}
          y2={86}
          color={ACCENT}
          opacity={0.4 + back * 0.6}
        />
        <Panel x={136} y={30} w={90} h={90} fill={PAPER} />
        <path
          d="M156 104 L156 72 L181 50 L206 72 L206 104 Z M174 104 L174 86 L188 86 L188 104"
          fill="none"
          stroke={INK}
          strokeWidth={1.8}
          strokeLinejoin="round"
          opacity={1 - fill}
        />
        <g clipPath={`url(#${uid}-out)`}>
          <rect
            x={137}
            y={31}
            width={88}
            height={88}
            rx={5}
            fill={HUES[0]}
            opacity={0.3}
          />
          <path d="M156 104 L156 72 L206 72 L206 104 Z" fill={HUES[4]} />
          <path d="M152 74 L181 48 L210 74 Z" fill={HUES[1]} />
          <rect x={174} y={86} width={14} height={18} fill={INK} />
          <rect
            x={137}
            y={104}
            width={88}
            height={15}
            fill={HUES[2]}
            opacity={0.6}
          />
        </g>
      </g>
    );
  },
};

/** Feature maps at several scales: small objects are caught high-res, large ones low-res. */
export const pyramid: Illustration = {
  duration: 5000,
  still: 0.9,
  render: (p) => {
    const levels = [
      { x: 20, y: 18, s: 74 },
      { x: 34, y: 98, s: 40 },
      { x: 120, y: 108, s: 24 },
    ];
    const top = ramp(p, 0.05, 0.6) * 2;
    const detect = step(p, 0.65, 0.8);
    return (
      <g>
        {levels.map((level, index) => (
          <g key={index}>
            <rect
              x={level.x}
              y={level.y}
              width={level.s}
              height={level.s * 0.45}
              rx={3}
              fill={ERA}
              opacity={0.2 + (top >= 2 - index ? 0.35 : 0)}
            />
          </g>
        ))}
        <Arrow
          x1={120}
          y1={106}
          x2={78}
          y2={112}
          color={ACCENT}
          opacity={top > 0 ? 1 : 0.3}
        />
        <Arrow
          x1={52}
          y1={96}
          x2={56}
          y2={54}
          color={ACCENT}
          opacity={top > 1 ? 1 : 0.3}
        />
        <Panel x={128} y={14} w={100} h={84} />
        <circle cx={150} cy={36} r={4} fill={HUES[1]} />
        <rect x={168} y={46} width={46} height={40} rx={6} fill={HUES[0]} />
        <rect
          x={142}
          y={28}
          width={16}
          height={16}
          fill="none"
          stroke={HUES[1]}
          strokeWidth={2}
          opacity={detect}
        />
        <rect
          x={164}
          y={42}
          width={54}
          height={48}
          fill="none"
          stroke={HUES[0]}
          strokeWidth={2}
          opacity={detect}
        />
        <line
          x1={94}
          y1={30}
          x2={142}
          y2={36}
          stroke={HUES[1]}
          strokeDasharray="3 3"
          opacity={detect}
        />
        <line
          x1={144}
          y1={118}
          x2={164}
          y2={88}
          stroke={HUES[0]}
          strokeDasharray="3 3"
          opacity={detect}
        />
      </g>
    );
  },
};

/** Each object gets a box, then its own pixel mask; background "stuff" is labelled too. */
export const instanceMask: Illustration = {
  duration: 5000,
  still: 0.9,
  render: (p) => {
    const boxes = step(p, 0.05, 0.25);
    const masks = SCENE_OBJECTS.map((_, index) =>
      step(p, 0.3 + index * 0.12, 0.42 + index * 0.12),
    );
    const stuff = step(p, 0.7, 0.85);
    return (
      <Scene x={10} y={10} scale={1.42}>
        <rect
          x={0.5}
          y={68}
          width={109}
          height={21.5}
          fill={HUES[4]}
          opacity={stuff * 0.5}
        />
        <rect
          x={0.5}
          y={0.5}
          width={109}
          height={67.5}
          rx={5}
          fill={HUES[5]}
          opacity={stuff * 0.18}
        />
        {SCENE_OBJECTS.map((object, index) => (
          <g key={object.key}>
            <g opacity={masks[index]}>
              <SceneObjectShape object={object.key} fill={object.hue} />
            </g>
            <rect
              x={object.box.x}
              y={object.box.y}
              width={object.box.w}
              height={object.box.h}
              fill="none"
              stroke={object.hue}
              strokeWidth={1.4}
              opacity={boxes * (1 - masks[index]! * 0.6)}
            />
          </g>
        ))}
      </Scene>
    );
  },
};

/** Every pixel gets a class colour: first coarse, then sharpened to the true outline. */
export const pixelMask: Illustration = {
  duration: 5000,
  still: 0.9,
  render: (p) => {
    const coarse = step(p, 0.05, 0.4);
    const fine = step(p, 0.5, 0.75);
    const grid = 10;
    return (
      <Scene x={10} y={10} scale={1.42}>
        {Array.from({ length: grid * 9 }, (_, index) => {
          const col = index % grid;
          const row = Math.floor(index / grid);
          const x = col * 11 + 5.5;
          const y = row * 10 + 5;
          const object = sceneObjectAt(x, y);
          if (object < 0 || (row * grid + col) / (grid * 9) > coarse)
            return null;
          return (
            <rect
              key={index}
              x={col * 11}
              y={row * 10}
              width={11}
              height={10}
              fill={SCENE_OBJECTS[object]!.hue}
              opacity={0.55 * (1 - fine)}
            />
          );
        })}
        <g opacity={fine}>
          {SCENE_OBJECTS.map((object) => (
            <SceneObjectShape
              key={object.key}
              object={object.key}
              fill={object.hue}
            />
          ))}
        </g>
      </Scene>
    );
  },
};
