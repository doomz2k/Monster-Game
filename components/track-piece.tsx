import type { TrackDirection } from '@/lib/track-workshop';
export function TrackPiecePicture({
  ports,
  turn = 0,
  ghost = false,
}: {
  ports: TrackDirection[];
  turn?: number;
  ghost?: boolean;
}) {
  const points = [
      [50, 0],
      [100, 50],
      [50, 100],
      [0, 50],
    ],
    a = points[ports[0]],
    b = points[ports[1]],
    straight = (ports[0] + 2) % 4 === ports[1];
  const path = straight
    ? `M${a.join(' ')}L${b.join(' ')}`
    : `M${a.join(' ')}Q50 50 ${b.join(' ')}`;
  return (
    <svg
      className={'track-piece-picture ' + (ghost ? 'track-ghost' : '')}
      viewBox="0 0 100 100"
      aria-hidden="true"
    >
      <g transform={`rotate(${turn * 90} 50 50)`}>
        {!ghost && (
          <path d={path} fill="none" stroke="#d1c5aa" strokeWidth="41" />
        )}
        <path
          d={path}
          fill="none"
          stroke={ghost ? '#f5d968' : '#a5a69b'}
          strokeWidth={ghost ? 7 : 29}
          strokeDasharray={ghost ? '8 6' : undefined}
        />
        {!ghost && (
          <path
            d={path}
            fill="none"
            stroke="#f6edd9"
            strokeWidth="3"
            strokeDasharray="8 9"
          />
        )}
      </g>
    </svg>
  );
}
export function TrackRoverPicture({ colour }: { colour: string }) {
  return (
    <svg
      viewBox="0 0 100 100"
      className="track-rover-picture"
      aria-hidden="true"
    >
      <ellipse cx="48" cy="57" rx="43" ry="36" fill="#4b48652b" />
      {[22, 48, 75].map((x) => (
        <g key={x}>
          <rect x={x - 6} y="12" width="15" height="21" rx="5" fill="#4f5871" />
          <rect x={x - 6} y="69" width="15" height="21" rx="5" fill="#4f5871" />
        </g>
      ))}
      <rect
        x="11"
        y="24"
        width="80"
        height="53"
        rx="14"
        fill="#e8c894"
        stroke="#ad8967"
        strokeWidth="3"
      />
      <rect x="29" y="30" width="43" height="40" rx="13" fill="#98bbc4" />
      <path d="M36 41 35 29 46 37M58 37 69 29 67 44" fill="#fff3d6" />
      <ellipse cx="52" cy="51" rx="19" ry="16" fill={colour} />
      <ellipse cx="47" cy="49" rx="5" ry="6" fill="#fff9e8" />
      <ellipse cx="61" cy="49" rx="5" ry="6" fill="#fff9e8" />
      <circle cx="48" cy="50" r="2.5" fill="#594d52" />
      <circle cx="62" cy="50" r="2.5" fill="#594d52" />
      <path
        d="M50 59q5 4 10-1"
        fill="none"
        stroke="#80624c"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <rect x="81" y="32" width="8" height="10" rx="3" fill="#fff0a4" />
      <rect x="81" y="59" width="8" height="10" rx="3" fill="#fff0a4" />
    </svg>
  );
}
