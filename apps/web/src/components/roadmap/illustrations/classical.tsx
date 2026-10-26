import {
  ACCENT,
  Arrow,
  ClipRect,
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
  SOFT,
  step,
  TAU,
} from "./kit";

/** A photo is sampled line by line into a grid of numbers: the first digital image. */
export const pixelScan: Illustration = {
  duration: 4500,
  still: 0.8,
  render: (p, uid) => {
    const progress = ramp(p, 0.05, 0.8);
    const cells = 10;
    const size = 9;
    const shown = Math.floor(progress * cells * cells);
    const inside = (x: number, y: number) =>
      (x - 45) ** 2 + (y - 38) ** 2 <= 17 ** 2 ||
      ((x - 45) / 32) ** 2 + ((y - 86) / 24) ** 2 <= 1;
    return (
      <g>
        <clipPath id={`${uid}-photo`}>
          <rect x={15} y={30} width={90} height={90} rx={6} />
        </clipPath>
        <Panel x={15} y={30} w={90} h={90} />
        <g clipPath={`url(#${uid}-photo)`}>
          <circle cx={60} cy={68} r={17} fill={INK} opacity={0.75} />
          <ellipse cx={60} cy={116} rx={32} ry={24} fill={INK} opacity={0.75} />
          <rect
            x={15}
            y={30 + progress * 90 - 1}
            width={90}
            height={2}
            fill={ERA}
            opacity={progress < 1 ? 1 : 0}
          />
        </g>
        <Arrow x1={112} y1={75} x2={128} y2={75} />
        {Array.from({ length: cells * cells }, (_, index) => {
          const row = Math.floor(index / cells);
          const col = index % cells;
          const on = inside(col * size + size / 2, row * size + size / 2);
          return (
            <rect
              key={index}
              x={135 + col * size}
              y={30 + row * size}
              width={size - 1}
              height={size - 1}
              rx={1}
              fill={on ? ERA : SOFT}
              opacity={index < shown ? (on ? 0.9 : 1) : 0.15}
            />
          );
        })}
      </g>
    );
  },
};

/** A single neuron learns a line that separates two classes of points. */
export const perceptron: Illustration = {
  still: 0.9,
  render: (p, uid) => {
    const angle = lerp(1.15, -0.55, step(p, 0.1, 0.75));
    const cx = 82;
    const cy = 78;
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    const points = Array.from({ length: 16 }, (_, index) => {
      const positive = index % 2 === 0;
      const x = (positive ? 50 : 112) + (rand(index) - 0.5) * 50;
      const y = (positive ? 52 : 104) + (rand(index + 40) - 0.5) * 40;
      const side = (x - cx) * dy - (y - cy) * dx < 0;
      return { x, y, positive, correct: side !== positive };
    });
    const fire = pulse(p, 0.78, 0.82, 0.9, 0.97);
    return (
      <g>
        <Panel x={12} y={18} w={146} h={118} fill={PAPER} />
        {points.map((point, index) =>
          point.positive ? (
            <circle
              key={index}
              cx={point.x}
              cy={point.y}
              r={4}
              fill={ERA}
              stroke={point.correct ? "none" : INK}
              strokeWidth={1.5}
            />
          ) : (
            <rect
              key={index}
              x={point.x - 4}
              y={point.y - 4}
              width={8}
              height={8}
              fill={ACCENT}
              stroke={point.correct ? "none" : INK}
              strokeWidth={1.5}
            />
          ),
        )}
        <ClipRect uid={uid} x={12} y={18} w={146} h={118}>
          <line
            x1={cx - dx * 90}
            y1={cy - dy * 90}
            x2={cx + dx * 90}
            y2={cy + dy * 90}
            stroke={INK}
            strokeWidth={2}
            strokeDasharray="5 4"
          />
        </ClipRect>
        {[44, 75, 106].map((y, index) => (
          <g key={y}>
            <circle cx={178} cy={y} r={6} fill={SOFT} stroke={LINE} />
            <line
              x1={184}
              y1={y}
              x2={205}
              y2={75}
              stroke={ERA}
              strokeWidth={1 + Math.abs(Math.sin(angle * (index + 1))) * 2.5}
              opacity={0.7}
            />
          </g>
        ))}
        <circle
          cx={212}
          cy={75}
          r={9}
          fill={ERA}
          opacity={0.35 + fire * 0.65}
        />
        <Arrow x1={222} y1={75} x2={234} y2={75} color={INK} />
      </g>
    );
  },
};

/** A visual-cortex cell fires only for edges at its preferred orientation. */
export const orientationCell: Illustration = {
  duration: 5000,
  still: 0.5,
  render: (p) => {
    const angle = p * 180;
    const response = Math.exp(-(((angle - 90) / 22) ** 2));
    const tick = Math.floor(p * 90);
    const spikes = Array.from({ length: 40 }, (_, back) => {
      const time = tick - back;
      const then = (((time / 90) % 1) + 1) % 1;
      const strength = Math.exp(-(((then * 180 - 90) / 22) ** 2));
      return strength > 0.35 && rand(time) < strength ? back : null;
    }).filter((value): value is number => value !== null);
    return (
      <g>
        <circle cx={58} cy={75} r={42} fill={SOFT} stroke={LINE} />
        <g transform={`rotate(${angle} 58 75)`}>
          <rect x={22} y={70} width={72} height={10} rx={5} fill={INK} />
        </g>
        <circle
          cx={58}
          cy={75}
          r={42}
          fill="none"
          stroke={ERA}
          strokeWidth={3}
          opacity={response}
        />
        <circle
          cx={124}
          cy={75}
          r={9 + response * 3}
          fill={ERA}
          opacity={0.3 + response * 0.7}
        />
        <line x1={100} y1={75} x2={114} y2={75} stroke={LINE} strokeWidth={2} />
        <line x1={134} y1={75} x2={228} y2={75} stroke={LINE} strokeWidth={2} />
        {spikes.map((back) => (
          <line
            key={back}
            x1={228 - back * 2.3}
            y1={75}
            x2={228 - back * 2.3}
            y2={52}
            stroke={ERA}
            strokeWidth={2}
            strokeLinecap="round"
          />
        ))}
      </g>
    );
  },
};

/** Points on a line each vote for every line through them; the votes meet at one peak. */
export const houghVoting: Illustration = {
  duration: 5000,
  still: 0.95,
  render: (p, uid) => {
    const points = [
      [12, 70],
      [28, 62],
      [44, 54],
      [60, 46],
      [76, 38],
      [30, 22],
      [70, 74],
    ] as const;
    // Parameter space panel: theta along x, rho (about -75…110 here) along y.
    const rhoY = (rho: number) => 116 - (rho + 75) * 0.45;
    const curve = (x: number, y: number, until: number) => {
      const steps = 48;
      const parts: string[] = [];
      for (let index = 0; index <= steps * until; index++) {
        const theta = (index / steps) * Math.PI;
        const rho = x * Math.cos(theta) + y * Math.sin(theta);
        parts.push(
          `${index === 0 ? "M" : "L"}${132 + (index / steps) * 96} ${rhoY(rho)}`,
        );
      }
      return parts.join(" ");
    };
    const lineShown = step(p, 0.8, 0.9);
    const theta = Math.atan2(-16, -8) + Math.PI;
    const rho = 12 * Math.cos(theta) + 70 * Math.sin(theta);
    return (
      <g>
        <Panel x={12} y={30} w={100} h={90} fill={PAPER} />
        <line
          x1={14}
          y1={108}
          x2={110}
          y2={60}
          stroke={ERA}
          strokeWidth={2}
          opacity={lineShown}
        />
        {points.map(([x, y], index) => (
          <circle
            key={index}
            cx={14 + x}
            cy={32 + y}
            r={3.5}
            fill={index < 5 ? INK : MUTED}
            opacity={step(p, index * 0.1, index * 0.1 + 0.05)}
          />
        ))}
        <Panel x={128} y={30} w={104} h={90} fill={PAPER} />
        <ClipRect uid={uid} x={128} y={30} w={104} h={90}>
          {points.map(([x, y], index) => (
            <path
              key={index}
              d={curve(x, y, ramp(p, index * 0.1, index * 0.1 + 0.15))}
              fill="none"
              stroke={index < 5 ? ERA : MUTED}
              strokeWidth={1.4}
              opacity={0.75}
            />
          ))}
        </ClipRect>
        <circle
          cx={132 + (theta / Math.PI) * 96}
          cy={rhoY(rho)}
          r={4 + lineShown * 4}
          fill="none"
          stroke={INK}
          strokeWidth={2}
          opacity={step(p, 0.72, 0.8)}
        />
      </g>
    );
  },
};

/** A block is read as edges and junctions, then understood as a solid in 3D. */
export const wireframe: Illustration = {
  duration: 6000,
  still: 0.6,
  render: (p) => {
    const turn = p * TAU;
    const tilt = 0.45;
    const vertices = [-1, 1].flatMap((x) =>
      [-1, 1].flatMap((y) => [-1, 1].map((z) => [x, y * 0.8, z] as const)),
    );
    const project = ([x, y, z]: readonly [number, number, number]) => {
      const rx = x * Math.cos(turn) + z * Math.sin(turn);
      const rz = -x * Math.sin(turn) + z * Math.cos(turn);
      const ry = y * Math.cos(tilt) - rz * Math.sin(tilt);
      const depth = y * Math.sin(tilt) + rz * Math.cos(tilt);
      const scale = 34 / (1 - depth * 0.15);
      return { x: 120 + rx * scale, y: 78 + ry * scale };
    };
    const projected = vertices.map(project);
    const edges: [number, number][] = [];
    for (let a = 0; a < 8; a++) {
      for (let b = a + 1; b < 8; b++) {
        const differs = [0, 1, 2].filter(
          (axis) => vertices[a]![axis] !== vertices[b]![axis],
        );
        if (differs.length === 1) edges.push([a, b]);
      }
    }
    const solid = step(p, 0.55, 0.75) * (1 - step(p, 0.9, 1));
    return (
      <g>
        <Panel x={40} y={14} w={160} h={122} fill={PAPER} />
        {edges.map(([a, b], index) => (
          <line
            key={index}
            x1={projected[a]!.x}
            y1={projected[a]!.y}
            x2={projected[b]!.x}
            y2={projected[b]!.y}
            stroke={ERA}
            strokeWidth={2}
            strokeLinecap="round"
          />
        ))}
        {projected.map((vertex, index) => (
          <circle
            key={index}
            cx={vertex.x}
            cy={vertex.y}
            r={3}
            fill={INK}
            opacity={1 - solid * 0.6}
          />
        ))}
        <polygon
          points={[0, 1, 3, 2]
            .map((i) => `${projected[i]!.x},${projected[i]!.y}`)
            .join(" ")}
          fill={ERA}
          opacity={solid * 0.25}
        />
        <polygon
          points={[4, 5, 7, 6]
            .map((i) => `${projected[i]!.x},${projected[i]!.y}`)
            .join(" ")}
          fill={ERA}
          opacity={solid * 0.25}
        />
      </g>
    );
  },
};

/** Any signal is a sum of waves; keeping the strongest frequencies keeps the picture. */
export const fourier: Illustration = {
  duration: 5000,
  still: 0.85,
  render: (p) => {
    const terms = 1 + Math.min(3, Math.floor(ramp(p, 0, 0.8) * 4));
    const shift = p * TAU;
    const wave = (n: number, x: number) =>
      Math.sin(n * ((x / 120) * TAU * 1.5 + shift)) / n;
    const path = (fn: (x: number) => number, y0: number, amp: number) =>
      Array.from({ length: 61 }, (_, index) => {
        const x = index * 2;
        return `${index === 0 ? "M" : "L"}${14 + x} ${y0 - fn(x) * amp}`;
      }).join(" ");
    const sum = (x: number) => {
      let total = 0;
      for (let k = 0; k < terms; k++) total += wave(2 * k + 1, x);
      return total;
    };
    const square = (x: number) =>
      Math.sign(Math.sin((x / 120) * TAU * 1.5 + shift)) * (Math.PI / 4);
    return (
      <g>
        <Panel x={8} y={10} w={132} h={56} fill={PAPER} />
        <path
          d={path(square, 38, 22)}
          fill="none"
          stroke={LINE}
          strokeWidth={2}
        />
        <path
          d={path(sum, 38, 22)}
          fill="none"
          stroke={ERA}
          strokeWidth={2.2}
        />
        {Array.from({ length: 4 }, (_, k) => (
          <path
            key={k}
            d={path((x) => wave(2 * k + 1, x), 84 + k * 16, 14)}
            fill="none"
            stroke={k < terms ? ACCENT : LINE}
            strokeWidth={1.4}
            opacity={k < terms ? 0.9 : 0.5}
          />
        ))}
        <Panel x={158} y={10} w={74} h={130} fill={PAPER} />
        {Array.from({ length: 6 }, (_, k) => {
          const height = (100 / (2 * k + 1)) * (k < terms ? 1 : 0.12);
          return (
            <rect
              key={k}
              x={166 + k * 11}
              y={130 - height}
              width={8}
              height={height}
              rx={2}
              fill={k < terms ? ERA : MUTED}
              opacity={k < terms ? 1 : 0.35}
            />
          );
        })}
      </g>
    );
  },
};

/**
 * How bright a surface looks reveals which way it faces, and so its shape. The sphere is a
 * fixed grey in both themes so that "bright" always means "facing the light".
 */
export const shading: Illustration = {
  duration: 5000,
  still: 0.3,
  render: (p, uid) => {
    const angle = p * TAU;
    const lx = Math.cos(angle);
    const ly = Math.sin(angle) * 0.6 - 0.3;
    return (
      <g>
        <defs>
          <radialGradient
            id={`${uid}-light`}
            cx={0.5 + lx * 0.3}
            cy={0.5 + ly * 0.3}
            r={0.75}
          >
            <stop offset="0" stopColor="#f8fafc" />
            <stop offset="0.55" stopColor="#94a3b8" />
            <stop offset="1" stopColor="#1e293b" />
          </radialGradient>
        </defs>
        <Panel x={30} y={8} w={180} h={134} fill={SOFT} />
        <circle cx={120} cy={78} r={44} fill={`url(#${uid}-light)`} />
        {[-0.6, 0, 0.6].flatMap((u) =>
          [-0.6, 0, 0.6].map((v) => {
            const nz = Math.sqrt(Math.max(0, 1 - u * u - v * v));
            return (
              <Arrow
                key={`${u}${v}`}
                x1={120 + u * 44}
                y1={78 + v * 44}
                x2={120 + u * 44 + u * 16}
                y2={78 + v * 44 + v * 16 - (1 - nz) * 2}
                color={ERA}
                width={1.4}
              />
            );
          }),
        )}
        <circle cx={120 + lx * 78} cy={74 + ly * 70} r={7} fill={HUES[4]} />
      </g>
    );
  },
};

/** A histogram of brightness; the threshold slides to the valley between the two peaks. */
export const histogramThreshold: Illustration = {
  duration: 5000,
  still: 0.9,
  render: (p) => {
    const grid = 8;
    const values = Array.from({ length: grid * grid }, (_, index) => {
      const row = Math.floor(index / grid);
      const col = index % grid;
      const object = (col - 3.5) ** 2 + (row - 3.5) ** 2 < 7.5;
      return clampValue((object ? 0.78 : 0.24) + (rand(index) - 0.5) * 0.3);
    });
    const threshold = lerp(0.12, 0.5, step(p, 0.08, 0.6));
    const binary = step(p, 0.62, 0.7);
    const bins = Array.from({ length: 12 }, () => 0);
    for (const value of values)
      bins[Math.min(11, Math.floor(value * 12))]! += 1;
    return (
      <g>
        {values.map((value, index) => {
          const above = value > threshold;
          return (
            <rect
              key={index}
              x={14 + (index % grid) * 13}
              y={22 + Math.floor(index / grid) * 13}
              width={12}
              height={12}
              rx={1.5}
              fill={above && binary > 0.5 ? ERA : INK}
              opacity={lerp(value * 0.9 + 0.05, above ? 1 : 0.06, binary)}
            />
          );
        })}
        <Panel x={128} y={22} w={104} h={104} fill={PAPER} />
        {bins.map((count, index) => (
          <rect
            key={index}
            x={134 + index * 8}
            y={118 - count * 4}
            width={6}
            height={count * 4}
            rx={1}
            fill={(index + 0.5) / 12 > threshold ? ERA : MUTED}
          />
        ))}
        <line
          x1={134 + threshold * 96}
          y1={30}
          x2={134 + threshold * 96}
          y2={120}
          stroke={INK}
          strokeWidth={2}
          strokeDasharray="4 3"
        />
      </g>
    );
  },
};

function clampValue(value: number) {
  return Math.min(1, Math.max(0, value));
}

/** A filter sweeps across the image and keeps only where brightness changes sharply. */
export const edgeDetect: Illustration = {
  still: 0.55,
  render: (p, uid) => {
    const sweep = lerp(30, 210, step(p, 0.05, 0.85));
    const house =
      "M50 118 L50 72 L95 40 L140 72 L140 118 Z M150 118 L150 86 L190 86 L190 118 Z";
    const details =
      "M80 118 L80 92 L102 92 L102 118 M112 82 L130 82 L130 98 L112 98 Z M160 96 L180 96";
    return (
      <g>
        <clipPath id={`${uid}-before`}>
          <rect x={sweep} y={0} width={240} height={150} />
        </clipPath>
        <clipPath id={`${uid}-after`}>
          <rect x={0} y={0} width={sweep} height={150} />
        </clipPath>
        <Panel x={30} y={22} w={180} h={110} />
        <g clipPath={`url(#${uid}-before)`}>
          <path d={house} fill={MUTED} />
          <path d={details} fill={INK} stroke={INK} opacity={0.5} />
        </g>
        <g clipPath={`url(#${uid}-after)`}>
          <rect x={31} y={23} width={178} height={108} rx={5} fill={PAPER} />
          <path
            d={house}
            fill="none"
            stroke={ERA}
            strokeWidth={2.2}
            strokeLinejoin="round"
          />
          <path d={details} fill="none" stroke={ERA} strokeWidth={1.6} />
        </g>
        <line
          x1={sweep}
          y1={16}
          x2={sweep}
          y2={138}
          stroke={INK}
          strokeWidth={2}
        />
        <g transform={`translate(${sweep - 9} 4)`}>
          {[0, 1, 2].map((row) =>
            [0, 1, 2].map((col) => (
              <rect
                key={`${row}${col}`}
                x={col * 6}
                y={row * 6 - 2}
                width={5}
                height={5}
                fill={col === 0 ? INK : col === 2 ? ERA : SOFT}
                stroke={LINE}
                strokeWidth={0.5}
              />
            )),
          )}
        </g>
      </g>
    );
  },
};

/** The same image is blurred more and more; each blob is found at the scale that fits it. */
export const scaleSpace: Illustration = {
  duration: 5000,
  still: 0.5,
  render: (p, uid) => {
    const levels = [0, 1.5, 3, 5];
    const active = Math.min(3, Math.floor(p * 4));
    const blobs = [
      { x: 22, y: 26, r: 5, level: 0 },
      { x: 62, y: 30, r: 9, level: 1 },
      { x: 40, y: 58, r: 13, level: 2 },
    ];
    return (
      <g>
        <defs>
          {levels.map((blur, index) => (
            <filter key={index} id={`${uid}-blur${index}`}>
              <feGaussianBlur stdDeviation={blur} />
            </filter>
          ))}
        </defs>
        {levels.map((_, index) => {
          const x = 14 + index * 52;
          const y = 26 + index * 6;
          const scale = 1 - index * 0.1;
          return (
            <g key={index} transform={`translate(${x} ${y}) scale(${scale})`}>
              <rect
                width={88}
                height={88}
                rx={6}
                fill={PAPER}
                stroke={index === active ? ERA : LINE}
                strokeWidth={index === active ? 2.5 : 1}
              />
              <g filter={`url(#${uid}-blur${index})`}>
                {blobs.map((blob) => (
                  <circle
                    key={blob.x}
                    cx={blob.x}
                    cy={blob.y}
                    r={blob.r}
                    fill={INK}
                  />
                ))}
              </g>
              {blobs
                .filter((blob) => blob.level === index && index === active)
                .map((blob) => (
                  <circle
                    key={blob.x}
                    cx={blob.x}
                    cy={blob.y}
                    r={blob.r + 6}
                    fill="none"
                    stroke={ERA}
                    strokeWidth={2.5}
                  />
                ))}
            </g>
          );
        })}
      </g>
    );
  },
};

/** Every pixel gets an arrow that says where it moved between two frames. */
export const opticalFlow: Illustration = {
  duration: 3600,
  still: 0.2,
  render: (p) => {
    const x = 120 + Math.sin(p * TAU) * 62;
    const velocity = Math.cos(p * TAU);
    const y = 76;
    return (
      <g>
        <Panel x={10} y={14} w={220} h={122} fill={PAPER} />
        <circle
          cx={x - velocity * 14}
          cy={y}
          r={20}
          fill={ERA}
          opacity={0.18}
        />
        <circle cx={x} cy={y} r={20} fill={ERA} opacity={0.75} />
        {Array.from({ length: 12 * 6 }, (_, index) => {
          const gx = 22 + (index % 12) * 18;
          const gy = 26 + Math.floor(index / 12) * 20;
          const near = Math.exp(-(((gx - x) ** 2 + (gy - y) ** 2) / 900));
          const length = velocity * near * 16;
          return Math.abs(length) < 1.2 ? (
            <circle key={index} cx={gx} cy={gy} r={1.2} fill={MUTED} />
          ) : (
            <Arrow
              key={index}
              x1={gx - length / 2}
              y1={gy}
              x2={gx + length / 2}
              y2={gy}
              color={INK}
              width={1.4}
            />
          );
        })}
      </g>
    );
  },
};

/** Guess a line from two random points, count who agrees, keep the best guess. */
export const ransac: Illustration = {
  duration: 6000,
  still: 0.9,
  render: (p, uid) => {
    const inliers = Array.from({ length: 12 }, (_, index) => {
      const x = 24 + index * 15 + (rand(index) - 0.5) * 6;
      return { x, y: 112 - (x - 24) * 0.42 + (rand(index + 9) - 0.5) * 8 };
    });
    const outliers = Array.from({ length: 8 }, (_, index) => ({
      x: 30 + rand(index + 20) * 170,
      y: 24 + rand(index + 30) * 60,
    }));
    const all = [...inliers, ...outliers];
    const trials: [number, number][] = [
      [13, 17],
      [2, 15],
      [1, 10],
    ];
    const trial = Math.min(2, Math.floor(ramp(p, 0, 0.75) * 3));
    const settled = step(p, 0.75, 0.82);
    const [a, b] = trials[trial]!;
    const pa = all[a]!;
    const pb = all[b]!;
    const slope = (pb.y - pa.y) / (pb.x - pa.x);
    const yAt = (x: number) => pa.y + (x - pa.x) * slope;
    const votes = all.filter(
      (point) => Math.abs(point.y - yAt(point.x)) < 9,
    ).length;
    return (
      <g>
        <Panel x={12} y={14} w={204} h={122} fill={PAPER} />
        <ClipRect uid={uid} x={12} y={14} w={204} h={122}>
          <path
            d={`M14 ${yAt(14) - 9} L214 ${yAt(214) - 9} L214 ${yAt(214) + 9} L14 ${yAt(14) + 9} Z`}
            fill={ERA}
            opacity={0.12}
          />
          <line
            x1={14}
            y1={yAt(14)}
            x2={214}
            y2={yAt(214)}
            stroke={settled > 0.5 ? ERA : INK}
            strokeWidth={2}
            strokeDasharray={settled > 0.5 ? undefined : "5 4"}
          />
        </ClipRect>
        {all.map((point, index) => {
          const agrees = Math.abs(point.y - yAt(point.x)) < 9;
          return (
            <circle
              key={index}
              cx={point.x}
              cy={point.y}
              r={index === a || index === b ? 5 : 3.2}
              fill={agrees ? ERA : MUTED}
              stroke={index === a || index === b ? INK : "none"}
              strokeWidth={2}
            />
          );
        })}
        <rect
          x={222}
          y={136 - votes * 6}
          width={10}
          height={votes * 6}
          rx={2}
          fill={ERA}
        />
      </g>
    );
  },
};

/** Two cameras see the same point; tracing both rays back recovers where it is in 3D. */
export const twoView: Illustration = {
  duration: 5000,
  still: 0.3,
  render: (p) => {
    const point = {
      x: 120 + Math.sin(p * TAU) * 40,
      y: 52 + Math.cos(p * TAU * 2) * 12,
    };
    const cameras = [
      { x: 44, y: 124, angle: -0.95 },
      { x: 196, y: 124, angle: -2.2 },
    ];
    return (
      <g>
        <line
          x1={44}
          y1={124}
          x2={196}
          y2={124}
          stroke={LINE}
          strokeDasharray="4 4"
          strokeWidth={1.5}
        />
        {cameras.map((camera, index) => {
          const plane = 26;
          const dx = Math.cos(camera.angle);
          const dy = Math.sin(camera.angle);
          const px = camera.x + dx * plane;
          const py = camera.y + dy * plane;
          // Where the ray to the point crosses the image plane.
          const rx = point.x - camera.x;
          const ry = point.y - camera.y;
          const along = (rx * dx + ry * dy) / plane;
          const hit = { x: camera.x + rx / along, y: camera.y + ry / along };
          return (
            <g key={index}>
              <line
                x1={px - dy * 18}
                y1={py + dx * 18}
                x2={px + dy * 18}
                y2={py - dx * 18}
                stroke={INK}
                strokeWidth={2.5}
                strokeLinecap="round"
              />
              <line
                x1={camera.x}
                y1={camera.y}
                x2={point.x}
                y2={point.y}
                stroke={ERA}
                strokeWidth={1.5}
                opacity={0.8}
              />
              <circle cx={hit.x} cy={hit.y} r={3} fill={ACCENT} />
              <g
                transform={`translate(${camera.x} ${camera.y}) rotate(${(camera.angle * 180) / Math.PI})`}
              >
                <path d="M4 0 L-10 -8 L-10 8 Z" fill={INK} />
              </g>
            </g>
          );
        })}
        <circle cx={point.x} cy={point.y} r={6} fill={ERA} />
        <circle
          cx={point.x}
          cy={point.y}
          r={11}
          fill="none"
          stroke={ERA}
          opacity={0.4}
        />
      </g>
    );
  },
};

/** Photos of a printed checkerboard from several angles pin down the camera's lens. */
export const calibration: Illustration = {
  duration: 6000,
  still: 0.3,
  render: (p) => {
    const poses = [
      [
        [60, 30],
        [170, 40],
        [176, 118],
        [52, 112],
      ],
      [
        [82, 22],
        [184, 34],
        [160, 124],
        [70, 112],
      ],
      [
        [48, 40],
        [152, 20],
        [170, 104],
        [62, 128],
      ],
    ] as const;
    const phase = (p * 3) % 1;
    const index = Math.floor(p * 3) % 3;
    const from = poses[index]!;
    const to = poses[(index + 1) % 3]!;
    const move = step(phase, 0.75, 1);
    const corners = from.map(([x, y], i) => [
      lerp(x, to[i]![0], move),
      lerp(y, to[i]![1], move),
    ]);
    const at = (u: number, v: number) => {
      const [a, b, c, d] = corners as [number[], number[], number[], number[]];
      const top = [lerp(a[0]!, b[0]!, u), lerp(a[1]!, b[1]!, u)];
      const bottom = [lerp(d[0]!, c[0]!, u), lerp(d[1]!, c[1]!, u)];
      return [
        lerp(top[0]!, bottom[0]!, v),
        lerp(top[1]!, bottom[1]!, v),
      ] as const;
    };
    const cols = 6;
    const rows = 5;
    const found = ramp(phase, 0.15, 0.6) * (1 - step(phase, 0.72, 0.76));
    return (
      <g>
        <Panel x={20} y={8} w={200} h={134} fill={PAPER} />
        {Array.from({ length: cols * rows }, (_, cell) => {
          const u = cell % cols;
          const v = Math.floor(cell / cols);
          const quad = [
            at(u / cols, v / rows),
            at((u + 1) / cols, v / rows),
            at((u + 1) / cols, (v + 1) / rows),
            at(u / cols, (v + 1) / rows),
          ];
          return (
            <polygon
              key={cell}
              points={quad.map(([x, y]) => `${x},${y}`).join(" ")}
              fill={(u + v) % 2 === 0 ? INK : SOFT}
              opacity={0.85}
            />
          );
        })}
        {Array.from({ length: (cols - 1) * (rows - 1) }, (_, corner) => {
          const u = (corner % (cols - 1)) + 1;
          const v = Math.floor(corner / (cols - 1)) + 1;
          const [x, y] = at(u / cols, v / rows);
          return (
            <circle
              key={corner}
              cx={x}
              cy={y}
              r={3}
              fill={ERA}
              stroke={PAPER}
              strokeWidth={1}
              opacity={corner / 16 < found ? 1 : 0}
            />
          );
        })}
      </g>
    );
  },
};

/** A flexible curve is pulled onto the object's boundary by image forces. */
export const snake: Illustration = {
  still: 0.75,
  render: (p) => {
    const shape = (theta: number) =>
      34 + Math.sin(theta * 3) * 8 + Math.cos(theta * 2) * 5;
    const fit = step(p, 0.1, 0.75);
    const path = (radius: (theta: number) => number) =>
      Array.from({ length: 73 }, (_, index) => {
        const theta = (index / 72) * TAU;
        const r = radius(theta);
        return `${index === 0 ? "M" : "L"}${120 + Math.cos(theta) * r} ${76 + Math.sin(theta) * r}`;
      }).join(" ") + " Z";
    const contour = (theta: number) => lerp(62, shape(theta) + 1.5, fit);
    return (
      <g>
        <Panel x={30} y={8} w={180} h={136} />
        <path d={path(shape)} fill={MUTED} opacity={0.75} />
        <path d={path(contour)} fill="none" stroke={ERA} strokeWidth={2.4} />
        {Array.from({ length: 16 }, (_, index) => {
          const theta = (index / 16) * TAU;
          const r = contour(theta);
          return (
            <circle
              key={index}
              cx={120 + Math.cos(theta) * r}
              cy={76 + Math.sin(theta) * r}
              r={3}
              fill={PAPER}
              stroke={ERA}
              strokeWidth={1.8}
            />
          );
        })}
      </g>
    );
  },
};

/** Distinctive points are found in two views of an object and matched across them. */
export const keypoints: Illustration = {
  duration: 5000,
  still: 0.85,
  render: (p) => {
    const shape = [
      [0, -26],
      [22, -8],
      [14, 22],
      [-14, 22],
      [-22, -8],
    ];
    const left = { x: 62, y: 76, angle: 0, scale: 1 };
    const right = { x: 178, y: 76, angle: 0.5, scale: 0.8 };
    const place = (view: typeof left, [x, y]: number[]) => ({
      x:
        view.x +
        (x! * Math.cos(view.angle) - y! * Math.sin(view.angle)) * view.scale,
      y:
        view.y +
        (x! * Math.sin(view.angle) + y! * Math.cos(view.angle)) * view.scale,
    });
    const polygon = (view: typeof left) =>
      shape
        .map((point) => place(view, point))
        .map(({ x, y }) => `${x},${y}`)
        .join(" ");
    const detect = ramp(p, 0.05, 0.4);
    const match = ramp(p, 0.45, 0.85);
    return (
      <g>
        <Panel x={10} y={18} w={104} h={116} />
        <Panel x={126} y={18} w={104} h={116} />
        <polygon points={polygon(left)} fill={MUTED} opacity={0.6} />
        <polygon points={polygon(right)} fill={MUTED} opacity={0.6} />
        {shape.map((point, index) => {
          const a = place(left, point);
          const b = place(right, point);
          const seen = index / shape.length < detect;
          const linked = index / shape.length < match;
          return (
            <g key={index} opacity={seen ? 1 : 0}>
              <circle
                cx={a.x}
                cy={a.y}
                r={7}
                fill="none"
                stroke={HUES[index]}
                strokeWidth={2}
              />
              <line
                x1={a.x}
                y1={a.y}
                x2={a.x + 7}
                y2={a.y - 3}
                stroke={HUES[index]}
                strokeWidth={2}
              />
              <circle
                cx={b.x}
                cy={b.y}
                r={5.6}
                fill="none"
                stroke={HUES[index]}
                strokeWidth={2}
              />
              {linked ? (
                <line
                  x1={a.x}
                  y1={a.y}
                  x2={b.x}
                  y2={b.y}
                  stroke={HUES[index]}
                  strokeWidth={1.4}
                  strokeDasharray="3 3"
                />
              ) : null}
            </g>
          );
        })}
      </g>
    );
  },
};

/** Each neighbour is compared with the centre pixel; the bits form a texture code. */
export const lbp: Illustration = {
  duration: 5000,
  still: 0.85,
  render: (p) => {
    const values = [6, 8, 3, 9, 5, 2, 7, 4, 1];
    const ring = [0, 1, 2, 5, 8, 7, 6, 3];
    const done = Math.floor(ramp(p, 0.05, 0.75) * 8);
    const bits = ring.map((cell) => (values[cell]! >= values[4]! ? 1 : 0));
    return (
      <g>
        {values.map((value, index) => {
          const x = 24 + (index % 3) * 30;
          const y = 24 + Math.floor(index / 3) * 30;
          const order = ring.indexOf(index);
          const checked = order !== -1 && order < done;
          const current = order === done;
          return (
            <g key={index}>
              <rect
                x={x}
                y={y}
                width={28}
                height={28}
                rx={4}
                fill={
                  index === 4
                    ? ERA
                    : checked
                      ? bits[order]
                        ? ACCENT
                        : SOFT
                      : PAPER
                }
                opacity={index === 4 ? 0.35 : 1}
                stroke={current ? INK : LINE}
                strokeWidth={current ? 2 : 1}
              />
              <text
                x={x + 14}
                y={y + 19}
                textAnchor="middle"
                fontSize={13}
                fontWeight={600}
                fill={INK}
              >
                {value}
              </text>
            </g>
          );
        })}
        <Arrow x1={122} y1={69} x2={138} y2={69} />
        {bits.map((bit, index) => (
          <g key={index} opacity={index < done ? 1 : 0.2}>
            <rect
              x={144 + index * 11}
              y={58}
              width={10}
              height={22}
              rx={2}
              fill={bit ? ACCENT : SOFT}
              stroke={LINE}
            />
            <text
              x={149 + index * 11}
              y={73}
              textAnchor="middle"
              fontSize={10}
              fontWeight={600}
              fill={INK}
            >
              {bit}
            </text>
          </g>
        ))}
        {Array.from({ length: 8 }, (_, index) => {
          const height =
            [10, 24, 6, 30, 14, 8, 20, 12][index]! * step(p, 0.78, 0.95);
          return (
            <rect
              key={index}
              x={146 + index * 10}
              y={130 - height}
              width={8}
              height={height}
              rx={1.5}
              fill={ERA}
            />
          );
        })}
      </g>
    );
  },
};

/** Local patches are matched to a small vocabulary; the image becomes a word count. */
export const bagOfWords: Illustration = {
  duration: 5000,
  still: 0.9,
  render: (p) => {
    const patches = [
      { x: 30, y: 40, word: 0 },
      { x: 70, y: 36, word: 1 },
      { x: 44, y: 78, word: 0 },
      { x: 80, y: 90, word: 2 },
      { x: 26, y: 108, word: 3 },
      { x: 62, y: 112, word: 0 },
    ];
    const counts = [0, 0, 0, 0];
    const assigned = Math.floor(ramp(p, 0.05, 0.8) * patches.length);
    patches.slice(0, assigned).forEach((patch) => (counts[patch.word]! += 1));
    const glyph = (word: number, x: number, y: number, size: number) => {
      switch (word) {
        case 0:
          return <circle cx={x} cy={y} r={size / 2} fill={HUES[word]} />;
        case 1:
          return (
            <rect
              x={x - size / 2}
              y={y - size / 2}
              width={size}
              height={size}
              fill={HUES[word]}
            />
          );
        case 2:
          return (
            <path
              d={`M${x} ${y - size / 2} L${x + size / 2} ${y + size / 2} L${x - size / 2} ${y + size / 2} Z`}
              fill={HUES[word]}
            />
          );
        default:
          return (
            <path
              d={`M${x - size / 2} ${y} L${x} ${y - size / 2} L${x + size / 2} ${y} L${x} ${y + size / 2} Z`}
              fill={HUES[word]}
            />
          );
      }
    };
    return (
      <g>
        <Panel x={10} y={20} w={94} h={114} />
        {patches.map((patch, index) => (
          <g key={index}>
            <rect
              x={patch.x - 10}
              y={patch.y - 10}
              width={20}
              height={20}
              rx={3}
              fill="none"
              stroke={index < assigned ? HUES[patch.word] : INK}
              strokeWidth={index === assigned ? 2.4 : 1.4}
            />
            {glyph(patch.word, patch.x, patch.y, 8)}
          </g>
        ))}
        {[0, 1, 2, 3].map((word) => (
          <g key={word}>{glyph(word, 128, 36 + word * 26, 12)}</g>
        ))}
        <line
          x1={142}
          y1={130}
          x2={232}
          y2={130}
          stroke={LINE}
          strokeWidth={1.5}
        />
        {counts.map((count, word) => (
          <rect
            key={word}
            x={150 + word * 20}
            y={130 - count * 24}
            width={14}
            height={count * 24}
            rx={2}
            fill={HUES[word]}
          />
        ))}
      </g>
    );
  },
};

/** The boundary between two classes is placed to leave the widest possible margin. */
export const svmMargin: Illustration = {
  still: 0.85,
  render: (p, uid) => {
    const margin = lerp(4, 22, step(p, 0.1, 0.7));
    const angle = lerp(-0.2, -0.62, step(p, 0.1, 0.7));
    const cx = 120;
    const cy = 76;
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    const nx = -dy;
    const ny = dx;
    const line = (offset: number) => ({
      x1: cx + nx * offset - dx * 120,
      y1: cy + ny * offset - dy * 120,
      x2: cx + nx * offset + dx * 120,
      y2: cy + ny * offset + dy * 120,
    });
    const points = [
      [70, 40, 0],
      [90, 30, 0],
      [60, 70, 0],
      [96, 56, 1],
      [48, 48, 0],
      [150, 110, 0],
      [176, 96, 0],
      [140, 124, 0],
      [148, 92, 1],
      [190, 118, 0],
    ] as const;
    return (
      <g>
        <Panel x={20} y={10} w={200} h={130} fill={PAPER} />
        <ClipRect uid={uid} x={20} y={10} w={200} h={130}>
          <polygon
            points={[line(-margin), line(margin)]
              .flatMap((l, i) =>
                i === 0
                  ? [`${l.x1},${l.y1}`, `${l.x2},${l.y2}`]
                  : [`${l.x2},${l.y2}`, `${l.x1},${l.y1}`],
              )
              .join(" ")}
            fill={ERA}
            opacity={0.14}
          />
          <line {...line(0)} stroke={ERA} strokeWidth={2.4} />
          <line
            {...line(margin)}
            stroke={ERA}
            strokeWidth={1.2}
            strokeDasharray="4 4"
          />
          <line
            {...line(-margin)}
            stroke={ERA}
            strokeWidth={1.2}
            strokeDasharray="4 4"
          />
        </ClipRect>
        {points.map(([x, y, support], index) => (
          <g key={index}>
            {index < 5 ? (
              <circle cx={x} cy={y} r={5} fill={INK} />
            ) : (
              <rect x={x - 5} y={y - 5} width={10} height={10} fill={ACCENT} />
            )}
            {support ? (
              <circle
                cx={x}
                cy={y}
                r={10}
                fill="none"
                stroke={INK}
                strokeWidth={1.5}
                opacity={step(p, 0.65, 0.8)}
              />
            ) : null}
          </g>
        ))}
      </g>
    );
  },
};

/** Noise is smoothed away, but only among similar neighbours, so the edge stays sharp. */
export const bilateral: Illustration = {
  still: 0.95,
  render: (p) => {
    const xs = Array.from({ length: 41 }, (_, index) => index);
    const clean = (i: number) => (i < 20 ? 100 : 48);
    const noisy = (i: number) => clean(i) + (rand(i) - 0.5) * 22;
    const blurred = (i: number) => {
      let total = 0;
      let weight = 0;
      for (let k = -4; k <= 4; k++) {
        const j = Math.min(40, Math.max(0, i + k));
        const w = Math.exp(-(k * k) / 8);
        total += noisy(j) * w;
        weight += w;
      }
      return total / weight;
    };
    const edgeAware = (i: number) => {
      let total = 0;
      let weight = 0;
      for (let k = -4; k <= 4; k++) {
        const j = Math.min(40, Math.max(0, i + k));
        const w =
          Math.exp(-(k * k) / 8) *
          Math.exp(-((noisy(j) - noisy(i)) ** 2) / 300);
        total += noisy(j) * w;
        weight += w;
      }
      return total / weight;
    };
    const sweep = Math.floor(step(p, 0.05, 0.85) * 40);
    const path = (fn: (i: number) => number, until = 40) =>
      xs
        .slice(0, until + 1)
        .map((i) => `${i === 0 ? "M" : "L"}${20 + i * 5} ${fn(i)}`)
        .join(" ");
    return (
      <g>
        <Panel x={12} y={20} w={216} h={110} fill={PAPER} />
        <path d={path(noisy)} fill="none" stroke={MUTED} strokeWidth={1.2} />
        <path
          d={path(blurred, sweep)}
          fill="none"
          stroke={LINE}
          strokeWidth={2.4}
          strokeDasharray="4 3"
        />
        <path
          d={path(edgeAware, sweep)}
          fill="none"
          stroke={ERA}
          strokeWidth={2.6}
        />
        <rect
          x={Math.max(20, 20 + (sweep - 4) * 5)}
          y={24}
          width={40}
          height={102}
          rx={4}
          fill={ERA}
          opacity={0.1}
        />
      </g>
    );
  },
};

/** A tracker keeps a cloud of guesses, re-weights them each frame and resamples. */
export const particles: Illustration = {
  duration: 5000,
  still: 0.4,
  render: (p) => {
    const t = p * TAU;
    const target = { x: 120 + Math.cos(t) * 70, y: 76 + Math.sin(t * 2) * 34 };
    const frame = Math.floor(p * 40);
    const spread = 8 + (1 - ((p * 40) % 1)) * 10;
    return (
      <g>
        <Panel x={10} y={14} w={220} h={124} fill={PAPER} />
        {Array.from({ length: 36 }, (_, index) => {
          const back = index / 36;
          const tt = t - back * 0.9;
          return index % 4 === 0 ? (
            <circle
              key={`trail${index}`}
              cx={120 + Math.cos(tt) * 70}
              cy={76 + Math.sin(tt * 2) * 34}
              r={1.4}
              fill={MUTED}
              opacity={1 - back}
            />
          ) : null;
        })}
        {Array.from({ length: 40 }, (_, index) => {
          const angle = rand(index + frame * 41) * TAU;
          const distance = Math.sqrt(rand(index * 7 + frame)) * spread;
          const weight = 1 - distance / 18;
          return (
            <circle
              key={index}
              cx={target.x + Math.cos(angle) * distance}
              cy={target.y + Math.sin(angle) * distance}
              r={1.5 + weight * 2}
              fill={ERA}
              opacity={0.25 + weight * 0.6}
            />
          );
        })}
        <circle
          cx={target.x}
          cy={target.y}
          r={6}
          fill="none"
          stroke={INK}
          strokeWidth={2}
        />
      </g>
    );
  },
};

/** New texture is grown pixel by pixel by copying the best-matching neighbourhood. */
export const textureGrow: Illustration = {
  duration: 5000,
  still: 0.85,
  render: (p) => {
    const tile = (x: number, y: number, key: string, size = 8) => (
      <g key={key}>
        <rect
          x={x}
          y={y}
          width={size}
          height={size}
          fill={
            (Math.floor(x / size) + Math.floor(y / size)) % 3 === 0 ? ERA : SOFT
          }
        />
        <circle
          cx={x + size / 2}
          cy={y + size / 2}
          r={size / 4}
          fill={
            (Math.floor(x / size) * 2 + Math.floor(y / size)) % 4 === 0
              ? ACCENT
              : MUTED
          }
          opacity={0.8}
        />
      </g>
    );
    const cols = 13;
    const rows = 12;
    const grown = Math.floor(ramp(p, 0.05, 0.85) * cols * rows);
    return (
      <g>
        <rect
          x={14}
          y={45}
          width={52}
          height={52}
          rx={4}
          fill={PAPER}
          stroke={LINE}
        />
        {Array.from({ length: 36 }, (_, index) =>
          tile(
            18 + (index % 6) * 8,
            49 + Math.floor(index / 6) * 8,
            `s${index}`,
          ),
        )}
        <Arrow x1={74} y1={71} x2={92} y2={71} />
        <rect
          x={100}
          y={18}
          width={cols * 8 + 8}
          height={rows * 8 + 8}
          rx={4}
          fill={PAPER}
          stroke={LINE}
        />
        {Array.from({ length: Math.min(grown, cols * rows) }, (_, index) =>
          tile(
            104 + (index % cols) * 8,
            22 + Math.floor(index / cols) * 8,
            `g${index}`,
          ),
        )}
        {grown < cols * rows ? (
          <rect
            x={104 + (grown % cols) * 8 - 8}
            y={22 + Math.floor(grown / cols) * 8 - 8}
            width={24}
            height={24}
            fill="none"
            stroke={INK}
            strokeWidth={1.5}
          />
        ) : null}
      </g>
    );
  },
};

/** Pixels become a graph; the cut through the weakest links separates the object. */
export const graphCut: Illustration = {
  duration: 5000,
  still: 0.9,
  render: (p) => {
    const cols = 8;
    const rows = 5;
    const inside = (c: number, r: number) =>
      (c - 4.2) ** 2 / 7 + (r - 2) ** 2 / 3 < 1;
    const cut = step(p, 0.35, 0.65);
    const label = step(p, 0.65, 0.8);
    const node = (c: number, r: number) => ({ x: 36 + c * 24, y: 28 + r * 24 });
    const edges: { a: [number, number]; b: [number, number] }[] = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        if (c + 1 < cols) edges.push({ a: [c, r], b: [c + 1, r] });
        if (r + 1 < rows) edges.push({ a: [c, r], b: [c, r + 1] });
      }
    }
    return (
      <g>
        {edges.map(({ a, b }, index) => {
          const crosses = inside(...a) !== inside(...b);
          const from = node(...a);
          const to = node(...b);
          return (
            <line
              key={index}
              x1={from.x}
              y1={from.y}
              x2={to.x}
              y2={to.y}
              stroke={crosses ? ACCENT : LINE}
              strokeWidth={crosses ? 1.2 : 2.4}
              opacity={crosses ? 1 - cut : 1}
              strokeDasharray={crosses ? "2 2" : undefined}
            />
          );
        })}
        {Array.from({ length: cols * rows }, (_, index) => {
          const c = index % cols;
          const r = Math.floor(index / cols);
          const { x, y } = node(c, r);
          const fore = inside(c, r);
          return (
            <circle
              key={index}
              cx={x}
              cy={y}
              r={6}
              fill={fore ? ERA : MUTED}
              opacity={lerp(0.55, fore ? 1 : 0.35, label)}
              stroke={PAPER}
              strokeWidth={1.5}
            />
          );
        })}
      </g>
    );
  },
};

/** Faces are built from an average face plus a few weighted "eigenfaces". */
export const eigenfaces: Illustration = {
  duration: 5000,
  still: 0.25,
  render: (p) => {
    const w1 = Math.sin(p * TAU);
    const w2 = Math.cos(p * TAU * 2) * 0.8;
    return (
      <g>
        <Face cx={30} cy={60} r={20} />
        <text x={30} y={100} textAnchor="middle" fontSize={12} fill={MUTED}>
          μ
        </text>
        <text x={58} y={65} textAnchor="middle" fontSize={16} fill={INK}>
          +
        </text>
        <Face cx={86} cy={60} r={20} eyes={1.6} fill={PAPER} ink={ERA} />
        <rect x={74} y={92} width={24} height={6} rx={3} fill={SOFT} />
        <rect
          x={Math.min(86, 86 + w1 * 12)}
          y={92}
          width={Math.abs(w1 * 12)}
          height={6}
          fill={ERA}
        />
        <text x={114} y={65} textAnchor="middle" fontSize={16} fill={INK}>
          +
        </text>
        <Face
          cx={142}
          cy={60}
          r={20}
          mouth={1.8}
          smile={1.6}
          fill={PAPER}
          ink={ACCENT}
        />
        <rect x={130} y={92} width={24} height={6} rx={3} fill={SOFT} />
        <rect
          x={Math.min(142, 142 + w2 * 12)}
          y={92}
          width={Math.abs(w2 * 12)}
          height={6}
          fill={ACCENT}
        />
        <text x={170} y={65} textAnchor="middle" fontSize={16} fill={INK}>
          =
        </text>
        <Face
          cx={204}
          cy={64}
          r={26}
          eyes={w1 * 1.8}
          mouth={w2 * 1.8}
          smile={w2 * 2}
          fill={SOFT}
        />
      </g>
    );
  },
};

/** A detector window slides over the image and fires where the pattern matches. */
export const slidingWindow: Illustration = {
  duration: 5000,
  still: 0.9,
  render: (p) => {
    const positions = Array.from({ length: 12 }, (_, index) => ({
      x: 22 + (index % 6) * 32,
      y: 18 + Math.floor(index / 6) * 34,
    }));
    const target = 8;
    const reached = Math.min(11, Math.floor(ramp(p, 0, 0.8) * 12));
    const window_ = positions[reached]!;
    const found = reached >= target;
    return (
      <g>
        <g transform="translate(16 12) scale(1.89 1.38)">
          <rect width={110} height={90} rx={4} fill={SOFT} stroke={LINE} />
          <rect
            x={0.5}
            y={68}
            width={109}
            height={21.5}
            fill={LINE}
            opacity={0.6}
          />
        </g>
        <circle cx={104} cy={63} r={10} fill={INK} />
        <rect x={93} y={75} width={22} height={40} rx={6} fill={HUES[0]} />
        <rect
          x={150}
          y={88}
          width={56}
          height={24}
          rx={6}
          fill={HUES[1]}
          opacity={0.6}
        />
        {positions.slice(0, reached).map((position, index) => (
          <rect
            key={index}
            x={position.x}
            y={position.y}
            width={36}
            height={60}
            rx={3}
            fill="none"
            stroke={MUTED}
            strokeWidth={0.8}
            opacity={0.35}
          />
        ))}
        {found ? (
          <rect
            x={positions[target]!.x}
            y={positions[target]!.y}
            width={36}
            height={60}
            rx={3}
            fill={ERA}
            fillOpacity={0.15}
            stroke={ERA}
            strokeWidth={2.6}
          />
        ) : null}
        <rect
          x={window_.x}
          y={window_.y}
          width={36}
          height={60}
          rx={3}
          fill="none"
          stroke={INK}
          strokeWidth={2}
          strokeDasharray="4 3"
        />
      </g>
    );
  },
};

/** Every point climbs uphill in density until it reaches the peak of its cluster. */
export const meanShift: Illustration = {
  duration: 5000,
  still: 0.85,
  render: (p) => {
    const modes = [
      { x: 70, y: 52 },
      { x: 168, y: 46 },
      { x: 120, y: 112 },
    ];
    const climb = step(p, 0.1, 0.8);
    return (
      <g>
        <Panel x={12} y={10} w={216} h={132} fill={PAPER} />
        {modes.map((mode, index) => (
          <circle
            key={index}
            cx={mode.x}
            cy={mode.y}
            r={26}
            fill={HUES[index]}
            opacity={0.12 + climb * 0.1}
          />
        ))}
        {Array.from({ length: 36 }, (_, index) => {
          const mode = modes[index % 3]!;
          const angle = rand(index) * TAU;
          const distance = 8 + rand(index + 50) * 20;
          const start = {
            x: mode.x + Math.cos(angle) * distance,
            y: mode.y + Math.sin(angle) * distance,
          };
          const pull = climb * (0.75 + rand(index + 9) * 0.25);
          const x = lerp(start.x, mode.x, pull);
          const y = lerp(start.y, mode.y, pull);
          return (
            <g key={index}>
              <line
                x1={start.x}
                y1={start.y}
                x2={x}
                y2={y}
                stroke={HUES[index % 3]}
                strokeWidth={1}
                opacity={0.5}
              />
              <circle
                cx={x}
                cy={y}
                r={2.8}
                fill={climb > 0.6 ? HUES[index % 3] : INK}
              />
            </g>
          );
        })}
      </g>
    );
  },
};

/** An object is pasted by its gradients, so its colours blend into the new background. */
export const seamlessBlend: Illustration = {
  duration: 5000,
  still: 0.9,
  render: (p) => {
    const drop = step(p, 0.05, 0.35);
    const blend = step(p, 0.45, 0.8);
    const x = lerp(30, 136, drop);
    const y = lerp(30, 60, drop);
    return (
      <g>
        <rect
          x={86}
          y={18}
          width={142}
          height={116}
          rx={6}
          fill={HUES[0]}
          opacity={0.35}
        />
        <rect
          x={86}
          y={18}
          width={142}
          height={116}
          rx={6}
          fill="none"
          stroke={LINE}
        />
        <rect
          x={12}
          y={18}
          width={60}
          height={60}
          rx={6}
          fill={SOFT}
          stroke={LINE}
        />
        <rect
          x={x - 22}
          y={y - 22}
          width={44}
          height={44}
          rx={4}
          fill={lerp(1, 0, blend) > 0.5 ? PAPER : HUES[0]}
          opacity={lerp(1, 0.0, blend) * (drop > 0 ? 1 : 0.7)}
          stroke={drop > 0.95 ? INK : "none"}
          strokeDasharray="3 3"
        />
        <path
          d={`M${x - 12} ${y + 10} L${x} ${y - 14} L${x + 12} ${y + 10} Z`}
          fill={HUES[1]}
          opacity={lerp(1, 0.85, blend)}
        />
        <circle cx={x} cy={y + 2} r={4} fill={ERA} opacity={blend} />
      </g>
    );
  },
};

/** Two images are compared window by window on light, contrast and structure. */
export const ssimCompare: Illustration = {
  duration: 5000,
  still: 0.9,
  render: (p, uid) => {
    const cells = 5;
    const reached = Math.floor(ramp(p, 0.05, 0.85) * cells * cells);
    const score = (index: number) => {
      const c = index % cells;
      const r = Math.floor(index / cells);
      return 1 - Math.exp(-(((c - 3) ** 2 + (r - 1.5) ** 2) / 3)) * 0.8;
    };
    return (
      <g>
        <defs>
          <filter id={`${uid}-blur`}>
            <feGaussianBlur stdDeviation={2.2} />
          </filter>
        </defs>
        <rect
          x={10}
          y={30}
          width={66}
          height={66}
          rx={5}
          fill={SOFT}
          stroke={LINE}
        />
        <path d="M18 88 L40 46 L62 88 Z" fill={INK} opacity={0.7} />
        <circle cx={58} cy={46} r={8} fill={HUES[4]} />
        <rect
          x={86}
          y={30}
          width={66}
          height={66}
          rx={5}
          fill={SOFT}
          stroke={LINE}
        />
        <g filter={`url(#${uid}-blur)`}>
          <path d="M94 88 L116 46 L138 88 Z" fill={INK} opacity={0.7} />
          <circle cx={134} cy={46} r={8} fill={HUES[4]} />
        </g>
        {[10, 86].map((x) => (
          <rect
            key={x}
            x={x + 2 + (reached % cells) * 12.4}
            y={32 + Math.floor(Math.min(reached, 24) / cells) * 12.4}
            width={14}
            height={14}
            fill="none"
            stroke={ERA}
            strokeWidth={2}
          />
        ))}
        {Array.from({ length: cells * cells }, (_, index) => (
          <rect
            key={index}
            x={166 + (index % cells) * 13}
            y={30 + Math.floor(index / cells) * 13}
            width={12}
            height={12}
            rx={1.5}
            fill={ERA}
            opacity={index < reached ? score(index) : 0.08}
          />
        ))}
        <rect x={166} y={102} width={64} height={6} rx={3} fill={SOFT} />
        <rect
          x={166}
          y={102}
          width={64 * 0.78 * ramp(p, 0.05, 0.85)}
          height={6}
          rx={3}
          fill={ERA}
        />
      </g>
    );
  },
};
