import type { DanceMove } from '@/lib/home-visits';

export function DancePicture({ move }: { move: DanceMove }) {
  const lift = move === 'hop' ? -7 : 0;
  return (
    <svg className="dance-picture" viewBox="0 0 100 90" aria-hidden="true">
      <ellipse cx="50" cy="81" rx="23" ry="4" fill="#64587620" />
      <g transform={'translate(0 ' + lift + ')'}>
        <path
          d="M31 57 29 74M69 57 71 74"
          stroke="#8279a8"
          strokeWidth="12"
          strokeLinecap="round"
        />
        <path
          d="M25 46Q21 22 36 20Q50 7 64 20Q79 22 75 47L71 64Q50 78 29 64Z"
          fill="#aaa0ce"
          stroke="#847ba9"
          strokeWidth="2"
        />
        <ellipse cx="50" cy="58" rx="14" ry="11" fill="#d3cce5" />
        <g fill="#fff9e8">
          <ellipse cx="40" cy="34" rx="7" ry="9" />
          <ellipse cx="60" cy="34" rx="7" ry="9" />
        </g>
        <g fill="#474153">
          <circle cx="41" cy="35" r="3" />
          <circle cx="59" cy="35" r="3" />
        </g>
        <path
          d="M45 46q5 5 10 0"
          stroke="#645268"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
        <g
          fill="none"
          stroke="#9186b7"
          strokeWidth="9"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {move === 'clap' ? (
            <path d="M29 47 35 57 46 49M71 47 65 57 54 49" />
          ) : move === 'stretch' ? (
            <path d="M29 48 20 29 14 13M71 48 80 29 86 13" />
          ) : move === 'wiggle' ? (
            <path d="M29 46 16 37 9 41M71 46 83 32 91 36" />
          ) : (
            <path d="M29 46 18 54M71 46 82 54" />
          )}
        </g>
      </g>
      <g stroke="#dfae4e" strokeWidth="3" fill="none" strokeLinecap="round">
        {move === 'clap' && <path d="M50 43v-5M42 43l-4-3M58 43l4-3" />}
        {move === 'stretch' && (
          <path d="M8 6l-2-3M19 5l2-3M80 5l-2-3M91 6l2-3" />
        )}
        {move === 'hop' && (
          <path d="M12 75V59m-5 5 5-5 5 5M88 75V59m-5 5 5-5 5 5" />
        )}
        {move === 'wiggle' && (
          <path d="M9 55q-7 6 0 12q7 6 0 12M91 51q7 6 0 12q-7 6 0 12" />
        )}
      </g>
    </svg>
  );
}
