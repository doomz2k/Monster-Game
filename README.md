# Monster-Game

Clover's Monster Game: **Clo's Little World**, a browser adventure for a four-year-old, starring an animated, friendly yellow monster.

Explore a connected 3D island with soft boundaries, a follow camera, walking, hopping, blinking, waving and celebrations. There are no lives, timers or penalties. Progress stays in this browser.

The launch screen lets the child start or continue an adventure, dress up Clo, or open grown-up settings. Dress-up is also available from Pause and immediately after earning a new outfit reward. The live 3D preview can be turned around; equipped pieces follow Clo throughout the island.

## Dress-up and rewards

Choose one hat and one accessory. The bobble beanie, party hat, berry bow tie and cosy scarf are available from the start, along with options to remove either item. More pieces unlock with stars earned for distinct challenges; replaying an already completed challenge does not create another star.

| Stars | New item        |
| ----- | --------------- |
| 3     | Explorer hat    |
| 5     | Round glasses   |
| 8     | Flower crown    |
| 12    | Little backpack |
| 16    | Rainbow crown   |
| 24    | Superstar medal |

Outfits save automatically in the existing browser save. Earlier saves keep their stars, sounds and settings and receive the starter outfit. Unlocking an item does not change the child's outfit automatically. Rewards are permanent while that browser save is retained; there are no purchases or random rewards.

In the dressing room, use the stick/D-pad or arrows to choose an item and **A / Enter / Space** to wear it. **LB / RB** or **Q / E** switches between hats and accessories. **X / M** turns Clo by a quarter turn; the right stick also rotates the preview. **B / Escape** or **All dressed!** returns to the previous screen. Locked items remain selectable so their spoken unlock requirement can be heard with **Y**.

| Area             | Activities                                                                                                                          |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Counting Meadow  | Count objects, touch each object to count aloud, recognise circles, squares and triangles                                           |
| Whispering Woods | Learn and recognise Set 1 sounds, then blend words made only from introduced sounds; a rocket and friendly alien echo Space Phonics |
| Bubble Bay       | Count sea creatures, compare quantities, and take shells away; inspired by Deep Sea Numbers                                         |
| Together Garden  | Add concrete dice quantities and grow flowers; inspired by Garden Maths                                                             |

The default maths range is 1–5, with an optional 1–10 range. The default phonics group is the first five sounds, m a s d t; a grown-up can expand the selection through Set 1. Replaying is always allowed. Three activities in each area complete the island's introductory adventure; additional questions remain available.

## Run

Requires Node.js 24 and npm.

```sh
npm ci
npm run dev
```

Open the Local URL printed by the server. Click **Let's play** once to enable browser audio, then use the controller. WebGL2 and graphics acceleration are required. Connect an Xbox controller over USB or Bluetooth; the browser must expose it with the standard Gamepad mapping.

| Action                        | Xbox controller     | Keyboard                |
| ----------------------------- | ------------------- | ----------------------- |
| Move                          | Left stick or D-pad | WASD or arrows          |
| Look around                   | Right stick         | Automatic follow camera |
| Hop / enter activity / choose | A                   | Space or Enter          |
| Repeat prompt                 | Y                   | Y                       |
| World map                     | X                   | M                       |
| Back / leave activity         | B                   | Escape                  |
| Pause                         | Menu                | P                       |

On the map and activity screens, use the stick/D-pad to choose and A to confirm. The game pauses if a connected controller disconnects or the window loses focus. Touch movement controls appear on touch devices. Grown-up settings and sound imports use the ordinary browser controls.

## Phonics and audio: current status

**This is an independent practice companion, not an endorsed or certified Read Write Inc. product. The phoneme recordings are not yet teacher-verified.** The data follows the published Oxford Owl Set 1 order, including its listed ck correspondence, and blending uses only sounds introduced to the child.

- Every new sound is modelled before recognition.
- Same-sound spellings such as c, k and ck never compete in an auditory matching question.
- Unchecked or missing sounds use a grown-up-led activity. They are never generated by browser text-to-speech.
- **Pause → Grown-ups → Sound studio** lets an adult compare clips against the linked Ruth Miskin films, import a recording, and explicitly enable each checked sound.
- 26 unverified candidates are included from `doomz2k/clover-games`' sound-lab snapshots. Six correspondences (j, v, y, w, z, x) have no bundled recording.
- Checking a clip is a local parental check, not independent teacher certification. Replacing a clip removes its approval.
- Instructions and whole words use selected existing narration or a British English browser voice. Device voice availability varies.

See [the phonics implementation and verification record](docs/PHONICS.md) and [audio provenance](public/audio/CREDITS.md). A competent UK phonics practitioner should complete auditory verification before independent child use of recorded phonemes.

## Validation

```sh
npm run typecheck
npm run lint
npm test
npm run build
```

Tests exercise progression and decodability, 2,400 generated maths questions, repeat scoring, corrupted saves, island bounds, controller button edges/disconnection, audio approval and no-TTS-fallback rules, binary audio assets, and optional agent-tool contracts.

Lint covers the game's source. Generated shadcn primitives and their mobile hook retain the starter's implementation and are excluded from lint; the entire project is still typechecked.

Physical Xbox testing, auditory review by a phonics practitioner, and full browser interaction/visual testing have not been performed in this development session. The preview route was checked over HTTP and the production build is validated separately.

## Source

Development and commits use `main` in [doomz2k/Monster-Game](https://github.com/doomz2k/Monster-Game). Inspiration and selected audio are from [doomz2k/clover-games](https://github.com/doomz2k/clover-games), reference commit `51869d01a4e0efc12bc1982b63064bd6caddff3b`. The reference checkout under `work/` is ignored and is not part of this project.

The game uses React, TypeScript, Three.js and the Sites/Vinext starter. Learning logic is in `lib/learning.ts`, phonics data in `lib/phonics.ts`, the 3D island in `lib/world.ts`, controller support in `lib/input.ts`, and audio policy in `lib/audio.ts`. No account, microphone recording, chat, analytics or personal profile is built into the game. Sites may require owner sign-in for a private hosted deployment.

Optional WebMCP tools read state and visit an area. They cannot answer a question, approve audio or award a star. A supported live WebMCP host was unavailable for integration validation; their contracts are tested with an in-memory registry.
