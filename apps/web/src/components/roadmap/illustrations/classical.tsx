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
