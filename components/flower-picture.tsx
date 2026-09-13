import { flowerFor } from '@/lib/flowers';
export function FlowerPicture({ id }: { id: string }) {
  const flower = flowerFor(id);
  if (!flower) return null;
  const count =
    flower.base === 'moonflower' ? 6 : flower.base === 'sunflower' ? 12 : 9;
  const tall = flower.base === 'sunflower',
    y = tall ? 38 : 46;
  return (
    <svg className="flower-picture" viewBox="0 0 100 112" aria-hidden="true">
      <ellipse cx="50" cy="101" rx="25" ry="5" fill="#56714820" />
      <path
        d={`M50 98V${y}`}
        stroke="#68924e"
        strokeWidth="5"
        strokeLinecap="round"
      />
      <path
        d="M49 82Q19 83 22 62Q44 60 49 82ZM51 74Q77 76 79 55Q56 55 51 74Z"
        fill="#86aa66"
        stroke="#6b9453"
        strokeWidth="2"
      />
      {flower.base === 'tulip' ? (
        <g>
          <path
            d="M50 58Q24 53 28 25Q41 25 50 38Q59 25 72 25Q76 53 50 58Z"
            fill={flower.petals}
            stroke={flower.centre}
            strokeWidth="2"
          />
          <path
            d="M50 56Q32 44 50 20Q68 44 50 56Z"
            fill={flower.centre}
            opacity=".8"
          />
        </g>
      ) : (
        <g>
          {Array.from(
            { length: flower.base === 'moonflower' ? 6 : tall ? 12 : 9 },
            (_, i) => (
              <ellipse
                key={i}
                cx="50"
                cy={y - 19}
                rx={tall ? 8 : 9}
                ry={17}
                transform={`rotate(${(i * 360) / count} 50 ${y})`}
                fill={flower.petals}
                stroke="#75805728"
                strokeWidth="1"
              />
            ),
          )}
          <circle cx="50" cy={y} r={tall ? 13 : 10} fill={flower.centre} />
          {tall &&
            Array.from({ length: 7 }, (_, i) => (
              <circle
                key={i}
                cx={50 + Math.sin(i * 2.4) * 8}
                cy={y + Math.cos(i * 2.4) * 8}
                r="1.5"
                fill={flower.petals}
                opacity=".65"
              />
            ))}
        </g>
      )}
      <path d="M33 95Q50 101 67 95L64 105H36Z" fill="#ad9270" />
    </svg>
  );
}
