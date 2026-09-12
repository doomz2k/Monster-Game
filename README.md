# Monster & friends

Clover’s browser adventure: make a monster, visit animated neighbours, earn stars, decorate a home and garden, and repair a rocket to reach the moon. Progress is saved in this browser.

## Play

- **A (green):** choose, confirm, talk or hop. **B (red):** reject or go back.
- **Stick / D-pad:** move or choose a picture. **X:** map (turn Monster in dress-up). **Y:** repeat instructions.
- **Start:** hidden grown-up settings. No parental entry appears in the welcome screen, picture map or child pause menu. Shoulder and trigger buttons are unused.
- Keyboard: arrows / WASD, Enter / Space, Escape, M, Y; P opens grown-up settings. Touch movement is available on touch devices.

Monster has five body shapes, configurable eyes, horns, ears, tail, face, patterns, surface textures and colours. Seven clothing shelves can be worn together: hats, neckwear, facewear, backs, clothes, footwear and badges. Earned wardrobe rewards remain unlocked when stars are spent. Idle gestures include breathing, blinking, double blinks, glances, scratching, stretching and weight shifts; walking adds wobble, sway and foot motion. Reduced-motion settings suppress extra gestures.

## Our neighbourhood

| Place                 | Activity                                                                                                                                                  |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Bramble’s pizza shop  | Four customers order recipes with three toppings. Solve each addition or subtraction puzzle, add or remove toppings from a 3D pizza, then bake and serve. |
| Olive’s story tree    | Introduce pure sounds, recognise graphemes and build decodable words from known sounds. Unverified audio needs a grown-up to model the sound.             |
| Marina’s harbour      | Move fish to a boat and work out how many remain.                                                                                                         |
| Tilly’s growing patch | Combine two concrete groups of flowers and find the total.                                                                                                |
| Poppy’s shops         | Buy seeds, furniture and garden decorations using earned stars.                                                                                           |
| My home               | Plant and water six garden plots, and arrange owned furniture and garden items.                                                                           |
| Pip’s crashed rocket  | Repair a pattern panel, fill the fuel tank and connect the battery. Three repairs unlock moon travel.                                                     |
| Nova’s moon meadow    | Discover Earth, the Sun, Saturn and the Moon, and collect stars in lower gravity.                                                                         |

Each completed order or mission earns two spendable stars. Replaying the same completion event cannot duplicate its reward; a new round is a new job. There are no timers, lives or penalties. Maths is adjustable between a 1–5 and 1–10 range; phonics stays within the grown-up’s selected sound set.

## Voices and phonics

**Narration:** 174 bundled Ogg recordings generated locally using free Kokoro and British voice profiles only. Nothing is generated during play and no paid voice service is called. Browser speech synthesis is disabled; missing narration remains visual. See [voice generation](docs/VOICES.md).

**Phonics is not yet auditorily verified.** The actual 26 inherited files have been decoded, measured and hashed in [the audit](docs/phonics-audit.json). Six correspondences (j, v, y, w, z, x) have no supplied clip. Their source history cannot establish a British speaker or a pure sound. This session cannot receive audio input and therefore cannot certify pronunciation. No unchecked clip plays in a learning activity. Older approvals no longer count: the sound studio requires an explicit British pure-sound listening check. Imports begin unchecked.

Open **Start / P → Sound studio** to compare each recording with the linked UK pronunciation guide and add or approve a correct recording. No letter name, added “uh”, word fragment or synthetic phoneme fallback is permitted. This is an independent practice game, not an endorsed or certified Read Write Inc. product. See [phonics design and remaining review](docs/PHONICS.md) and [audio provenance](public/audio/CREDITS.md).

## Development

Node.js 24 and npm:

```sh
npm ci
npm run dev
```

Open the Local URL printed by the server. WebGL2 is required. Xbox controllers need the browser’s standard Gamepad mapping.

```sh
npm run typecheck
npm run lint
npm test
npm run build
```

Tests cover recipes, selected-range maths, phonics decodability, gated recordings, British voice profiles and assets, quest rewards, moon unlocking, purchases, saving, clothing independence, finite animation geometry, controller buttons and optional agent tools. Browser playtesting supplements these checks; physical Xbox hardware and auditory phonics approval are separate outstanding checks.

Source is kept on `main` in [doomz2k/Monster-Game](https://github.com/doomz2k/Monster-Game). The project uses React, TypeScript, Three.js and Sites/Vinext. Learning and economy logic is in `lib/adventure.ts`; `lib/world.ts`, `lib/village.ts` and `lib/neighbours.ts` build the island. Optional WebMCP tools read state and visit learning areas, without answering questions, approving sounds or awarding stars. Existing browser saves migrate automatically.
