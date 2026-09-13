# A monster that notices its world

When the player lingers, their customised monster can greet a nearby neighbour, lean towards a mature garden flower or watch a butterfly. Neighbours answer the greeting with a wave. These are short optional animations; they never move the player, open an activity or award stars.

Reactions begin after a short idle period and blend in and out. A per-target cooldown avoids constant waving. Movement, carrying a parcel, jumping and celebrations take priority. Pausing freezes the reaction clock. Calm play and reduced motion suppress these extra gestures. Existing idle, blinking, scratching, walking and home activities remain available.

The world uses the actual planted flower positions and animated butterfly positions. Flower targets update when the beds change, and butterfly references are cached rather than searching the whole scenery each frame. All gestures reuse existing models, materials and sounds, with no extra downloads or rendering layers.

## Validation

- All 201 automated tests pass, including five new tests covering target selection, idle timing, cooldowns, pause/cancellation, invalid values, all neighbour rigs and monster pose priorities.
- Type checking, linting and the production build pass. Normal-play JavaScript is 1,564,527 bytes, or 446,182 bytes with the budget report's gzip calculation.
- Browser arrival at Olive showed the monster turning towards her. Green A still opened the full-screen conversation, with its help option focused. No warnings or errors were recorded after the fresh page load.
- Automated rig checks do not replace observing every gesture in play. A family playtest on a physical controller and television, and subjective animation/music/voice acceptance, remain outstanding. Phonics recordings retain the separate human review gate.
