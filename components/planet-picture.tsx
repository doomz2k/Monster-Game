import { useId } from 'react';
import { planetFor, type PlanetId } from '@/lib/observatory';

/** Small vector teaching tokens; the detailed view uses the same planet colours. */
export function PlanetPicture({
  id,
  rings = true,
}: {
  id: PlanetId;
  rings?: boolean;
}) {
  const key = useId().replaceAll(':', ''),
    p = planetFor(id);
  return (
    <svg viewBox="0 0 100 80" className="planet-picture" aria-hidden="true">
      <defs>
        <radialGradient id={key + 'g'} cx="30%" cy="25%" r="85%">
          <stop stopColor="#fff9e9" stopOpacity=".65" />
          <stop offset=".5" stopColor={p.colour} />
          <stop offset="1" stopColor="#263955" />
        </radialGradient>
        <clipPath id={key + 'c'}>
          <circle cx="50" cy="39" r="27" />
        </clipPath>
      </defs>
      {rings && id === 'saturn' && (
        <ellipse
          cx="50"
          cy="40"
          rx="46"
          ry="13"
          transform="rotate(-23 50 40)"
          fill="none"
          stroke="#c7b386"
          strokeWidth="9"
        />
      )}
      <circle cx="50" cy="39" r="27" fill={p.colour} />
      <circle cx="50" cy="39" r="27" fill={'url(#' + key + 'g)'} />
      <g clipPath={'url(#' + key + 'c)'}>
        {id === 'earth' && (
          <g fill="#83ab76">
            <path d="M25 25 39 21 48 30 44 42 36 46 34 35 25 32Z" />
            <path d="m54 33 15-7 9 12-8 9-7 15-8-7 3-11Z" />
          </g>
        )}
        {['jupiter', 'saturn', 'venus', 'neptune', 'uranus'].includes(id) && (
          <g
            fill="none"
            stroke={id === 'jupiter' ? '#ac7b58' : '#fff8df'}
            opacity={id === 'jupiter' ? '.7' : '.22'}
            strokeWidth={id === 'jupiter' ? '5' : '3'}
          >
            <path d="M20 25q30 8 60 0M20 37q30 8 60 0M20 50q30 8 60 0" />
          </g>
        )}
        {id === 'mercury' && (
          <g fill="#797974" opacity=".5">
            <circle cx="41" cy="30" r="5" />
            <circle cx="57" cy="46" r="7" />
            <circle cx="35" cy="50" r="3" />
          </g>
        )}
        {id === 'mars' && (
          <path
            d="m29 32 18 5 3 14 14-12 9 8"
            fill="none"
            stroke="#9f5846"
            strokeWidth="7"
            opacity=".5"
          />
        )}
      </g>
      {rings && id === 'saturn' && (
        <path
          d="M9 58 Q57 60 92 23"
          fill="none"
          stroke="#e8d8ae"
          strokeWidth="7"
        />
      )}
      {rings && id === 'uranus' && (
        <ellipse
          cx="50"
          cy="39"
          rx="13"
          ry="34"
          transform="rotate(-28 50 39)"
          fill="none"
          stroke="#d3e4e5"
          strokeWidth="2"
          opacity=".65"
        />
      )}
    </svg>
  );
}
