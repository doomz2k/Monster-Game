import type { RoverStopId } from '@/lib/rover';

/** Vector companion to the native 3D expedition props. */
export function RoverPicture({
  kind = 'rover',
}: {
  kind?: RoverStopId | 'rover';
}) {
  return (
    <svg className="rover-picture" viewBox="0 0 100 100" aria-hidden="true">
      <ellipse cx="50" cy="84" rx="39" ry="7" fill="#4b486a" opacity=".12" />
      {kind === 'rover' ? (
        <>
          <path
            d="M20 49h60v23H20z"
            fill="#e6c592"
            stroke="#796958"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <path
            d="M35 47V30h29l8 19"
            fill="#bbdce7"
            stroke="#6f8b9f"
            strokeWidth="4"
            strokeLinejoin="round"
          />
          <path
            d="M43 32v15M23 59h11M70 58h7M73 45V19"
            stroke="#8d795f"
            strokeWidth="4"
          />
          <circle cx="73" cy="17" r="5" fill="#e4ac54" />
          {[27, 50, 73].map((x) => (
            <g key={x}>
              <circle cx={x} cy="75" r="12" fill="#4f5871" />
              <circle cx={x} cy="75" r="5" fill="#dce0e2" />
            </g>
          ))}
        </>
      ) : kind === 'rocks' ? (
        <>
          <path
            d="M14 68 28 32 56 21 79 43 87 72 59 86 29 84Z"
            fill="#baa69b"
            stroke="#8c7d7b"
            strokeWidth="3"
            strokeLinejoin="round"
          />
          <path d="m28 32 17 23 34-12-23-22Z" fill="#e0c9b0" />
          <path d="m45 55 14 31 28-14-8-29Z" fill="#a49390" />
          <circle cx="35" cy="67" r="5" fill="#9f8d84" />
          <circle cx="63" cy="43" r="3" fill="#b7a18e" />
        </>
      ) : kind === 'panels' ? (
        <>
          <path
            d="M49 57v24M35 84h30"
            stroke="#aaa8b9"
            strokeWidth="7"
            strokeLinecap="round"
          />
          <path
            d="m20 24 61 8-6 35-61-8Z"
            fill="#5085ad"
            stroke="#c6cdd5"
            strokeWidth="5"
            strokeLinejoin="round"
          />
          <path
            d="m35 27-6 34m26-31-6 34m-32-22 61 8"
            stroke="#a0c9dc"
            strokeWidth="2"
          />
          <path d="m20 25 21 3-6 8-17-2Z" fill="#cae8ee" opacity=".5" />
        </>
      ) : (
        <>
          <path
            d="M50 48v32M32 84h36"
            stroke="#bcb7d0"
            strokeWidth="7"
            strokeLinecap="round"
          />
          <path
            d="M34 38q-13 12 0 24m32-24q13 12 0 24"
            fill="none"
            stroke="#d4accf"
            strokeWidth="5"
            strokeLinecap="round"
          />
          <circle
            cx="50"
            cy="46"
            r="17"
            fill="#e8bd87"
            stroke="#ae84af"
            strokeWidth="4"
          />
          <circle cx="45" cy="40" r="6" fill="#fff3c7" />
        </>
      )}
    </svg>
  );
}
