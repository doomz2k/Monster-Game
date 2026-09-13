import { SHOP_ITEMS } from '@/lib/adventure';

/** Simple, matching shelf illustrations: each large product view uses the real 3D model. */
export function ShopPicture({ id }: { id: string }) {
  const item = SHOP_ITEMS.find((item) => item.id === id);
  if (!item) return null;
  const c = item.colour,
    wood = '#c4a17b',
    dark = '#957250',
    cream = '#fff0cf';
  const plant = item.kind === 'seed';
  return (
    <svg className="shop-picture" viewBox="0 0 110 100" aria-hidden="true">
      <ellipse cx="55" cy="91" rx="36" ry="5" fill="#566b5020" />
      {plant ? (
        <g>
          <path
            d="M23 16Q23 10 31 10H79Q87 10 87 16V82Q87 89 79 89H31Q23 89 23 82Z"
            fill="#f6e9c5"
            stroke="#d6c699"
            strokeWidth="2"
          />
          <path d="M24 25H86M24 79H86" stroke="#d6c699" strokeWidth="2" />
          <path
            d="M55 74V44M55 65Q29 65 36 51Q49 50 55 65M55 62Q78 59 76 45Q61 47 55 62"
            fill="#91b96f"
            stroke="#628d4e"
            strokeWidth="3"
          />
          {id === 'tomato' || id === 'strawberry' ? (
            <g>
              <path
                d="M39 42Q33 62 55 70Q77 62 71 42Q60 31 55 38Q48 32 39 42"
                fill={c}
              />
              <path d="M55 39L42 34L49 45L55 42L65 46L67 36Z" fill="#6c9b4e" />
              {id === 'strawberry' &&
                [43, 52, 61, 68].map((x, i) => (
                  <ellipse
                    key={x}
                    cx={x}
                    cy={51 + (i % 2) * 9}
                    rx="1.6"
                    ry="2.7"
                    fill="#ffe6a5"
                  />
                ))}
            </g>
          ) : id === 'pepper' ? (
            <g>
              <path
                d="M40 43Q31 63 46 70Q54 66 60 70Q78 67 70 44Q59 36 55 43Q47 37 40 43"
                fill={c}
              />
              <path
                d="M55 44Q53 34 63 33"
                fill="none"
                stroke="#567d47"
                strokeWidth="5"
              />
            </g>
          ) : id === 'carrot' ? (
            <g>
              <path d="M39 39Q51 31 66 41L52 76Q48 81 46 74Z" fill={c} />
              <path
                d="M49 37L43 27M54 37L60 24"
                stroke="#6e9e53"
                strokeWidth="5"
                strokeLinecap="round"
              />
            </g>
          ) : id === 'tulip' ? (
            <path
              d="M36 38L44 45L55 31L65 45L74 38V52Q74 65 55 66Q36 64 36 52Z"
              fill={c}
            />
          ) : (
            <g>
              {Array.from({ length: 8 }, (_, i) => (
                <ellipse
                  key={i}
                  cx="55"
                  cy="32"
                  rx="7"
                  ry="12"
                  fill={id === 'daisy' ? cream : c}
                  transform={'rotate(' + i * 45 + ' 55 48)'}
                />
              ))}
              <circle
                cx="55"
                cy="48"
                r="10"
                fill={id === 'sunflower' ? dark : '#e9bc56'}
              />
            </g>
          )}
        </g>
      ) : id === 'sofa' ? (
        <g>
          <rect x="15" y="34" width="80" height="44" rx="9" fill={c} />
          <rect x="24" y="56" width="62" height="21" rx="6" fill="#e4a8c4" />
          <rect x="12" y="50" width="14" height="32" rx="5" fill={c} />
          <rect x="84" y="50" width="14" height="32" rx="5" fill={c} />
          <path d="M23 82V89M87 82V89" stroke={dark} strokeWidth="6" />
          <rect x="29" y="43" width="20" height="20" rx="4" fill="#f3d795" />
        </g>
      ) : id === 'bed' ? (
        <g>
          <rect x="24" y="19" width="62" height="66" rx="6" fill={wood} />
          <rect x="29" y="27" width="52" height="51" rx="5" fill={cream} />
          <rect x="29" y="44" width="52" height="39" rx="5" fill={c} />
          <rect x="37" y="28" width="36" height="14" rx="5" fill="#fff9e6" />
          <path
            d="M43 56L46 62L53 62L48 67L49 74L43 70L37 74L38 67L33 62L40 62Z"
            fill={cream}
          />
          <path d="M29 84V91M81 84V91" stroke={dark} strokeWidth="5" />
        </g>
      ) : id === 'table' ? (
        <g fill="none" stroke={dark} strokeWidth="7" strokeLinecap="round">
          <path d="M32 53L23 87M78 53L87 87M28 77H82" />
          <path d="M14 47H96" stroke={c} strokeWidth="14" />
          <path d="M14 73H96" stroke={c} strokeWidth="9" />
        </g>
      ) : id === 'books' ? (
        <g>
          <rect x="20" y="19" width="70" height="70" rx="3" fill={wood} />
          <rect x="26" y="25" width="58" height="56" fill="#ead7b4" />
          {Array.from({ length: 10 }, (_, i) => (
            <rect
              key={i}
              x={29 + (i % 5) * 11}
              y={i < 5 ? 29 : 59}
              width="8"
              height="22"
              rx="1"
              fill={
                ['#93afcb', '#d4a5b6', '#e8c27a', '#a6bd97', '#b6a4cb'][i % 5]
              }
            />
          ))}
          <path d="M25 54H85" stroke={wood} strokeWidth="6" />
        </g>
      ) : id === 'lamp' || id === 'lantern' ? (
        <g>
          <path d="M55 36V84" stroke={dark} strokeWidth="5" />
          <ellipse cx="55" cy="87" rx="22" ry="5" fill={dark} />
          {id === 'lamp' ? (
            <>
              <path d="M39 19H71L83 53H27Z" fill={c} />
              <path d="M55 53V64" stroke="#dfb65d" strokeWidth="4" />
            </>
          ) : (
            <>
              <rect x="36" y="27" width="38" height="39" rx="3" fill={dark} />
              <rect x="41" y="31" width="28" height="30" rx="9" fill={c} />
              <path d="M30 27L55 12L80 27Z" fill={dark} />
            </>
          )}
        </g>
      ) : id === 'rug' ? (
        <g>
          {[
            '#b596c9',
            '#cf9eaf',
            '#e7b879',
            '#e5d796',
            '#9eb897',
            '#95bdc7',
          ].map((c, i) => (
            <ellipse
              key={c}
              cx="55"
              cy="62"
              rx={44 - i * 6}
              ry={26 - i * 3.5}
              fill={c}
            />
          ))}
        </g>
      ) : id === 'swing' ? (
        <g fill="none" stroke={wood} strokeWidth="7" strokeLinecap="round">
          <path d="M21 88V20H89V88" />
          <path d="M38 24V69M72 24V69" stroke={cream} strokeWidth="3" />
          <path d="M32 72H78" stroke={dark} strokeWidth="10" />
        </g>
      ) : id === 'birdbath' ? (
        <g>
          <path d="M50 54L44 86H66L60 54" fill={c} />
          <ellipse cx="55" cy="86" rx="24" ry="5" fill={c} />
          <path d="M20 43Q24 66 55 66Q86 66 90 43" fill={c} />
          <ellipse cx="55" cy="43" rx="35" ry="12" fill="#b2d4d9" />
          <ellipse cx="55" cy="43" rx="26" ry="7" fill="#84bfd1" />
          <circle cx="78" cy="28" r="10" fill="#9ab6c8" />
          <circle cx="81" cy="25" r="2" fill="#34394b" />
          <path d="M86 29L95 33L86 34Z" fill="#e2b670" />
        </g>
      ) : (
        <g>
          <path d="M45 58L40 85Q55 94 70 85L65 58Z" fill={cream} />
          <path d="M15 57Q21 20 55 20Q89 20 95 57Q55 73 15 57" fill={c} />
          <ellipse cx="42" cy="37" rx="9" ry="5" fill={cream} />
          <ellipse cx="71" cy="48" rx="8" ry="5" fill={cream} />
        </g>
      )}
    </svg>
  );
}
