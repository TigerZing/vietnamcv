import {
  ACCENT,
  Arrow,
  Bars,
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
  SCENE,
  SCENE_OBJECTS,
  sceneObjectAt,
  SceneObjectShape,
  SOFT,
  step,
  TAU,
  Travel,
} from "./kit";

/** A generator forges images from noise while a discriminator learns to catch the fakes. */
export const gan: Illustration = {
  duration: 6000,
  still: 0.85,
  render: (p, uid) => {
    const quality = step(p, 0.05, 0.85);
    const round = (p * 6) % 1;
    const verdictReal = quality > 0.7;
    return (
      <g>
        <defs>
          <filter id={`${uid}-blur`}>
            <feGaussianBlur stdDeviation={lerp(4, 0, quality)} />
          </filter>
        </defs>
        {Array.from({ length: 9 }, (_, index) => (
          <circle
            key={index}
            cx={14 + (index % 3) * 8}
            cy={62 + Math.floor(index / 3) * 8}
            r={2.5}
            fill={HUES[Math.floor(rand(index + Math.floor(p * 6)) * 4)]}
          />
        ))}
        <Travel x1={36} y1={70} x2={50} y2={70} t={ramp(round, 0, 0.25)} />
        <Block
          x={50}
          y={52}
          w={40}
          h={36}
          active={pulse(round, 0.15, 0.25, 0.35, 0.45)}
        />
        <text
          x={70}
          y={74}
          textAnchor="middle"
          fontSize={11}
          fontWeight={700}
          fill={INK}
        >
          G
        </text>
        <Arrow x1={92} y1={70} x2={104} y2={70} />
        <g filter={`url(#${uid}-blur)`}>
          <Face cx={126} cy={70} r={18} eyes={0.2} smile={0.6} fill={SOFT} />
        </g>
        <Arrow x1={148} y1={70} x2={160} y2={70} />
        <Block
          x={162}
          y={52}
          w={40}
          h={36}
          active={pulse(round, 0.55, 0.65, 0.75, 0.85)}
        />
        <text
          x={182}
          y={74}
          textAnchor="middle"
          fontSize={11}
          fontWeight={700}
          fill={INK}
        >
          D
        </text>
        <g opacity={step(round, 0.65, 0.75)}>
          <circle cx={218} cy={70} r={9} fill={verdictReal ? ERA : ACCENT} />
          <path
            d={
              verdictReal ? "M213 70 l4 4 l7 -8" : "M214 66 l8 8 M222 66 l-8 8"
            }
            stroke={PAPER}
            strokeWidth={2.2}
            fill="none"
            strokeLinecap="round"
          />
        </g>
        <Face cx={182} cy={122} r={12} eyes={0.1} smile={0.5} fill={SOFT} />
        <Arrow x1={182} y1={108} x2={182} y2={92} />
        <rect x={50} y={134} width={92} height={5} rx={2.5} fill={SOFT} />
        <rect
          x={50}
          y={134}
          width={92 * quality}
          height={5}
          rx={2.5}
          fill={ERA}
        />
      </g>
    );
  },
};

/** The image is cut into patches; each patch looks at every other one and weighs what matters. */
export const patchAttention: Illustration = {
  duration: 6000,
  still: 0.3,
  render: (p) => {
    const cols = 4;
    const rows = 3;
    const size = 24;
    const query = Math.floor(p * cols * rows) % (cols * rows);
    const qx = query % cols;
    const qy = Math.floor(query / cols);
    const weight = (index: number) => {
      const x = index % cols;
      const y = Math.floor(index / cols);
      const near = Math.exp(-((x - qx) ** 2 + (y - qy) ** 2) / 3);
      return Math.min(1, near * 0.7 + rand(index * 13 + query) * 0.35);
    };
    const center = (index: number) => ({
      x: 12 + (index % cols) * size + size / 2,
      y: 30 + Math.floor(index / cols) * size + size / 2,
    });
    return (
      <g>
        <g transform="translate(12 30) scale(0.873 0.8)">
          <Scene x={0} y={0} />
        </g>
        {Array.from({ length: cols * rows }, (_, index) => (
          <rect
            key={index}
            x={12 + (index % cols) * size}
            y={30 + Math.floor(index / cols) * size}
            width={size}
            height={size}
            fill="none"
            stroke={PAPER}
            strokeWidth={1.5}
          />
        ))}
        {Array.from({ length: cols * rows }, (_, index) => {
          const from = center(query);
          const to = center(index);
          return index === query ? null : (
            <path
              key={index}
              d={`M${from.x} ${from.y} Q ${(from.x + to.x) / 2} ${Math.min(from.y, to.y) - 26} ${to.x} ${to.y}`}
              fill="none"
              stroke={ERA}
              strokeWidth={0.6 + weight(index) * 3}
              opacity={0.25 + weight(index) * 0.7}
            />
          );
        })}
        <rect
          x={12 + qx * size}
          y={30 + qy * size}
          width={size}
          height={size}
          fill="none"
          stroke={ERA}
          strokeWidth={2.6}
        />
        {Array.from({ length: cols * rows }, (_, index) => (
          <rect
            key={index}
            x={124 + (index % 6) * 18}
            y={44 + Math.floor(index / 6) * 30}
            width={14}
            height={24}
            rx={3}
            fill={index === query ? ERA : MUTED}
            opacity={index === query ? 1 : 0.2 + weight(index) * 0.7}
          />
        ))}
        <Arrow x1={110} y1={66} x2={120} y2={66} />
      </g>
    );
  },
};

/** Two views of the same image are pulled together in embedding space; others are pushed away. */
export const contrastive: Illustration = {
  duration: 5000,
  still: 0.85,
  render: (p) => {
    const train = step(p, 0.2, 0.8);
    const anchor = { x: 176, y: 70 };
    const others = [
      { angle: 0.3, hue: HUES[1] },
      { angle: 2.1, hue: HUES[2] },
      { angle: 3.9, hue: HUES[3] },
    ];
    return (
      <g>
        <g transform="translate(10 18) scale(0.5)">
          <Scene x={0} y={0} />
        </g>
        <g transform="translate(14 88) rotate(-8) scale(0.42)">
          <Scene x={0} y={0} />
        </g>
        <g transform="translate(64 92) scale(0.52)">
          <rect width={60} height={60} rx={4} fill={SOFT} stroke={LINE} />
          <circle cx={30} cy={30} r={20} fill={HUES[0]} opacity={0.6} />
        </g>
        <Arrow x1={70} y1={42} x2={112} y2={60} color={ERA} />
        <Arrow x1={62} y1={112} x2={112} y2={80} color={ERA} />
        <circle cx={176} cy={75} r={56} fill={PAPER} stroke={LINE} />
        <circle
          cx={lerp(anchor.x - 30, anchor.x - 5, train)}
          cy={lerp(anchor.y - 22, anchor.y, train)}
          r={6}
          fill={ERA}
        />
        <circle
          cx={lerp(anchor.x + 26, anchor.x + 5, train)}
          cy={lerp(anchor.y + 30, anchor.y + 4, train)}
          r={6}
          fill={ERA}
          stroke={INK}
          strokeWidth={1.5}
        />
        {others.map((other, index) => {
          const r = lerp(18, 44, train);
          return (
            <circle
              key={index}
              cx={176 + Math.cos(other.angle + 0.6) * r}
              cy={75 + Math.sin(other.angle + 0.6) * r}
              r={5}
              fill={other.hue}
              opacity={0.75}
            />
          );
        })}
      </g>
    );
  },
};

/** Rays are shot through a learned volume; colours and densities along each ray make a pixel. */
export const nerfRays: Illustration = {
  duration: 5000,
  still: 0.5,
  render: (p) => {
    const row = Math.floor(ramp(p, 0.02, 0.9) * 8);
    const sweep = ramp((p * 8) % 1, 0, 1);
    const camera = { x: 14, y: 75 };
    const plane = 70;
    const pixelY = (index: number) => 57.5 + index * 5;
    return (
      <g>
        <circle cx={170} cy={75} r={50} fill={ERA} opacity={0.16} />
        <circle cx={170} cy={75} r={33} fill={ERA} opacity={0.2} />
        <circle cx={170} cy={75} r={16} fill={ERA} opacity={0.3} />
        <path d="M22 75 L8 66 L8 84 Z" fill={INK} />
        <line
          x1={plane}
          y1={52}
          x2={plane}
          y2={98}
          stroke={INK}
          strokeWidth={2}
        />
        {Array.from({ length: 8 }, (_, index) => {
          const y = pixelY(index);
          const dy = (y - camera.y) / (plane - camera.x);
          const end = { x: 230, y: camera.y + dy * (230 - camera.x) };
          const hits = Math.max(0, 1 - Math.abs(y - 75) / 20);
          return (
            <g key={index}>
              <rect
                x={plane - 12}
                y={y - 2.5}
                width={8}
                height={5}
                fill={index < row ? ERA : SOFT}
                opacity={index < row ? 0.25 + hits * 0.75 : 1}
                stroke={LINE}
                strokeWidth={0.5}
              />
              {index === row ? (
                <g>
                  <line
                    x1={camera.x}
                    y1={camera.y}
                    x2={end.x}
                    y2={end.y}
                    stroke={ACCENT}
                    strokeWidth={1.2}
                  />
                  {Array.from({ length: 9 }, (_, sample) => {
                    const x = 110 + sample * 13;
                    const sy = camera.y + dy * (x - camera.x);
                    const density = Math.max(
                      0,
                      1 - Math.hypot(x - 170, sy - 75) / 50,
                    );
                    return (
                      <circle
                        key={sample}
                        cx={x}
                        cy={sy}
                        r={1.5 + density * 3}
                        fill={density > 0 ? ERA : MUTED}
                        opacity={sample / 9 < sweep ? 1 : 0.15}
                      />
                    );
                  })}
                </g>
              ) : null}
            </g>
          );
        })}
      </g>
    );
  },
};

/** A fixed set of object queries each claim one object, or say "nothing here". */
export const setPrediction: Illustration = {
  duration: 5000,
  still: 0.85,
  render: (p) => {
    const link = step(p, 0.1, 0.55);
    const boxes = step(p, 0.55, 0.75);
    const queries = [0, 1, 2, 3, 4];
    const owner = [1, -1, 0, -1, 2];
    return (
      <g>
        {queries.map((query) => (
          <circle
            key={query}
            cx={20}
            cy={27 + query * 24}
            r={7}
            fill={owner[query]! >= 0 ? SCENE_OBJECTS[owner[query]!]!.hue : SOFT}
            stroke={owner[query]! >= 0 ? "none" : LINE}
          />
        ))}
        <Scene x={74} y={14} scale={1.42}>
          {SCENE_OBJECTS.map((object, index) => (
            <rect
              key={object.key}
              x={object.box.x}
              y={object.box.y}
              width={object.box.w}
              height={object.box.h}
              fill={object.hue}
              fillOpacity={0.12}
              stroke={object.hue}
              strokeWidth={1.6}
              opacity={boxes}
              rx={index === 1 ? 1 : 2}
            />
          ))}
        </Scene>
        {queries.map((query) => {
          const target = owner[query]!;
          const from = { x: 27, y: 27 + query * 24 };
          if (target < 0) {
            return (
              <g key={query} opacity={link}>
                <line
                  x1={from.x}
                  y1={from.y}
                  x2={from.x + 26}
                  y2={from.y}
                  stroke={MUTED}
                  strokeDasharray="2 3"
                />
                <text x={from.x + 32} y={from.y + 4} fontSize={11} fill={MUTED}>
                  ∅
                </text>
              </g>
            );
          }
          const box = SCENE_OBJECTS[target]!.box;
          const to = {
            x: 74 + (box.x + box.w / 2) * 1.42,
            y: 14 + (box.y + box.h / 2) * 1.42,
          };
          return (
            <line
              key={query}
              x1={from.x}
              y1={from.y}
              x2={lerp(from.x, to.x, link)}
              y2={lerp(from.y, to.y, link)}
              stroke={SCENE_OBJECTS[target]!.hue}
              strokeWidth={1.6}
            />
          );
        })}
      </g>
    );
  },
};

const NOISE_GRID = { cols: 16, rows: 13 } as const;

/** Pure noise is cleaned up step by step until an image appears, guided by the prompt. */
export const diffusion: Illustration = {
  duration: 6000,
  still: 0.9,
  render: (p) => {
    const clean = step(p, 0.12, 0.85);
    const steps = 8;
    const done = Math.floor(clean * steps);
    const cellW = SCENE.width / NOISE_GRID.cols;
    const cellH = SCENE.height / NOISE_GRID.rows;
    const frame = Math.floor(p * 30);
    return (
      <g>
        <rect
          x={20}
          y={8}
          width={200}
          height={14}
          rx={7}
          fill={SOFT}
          stroke={LINE}
        />
        <Bars
          x={30}
          y={13}
          widths={[22, 36, 18, 30, 26]}
          reveal={step(p, 0, 0.1)}
          color={ERA}
        />
        <Scene x={52} y={28} scale={1.2}>
          {Array.from(
            { length: NOISE_GRID.cols * NOISE_GRID.rows },
            (_, index) => {
              const col = index % NOISE_GRID.cols;
              const row = Math.floor(index / NOISE_GRID.cols);
              const flicker = rand(index * 3 + frame);
              return (
                <rect
                  key={index}
                  x={col * cellW}
                  y={row * cellH}
                  width={cellW + 0.2}
                  height={cellH + 0.2}
                  fill={HUES[Math.floor(rand(index + frame * 7) * 6)]}
                  opacity={(1 - clean) * (0.55 + flicker * 0.45)}
                />
              );
            },
          )}
        </Scene>
        {Array.from({ length: steps }, (_, index) => (
          <circle
            key={index}
            cx={86 + index * 10}
            cy={142}
            r={3}
            fill={index < done ? ERA : SOFT}
            stroke={LINE}
            strokeWidth={0.5}
          />
        ))}
      </g>
    );
  },
};

/** Text and image are both tokens; the image is written out one token after another. */
export const imageTokens: Illustration = {
  duration: 6000,
  still: 0.9,
  render: (p) => {
    const cols = 10;
    const rows = 8;
    const written = Math.floor(ramp(p, 0.15, 0.9) * cols * rows);
    const cellW = SCENE.width / cols;
    const cellH = SCENE.height / rows;
    return (
      <g>
        {Array.from({ length: 5 }, (_, index) => (
          <rect
            key={index}
            x={14}
            y={22 + index * 22}
            width={36}
            height={16}
            rx={4}
            fill={ERA}
            opacity={step(p, index * 0.025, index * 0.025 + 0.03) * 0.75}
          />
        ))}
        <Arrow x1={56} y1={75} x2={72} y2={75} />
        <Scene x={80} y={18} scale={1.3} plain>
          {Array.from({ length: written }, (_, index) => {
            const col = index % cols;
            const row = Math.floor(index / cols);
            const object = sceneObjectAt(
              col * cellW + cellW / 2,
              row * cellH + cellH / 2,
            );
            return object < 0 ? null : (
              <rect
                key={index}
                x={col * cellW}
                y={row * cellH}
                width={cellW + 0.2}
                height={cellH + 0.2}
                fill={SCENE_OBJECTS[object]!.hue}
              />
            );
          })}
          {written < cols * rows ? (
            <rect
              x={(written % cols) * cellW}
              y={Math.floor(written / cols) * cellH}
              width={cellW}
              height={cellH}
              fill="none"
              stroke={ERA}
              strokeWidth={1.2}
            />
          ) : null}
        </Scene>
      </g>
    );
  },
};

/** Images and captions are embedded together; matching pairs light up the diagonal. */
export const imageTextMatch: Illustration = {
  duration: 5000,
  still: 0.9,
  render: (p) => {
    const train = step(p, 0.1, 0.8);
    const n = 4;
    const glyph = (index: number, x: number, y: number) => {
      const hue = HUES[index]!;
      switch (index) {
        case 0:
          return <circle cx={x} cy={y} r={7} fill={hue} />;
        case 1:
          return (
            <rect
              x={x - 8}
              y={y - 5}
              width={16}
              height={10}
              rx={2}
              fill={hue}
            />
          );
        case 2:
          return (
            <path
              d={`M${x} ${y - 8} L${x + 8} ${y + 7} L${x - 8} ${y + 7} Z`}
              fill={hue}
            />
          );
        default:
          return (
            <path
              d={`M${x - 8} ${y} L${x} ${y - 8} L${x + 8} ${y} L${x} ${y + 8} Z`}
              fill={hue}
            />
          );
      }
    };
    return (
      <g>
        {Array.from({ length: n }, (_, index) => (
          <g key={`i${index}`}>
            <rect
              x={14}
              y={38 + index * 26}
              width={24}
              height={22}
              rx={3}
              fill={SOFT}
              stroke={LINE}
            />
            {glyph(index, 26, 49 + index * 26)}
          </g>
        ))}
        {Array.from({ length: n }, (_, index) => (
          <g key={`t${index}`}>
            <rect
              x={56 + index * 40}
              y={10}
              width={36}
              height={20}
              rx={4}
              fill={SOFT}
              stroke={LINE}
            />
            <rect
              x={62 + index * 40}
              y={16}
              width={10}
              height={8}
              rx={2}
              fill={HUES[index]}
            />
            <rect
              x={75 + index * 40}
              y={18}
              width={14}
              height={4}
              rx={2}
              fill={MUTED}
            />
          </g>
        ))}
        {Array.from({ length: n * n }, (_, index) => {
          const row = Math.floor(index / n);
          const col = index % n;
          const match = row === col;
          const score = match
            ? lerp(0.35, 1, train)
            : lerp(0.35, 0.06, train) + rand(index) * 0.1;
          return (
            <rect
              key={index}
              x={58 + col * 40}
              y={38 + row * 26}
              width={32}
              height={22}
              rx={3}
              fill={match ? ERA : MUTED}
              opacity={score}
            />
          );
        })}
      </g>
    );
  },
};

/** Attention stays inside small windows; shifting the windows lets information cross them. */
export const shiftedWindows: Illustration = {
  duration: 5000,
  still: 0.75,
  render: (p) => {
    const shifted = p >= 0.5;
    const shift = shifted ? 2 : 0;
    const cell = 13;
    const grid = 8;
    const ox = 68;
    const oy = 18;
    const active = Math.floor(((p * 2) % 1) * 4);
    return (
      <g>
        {Array.from({ length: grid * grid }, (_, index) => {
          const col = index % grid;
          const row = Math.floor(index / grid);
          const wx = Math.floor(((col + shift) % grid) / 4);
          const wy = Math.floor(((row + shift) % grid) / 4);
          const windowIndex = wy * 2 + wx;
          return (
            <rect
              key={index}
              x={ox + col * cell}
              y={oy + row * cell}
              width={cell - 1.5}
              height={cell - 1.5}
              rx={1.5}
              fill={HUES[windowIndex]}
              opacity={windowIndex === active ? 0.75 : 0.18}
            />
          );
        })}
        {shifted ? null : (
          <g stroke={INK} strokeWidth={2}>
            <line
              x1={ox + 4 * cell - 0.75}
              y1={oy - 2}
              x2={ox + 4 * cell - 0.75}
              y2={oy + grid * cell}
            />
            <line
              x1={ox - 2}
              y1={oy + 4 * cell - 0.75}
              x2={ox + grid * cell}
              y2={oy + 4 * cell - 0.75}
            />
          </g>
        )}
        {shifted ? (
          <g stroke={INK} strokeWidth={2} strokeDasharray="4 3">
            <line
              x1={ox + 2 * cell - 0.75}
              y1={oy - 2}
              x2={ox + 2 * cell - 0.75}
              y2={oy + grid * cell}
            />
            <line
              x1={ox + 6 * cell - 0.75}
              y1={oy - 2}
              x2={ox + 6 * cell - 0.75}
              y2={oy + grid * cell}
            />
            <line
              x1={ox - 2}
              y1={oy + 2 * cell - 0.75}
              x2={ox + grid * cell}
              y2={oy + 2 * cell - 0.75}
            />
            <line
              x1={ox - 2}
              y1={oy + 6 * cell - 0.75}
              x2={ox + grid * cell}
              y2={oy + 6 * cell - 0.75}
            />
          </g>
        ) : null}
      </g>
    );
  },
};

/** Most patches are hidden; the model learns by painting them back in. */
export const maskedPatches: Illustration = {
  duration: 5000,
  still: 0.4,
  render: (p) => {
    const grid = 5;
    const hide = step(p, 0.05, 0.2);
    const restore = ramp(p, 0.35, 0.85);
    const order = Array.from(
      { length: grid * grid },
      (_, index) => index,
    ).filter((index) => rand(index + 5) < 0.75);
    return (
      <g>
        <Scene x={20} y={14} scale={1.12} />
        <Arrow x1={148} y1={64} x2={160} y2={64} />
        <Scene x={166} y={34} scale={0.6} />
        {order.map((index, rank) => {
          const col = index % grid;
          const row = Math.floor(index / grid);
          const restored = rank / order.length < restore;
          return (
            <rect
              key={index}
              x={20 + col * 24.64}
              y={14 + row * 20.16}
              width={24.64}
              height={20.16}
              fill={MUTED}
              stroke={PAPER}
              strokeWidth={1}
              opacity={hide * (restored ? 0 : 0.95)}
            />
          );
        })}
        {order.map((index, rank) => {
          const col = index % grid;
          const row = Math.floor(index / grid);
          const restored = rank / order.length < restore;
          return restored ? (
            <rect
              key={`r${index}`}
              x={20 + col * 24.64}
              y={14 + row * 20.16}
              width={24.64}
              height={20.16}
              fill="none"
              stroke={ERA}
              strokeWidth={1.2}
              opacity={0.8}
            />
          ) : null;
        })}
      </g>
    );
  },
};

/** Ask a question about an image and the model answers in words, pointing at what it saw. */
export const visualChat: Illustration = {
  duration: 6000,
  still: 0.9,
  render: (p) => {
    const ask = step(p, 0.05, 0.25);
    const look = pulse(p, 0.3, 0.38, 0.85, 0.95);
    const answer = ramp(p, 0.4, 0.85);
    return (
      <g>
        <Scene x={10} y={34} scale={0.85} />
        <rect
          x={43}
          y={56}
          width={16}
          height={36}
          rx={3}
          fill="none"
          stroke={ERA}
          strokeWidth={2}
          opacity={look}
        />
        <g opacity={ask}>
          <rect
            x={120}
            y={18}
            width={108}
            height={30}
            rx={10}
            fill={ACCENT}
            opacity={0.25}
          />
          <Bars x={130} y={26} widths={[30, 20, 34]} color={INK} />
          <Bars x={130} y={36} widths={[24, 40]} color={INK} />
        </g>
        <rect
          x={110}
          y={62}
          width={118}
          height={58}
          rx={10}
          fill={SOFT}
          stroke={LINE}
          opacity={answer > 0 ? 1 : 0}
        />
        <Bars
          x={120}
          y={72}
          widths={[34, 26, 30]}
          color={ERA}
          reveal={ramp(answer, 0, 0.35)}
        />
        <Bars
          x={120}
          y={84}
          widths={[22, 44, 18]}
          color={MUTED}
          reveal={ramp(answer, 0.35, 0.7)}
        />
        <Bars
          x={120}
          y={96}
          widths={[40, 28]}
          color={MUTED}
          reveal={ramp(answer, 0.7, 1)}
        />
        {answer > 0 && answer < 1 ? (
          <circle cx={120 + 92 * answer} cy={110} r={2} fill={ERA} />
        ) : null}
      </g>
    );
  },
};

/** A sketch, pose or edge map steers the denoising, so the image follows that structure. */
export const controlNet: Illustration = {
  duration: 6000,
  still: 0.9,
  render: (p) => {
    const clean = step(p, 0.15, 0.85);
    const frame = Math.floor(p * 30);
    const pose = [
      [0, -26],
      [0, -16],
      [-12, -4],
      [-18, -18],
      [12, -4],
      [18, 8],
      [0, 8],
      [-7, 22],
      [-9, 34],
      [7, 22],
      [9, 34],
    ].map(([x, y]) => ({ x: 46 + x!, y: 78 + y! }));
    const limbs: [number, number][] = [
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
    const drawn = pose.map((point) => ({ x: point.x + 128, y: point.y }));
    return (
      <g>
        <Panel x={12} y={30} w={68} h={96} fill={PAPER} />
        {limbs.map(([a, b]) => (
          <line
            key={`${a}${b}`}
            x1={pose[a]!.x}
            y1={pose[a]!.y}
            x2={pose[b]!.x}
            y2={pose[b]!.y}
            stroke={ERA}
            strokeWidth={2.4}
            strokeLinecap="round"
          />
        ))}
        <circle
          cx={pose[0]!.x}
          cy={pose[0]!.y}
          r={6}
          fill="none"
          stroke={ERA}
          strokeWidth={2.4}
        />
        <Arrow x1={86} y1={78} x2={128} y2={78} color={ERA} />
        <Panel x={136} y={30} w={84} h={96} />
        <g opacity={clean}>
          {limbs.map(([a, b]) => (
            <line
              key={`${a}${b}`}
              x1={drawn[a]!.x + 8}
              y1={drawn[a]!.y}
              x2={drawn[b]!.x + 8}
              y2={drawn[b]!.y}
              stroke={HUES[0]}
              strokeWidth={7}
              strokeLinecap="round"
            />
          ))}
          <circle cx={drawn[0]!.x + 8} cy={drawn[0]!.y} r={8} fill={INK} />
        </g>
        {Array.from({ length: 8 * 9 }, (_, index) => (
          <rect
            key={index}
            x={136 + (index % 8) * 10.5}
            y={30 + Math.floor(index / 8) * 10.67}
            width={10.5}
            height={10.67}
            fill={HUES[Math.floor(rand(index + frame * 5) * 6)]}
            opacity={(1 - clean) * (0.5 + rand(index + frame) * 0.5)}
          />
        ))}
      </g>
    );
  },
};

/** Words in the prompt are linked to the boxes they describe, even for unseen classes. */
export const textGrounding: Illustration = {
  duration: 5000,
  still: 0.9,
  render: (p) => {
    const link = step(p, 0.2, 0.6);
    const box = step(p, 0.55, 0.75);
    const words = [
      { x: 60, w: 34, target: 1 },
      { x: 150, w: 30, target: 2 },
    ];
    return (
      <g>
        <rect
          x={20}
          y={8}
          width={200}
          height={20}
          rx={10}
          fill={SOFT}
          stroke={LINE}
        />
        <Bars x={30} y={16} widths={[22]} />
        <rect
          x={60}
          y={12}
          width={34}
          height={12}
          rx={6}
          fill={HUES[0]}
          opacity={0.85}
        />
        <Bars x={102} y={16} widths={[40]} />
        <rect
          x={150}
          y={12}
          width={30}
          height={12}
          rx={6}
          fill={HUES[1]}
          opacity={0.85}
        />
        <Bars x={188} y={16} widths={[24]} />
        <Scene x={42} y={38} scale={1.42}>
          {words.map((word) => {
            const object = SCENE_OBJECTS[word.target]!;
            return (
              <rect
                key={word.x}
                x={object.box.x}
                y={object.box.y}
                width={object.box.w}
                height={object.box.h}
                fill={object.hue}
                fillOpacity={0.15}
                stroke={object.hue}
                strokeWidth={1.6}
                opacity={box}
              />
            );
          })}
        </Scene>
        {words.map((word) => {
          const object = SCENE_OBJECTS[word.target]!;
          const to = {
            x: 42 + (object.box.x + object.box.w / 2) * 1.42,
            y: 38 + object.box.y * 1.42,
          };
          const from = { x: word.x + word.w / 2, y: 24 };
          return (
            <line
              key={word.x}
              x1={from.x}
              y1={from.y}
              x2={lerp(from.x, to.x, link)}
              y2={lerp(from.y, to.y, link)}
              stroke={object.hue}
              strokeWidth={1.8}
              strokeDasharray="4 3"
            />
          );
        })}
      </g>
    );
  },
};

/** One click is enough: the model returns the mask of whatever the click lands on. */
export const promptMask: Illustration = {
  duration: 6000,
  still: 0.4,
  render: (p, uid) => {
    const half = p < 0.5 ? 0 : 1;
    const local = (p % 0.5) * 2;
    const target = half === 0 ? SCENE_OBJECTS[2]! : SCENE_OBJECTS[1]!;
    const click = {
      x: target.box.x + target.box.w / 2,
      y: target.box.y + target.box.h / 2,
    };
    const start = half === 0 ? { x: 20, y: 80 } : { x: 90, y: 60 };
    const move = step(local, 0, 0.3);
    const cursor = {
      x: lerp(start.x, click.x, move),
      y: lerp(start.y, click.y, move),
    };
    const ripple = pulse(local, 0.3, 0.35, 0.45, 0.55);
    const grow = step(local, 0.35, 0.7);
    return (
      <Scene x={42} y={10} scale={1.42}>
        <defs>
          <clipPath id={`${uid}-grow-${half}`}>
            <circle cx={click.x} cy={click.y} r={grow * 40} />
          </clipPath>
        </defs>
        <g clipPath={`url(#${uid}-grow-${half})`}>
          <SceneObjectShape object={target.key} fill={ERA} />
        </g>
        <circle
          cx={click.x}
          cy={click.y}
          r={2 + ripple * 8}
          fill="none"
          stroke={INK}
          strokeWidth={1}
          opacity={ripple}
        />
        <circle
          cx={click.x}
          cy={click.y}
          r={2.2}
          fill={ACCENT}
          stroke={PAPER}
          strokeWidth={0.8}
          opacity={step(local, 0.3, 0.32)}
        />
        <path
          d={`M${cursor.x} ${cursor.y} l0 11 l3 -3 l3 6 l2 -1 l-3 -6 l4 0 Z`}
          fill={INK}
          stroke={PAPER}
          strokeWidth={0.6}
        />
      </Scene>
    );
  },
};

/** A cloud of soft, coloured blobs is moved and reshaped until it renders the scene. */
export const splatting: Illustration = {
  duration: 5000,
  still: 0.85,
  render: (p) => {
    const fit = step(p, 0.1, 0.8);
    const target = (index: number) => {
      const t = index / 40;
      if (index < 16) {
        const angle = t * TAU * 2.5;
        return {
          x: 120 + Math.cos(angle) * 26,
          y: 58 + Math.sin(angle) * 22,
          hue: 2,
          rx: 9,
          ry: 7,
        };
      }
      if (index < 22)
        return {
          x: 120 + (rand(index) - 0.5) * 6,
          y: 86 + (index - 16) * 7,
          hue: 4,
          rx: 4,
          ry: 6,
        };
      return {
        x: 60 + (index - 22) * 7,
        y: 128 + (rand(index) - 0.5) * 4,
        hue: 1,
        rx: 8,
        ry: 4,
      };
    };
    return (
      <g>
        <Panel x={20} y={8} w={200} h={136} fill={PAPER} />
        {Array.from({ length: 40 }, (_, index) => {
          const goal = target(index);
          const start = {
            x: 30 + rand(index) * 180,
            y: 18 + rand(index + 40) * 116,
          };
          const angle = lerp(rand(index + 80) * 180, 0, fit);
          const x = lerp(start.x, goal.x, fit);
          const y = lerp(start.y, goal.y, fit);
          return (
            <ellipse
              key={index}
              cx={x}
              cy={y}
              rx={lerp(14, goal.rx, fit)}
              ry={lerp(10, goal.ry, fit)}
              transform={`rotate(${angle} ${x} ${y})`}
              fill={HUES[goal.hue]}
              opacity={lerp(0.25, 0.7, fit)}
            />
          );
        })}
      </g>
    );
  },
};

/** From a single photo the model estimates how far away every pixel is. */
export const depthMap: Illustration = {
  duration: 5000,
  still: 0.6,
  render: (p, uid) => {
    const sweep = lerp(0, SCENE.width, step(p, 0.1, 0.75));
    const depth = { tree: 0.35, person: 0.65, car: 1 };
    return (
      <Scene x={42} y={10} scale={1.42}>
        <defs>
          <clipPath id={`${uid}-depth`}>
            <rect x={0} y={0} width={sweep} height={SCENE.height} />
          </clipPath>
          <linearGradient id={`${uid}-ground`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor={ERA} stopOpacity={0.1} />
            <stop offset="1" stopColor={ERA} stopOpacity={0.6} />
          </linearGradient>
        </defs>
        <g clipPath={`url(#${uid}-depth)`}>
          <rect
            x={0}
            y={0}
            width={SCENE.width}
            height={SCENE.height}
            rx={6}
            fill={INK}
          />
          <rect
            x={0.5}
            y={0.5}
            width={SCENE.width - 1}
            height={SCENE.height - 1}
            rx={6}
            fill={`url(#${uid}-ground)`}
          />
          {SCENE_OBJECTS.map((object) => (
            <g key={object.key} opacity={depth[object.key]}>
              <SceneObjectShape object={object.key} fill={ERA} />
            </g>
          ))}
        </g>
        <line
          x1={sweep}
          y1={0}
          x2={sweep}
          y2={SCENE.height}
          stroke={ACCENT}
          strokeWidth={1.4}
        />
      </Scene>
    );
  },
};

/** Frames are generated together from noise, so the motion stays consistent over time. */
export const videoFrames: Illustration = {
  duration: 6000,
  still: 0.9,
  render: (p) => {
    const clean = step(p, 0.1, 0.6);
    const play = ramp(p, 0.62, 1);
    const frame = Math.floor(p * 30);
    const ball = (index: number) => ({
      x: 12 + index * 10,
      y: 40 - Math.sin((index / 3) * Math.PI) * 18,
    });
    const playing = Math.min(3, Math.floor(play * 4));
    return (
      <g>
        {Array.from({ length: 4 }, (_, index) => {
          const x = 10 + index * 56;
          const position = ball(index);
          return (
            <g key={index}>
              <rect
                x={x}
                y={20}
                width={52}
                height={56}
                rx={4}
                fill={SOFT}
                stroke={play > 0 && index === playing ? ERA : LINE}
                strokeWidth={play > 0 && index === playing ? 2.5 : 1}
              />
              <rect
                x={x + 1}
                y={62}
                width={50}
                height={13}
                fill={LINE}
                opacity={0.6}
              />
              <circle
                cx={x + position.x}
                cy={20 + position.y}
                r={7}
                fill={HUES[1]}
              />
              {Array.from({ length: 20 }, (_, cell) => (
                <rect
                  key={cell}
                  x={x + (cell % 5) * 10.4}
                  y={20 + Math.floor(cell / 5) * 14}
                  width={10.4}
                  height={14}
                  fill={
                    HUES[Math.floor(rand(cell + index * 20 + frame * 3) * 6)]
                  }
                  opacity={(1 - clean) * 0.8}
                />
              ))}
            </g>
          );
        })}
        <rect x={10} y={96} width={220} height={6} rx={3} fill={SOFT} />
        <rect x={10} y={96} width={220 * play} height={6} rx={3} fill={ERA} />
      </g>
    );
  },
};

/** Click an object once; a memory carries its mask through every following frame. */
export const videoMask: Illustration = {
  duration: 6000,
  still: 0.9,
  render: (p) => {
    const frames = 3;
    const clicked = step(p, 0.08, 0.15);
    return (
      <g>
        {Array.from({ length: frames }, (_, index) => {
          const x = 8 + index * 78;
          const shift = index * 14 - 30;
          const masked =
            index === 0
              ? clicked
              : step(p, 0.25 + index * 0.2, 0.35 + index * 0.2);
          return (
            <g key={index}>
              <g transform={`translate(${x} 30) scale(0.66)`}>
                <rect
                  width={110}
                  height={90}
                  rx={6}
                  fill={SOFT}
                  stroke={LINE}
                />
                <rect
                  x={0.5}
                  y={68}
                  width={109}
                  height={21.5}
                  fill={LINE}
                  opacity={0.6}
                />
                <g transform={`translate(${shift} 0)`}>
                  <SceneObjectShape
                    object="car"
                    fill={masked > 0.5 ? ERA : undefined}
                  />
                </g>
              </g>
              {index > 0 ? (
                <path
                  d={`M${x - 14} 24 Q ${x - 6} 12 ${x + 2} 24`}
                  fill="none"
                  stroke={ACCENT}
                  strokeWidth={1.6}
                  opacity={masked}
                />
              ) : (
                <circle
                  cx={x + (82 + shift) * 0.66}
                  cy={30 + 58 * 0.66}
                  r={3}
                  fill={ACCENT}
                  stroke={PAPER}
                  opacity={clicked}
                />
              )}
            </g>
          );
        })}
        <rect
          x={40}
          y={110}
          width={160}
          height={16}
          rx={8}
          fill={SOFT}
          stroke={LINE}
        />
        {Array.from({ length: 3 }, (_, index) => (
          <rect
            key={index}
            x={50 + index * 50}
            y={115}
            width={40}
            height={6}
            rx={3}
            fill={ACCENT}
            opacity={step(p, 0.15 + index * 0.2, 0.25 + index * 0.2)}
          />
        ))}
      </g>
    );
  },
};

/** A short noun phrase finds and masks every instance of that concept, not just one. */
export const conceptMask: Illustration = {
  duration: 5000,
  still: 0.9,
  render: (p) => {
    const masks = [0, 1, 2].map((index) =>
      step(p, 0.35 + index * 0.05, 0.5 + index * 0.05),
    );
    const trees = [
      { x: 30, y: 40, s: 1 },
      { x: 92, y: 50, s: 0.8 },
      { x: 170, y: 44, s: 0.95 },
    ];
    return (
      <g>
        <rect
          x={80}
          y={6}
          width={80}
          height={20}
          rx={10}
          fill={SOFT}
          stroke={LINE}
        />
        <rect
          x={94}
          y={11}
          width={52}
          height={10}
          rx={5}
          fill={ERA}
          opacity={step(p, 0.05, 0.2)}
        />
        <Panel x={10} y={32} w={220} h={110} />
        <rect
          x={11}
          y={112}
          width={218}
          height={29}
          fill={LINE}
          opacity={0.6}
        />
        <g transform="translate(86 63) scale(0.8)">
          <SceneObjectShape object="car" />
        </g>
        {trees.map((tree, index) => (
          <g
            key={index}
            transform={`translate(${tree.x} ${tree.y}) scale(${tree.s * 1.5})`}
          >
            <SceneObjectShape
              object="tree"
              fill={masks[index]! > 0.5 ? ERA : undefined}
            />
            <rect
              x={3}
              y={24}
              width={28}
              height={45}
              rx={2}
              fill="none"
              stroke={ERA}
              strokeWidth={1.2}
              opacity={masks[index]}
            />
          </g>
        ))}
      </g>
    );
  },
};
