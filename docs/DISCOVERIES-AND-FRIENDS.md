# Discoveries and friendship

This checkpoint adds twelve optional discoveries, a full-screen picture scrapbook, persistent friendship gifts, larger animated neighbour conversations and a usable Moon return craft.

## Play

- Open the scrapbook from the picture map or the child’s pause screen. Six pictures fit on each page; D-pad and A select, Y repeats the current note or clue, B returns to the pictures and then the previous screen. Start preserves the open page.
- Choose an unfound picture to hear its clue. “Let’s look” travels to the closest friend and points the world guide towards the find. The two Moon entries use the existing three-repair travel gate.
- Golden stars above little books mark discoveries in the world. Approach within 3.2 world metres and press A. Each awards one star exactly once and keeps an illustrated memory. Collected books remain as small landmarks. There are no timers, daily requirements or compulsory hidden rewards.
- Neighbours gain hearts at 1, 3, 6 and 10 completed activities. At three helps, each offers one specific home or garden item. Claim it with A in the conversation. If already owned, the present becomes two stars instead. Reloading or repeating a claim cannot award it again. Existing players qualify from their saved activity counts.
- The Moon landing pad has a return craft, illuminated perimeter and a green A return cue when Monster is nearby.
- The main-menu action is now exclusively inside Start / P grown-up controls. The child’s pause screen has Play, My monster, Our island and My discoveries.

The scrapbook reuses original learning illustrations. Discovery markers and the landing craft use native Three.js geometry. All 27 new narrative lines were generated locally using the existing British Kokoro profiles; the game now bundles 278 narration clips. They pass decoded audio integrity checks, but human listening acceptance remains pending. The existing Read Write Inc. phonics review gate is unchanged.

## Verification

Automated tests cover collection distance, finite coordinates, region gating, repeat claims, save migration, malformed collection fields, export/import round trips, gift ownership compensation and recorded narration coverage. The full suite has 56 passing tests; TypeScript, lint and production build pass.

Browser playtests exercised a clue-to-discovery journey using the shared keyboard/controller actions, collected a picture and exactly one star (12 to 13), reopened the scrapbook, moved between pages and preserved the selected page through Start. A friendship present was claimed with Down/A. The Moon return pad offered A, which began the homeward flight. The picture book fits 960×540 and 1280×720 without scrollbars or off-screen controls. Large neighbour portraits now use a full-screen conversation layout, avoiding a clipped present button at 720p.

Physical controllers/TVs, a family playtest and human listening reviews remain outstanding. This is implementation and browser verification, not a claim of professional educational sign-off.
