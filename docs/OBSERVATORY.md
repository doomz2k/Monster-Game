# Nova's observatory

The repaired rocket now leads to a working observatory, available from Nova's conversation and the Moon picture map. A full-screen planet viewer lets the child move between eight large pictures and press green A to inspect a planet and hear Nova describe it. Each first observation adds one permanent planet stamp and one star. Revisits remain available without additional rewards, deadlines or timers. The collection travels with the existing save and export; it does not invent a completed learning question.

Three views share the same planet models:

- **Look closer:** softly lit, rotating illustrated worlds with procedural surface detail, cloud bands, craters and visible ring systems.
- **Around the Sun:** all eight planets orbit in the correct order. A golden circle follows the selected planet. Text and recorded speech explain that distances, sizes and speeds are compressed for the teaching model.
- **How big?:** Earth and the selected planet use equal units per equatorial width. Rings are omitted from this comparison. The measurements use NASA's published equatorial diameters; the models are illustrations, not geographic maps or spacecraft photographs.

The direction pad chooses, green A inspects, red B returns to Nova, yellow Y repeats the last instruction or fact, and blue X changes the view. All three views also have large selectable buttons. Keyboard X now aliases the existing M action. Start pauses the observatory and preserves the current view and selection. Existing phonics gates and parent number ranges are unchanged.

There is one WebGL renderer for the observatory, with bounded shared geometry, procedural shader detail, no external texture downloads, a 30 fps animation cap and the existing pixel budgets. Reduced motion holds the model still while allowing view and planet changes. The hidden world and paused observatory do not render. Vector pictures provide a fallback, including a proportional width comparison. Nova's existing planet question cards now use these shared surfaces and graphics budgets too.

Twelve new offline British Kokoro recordings bring the character bank to 517. The technical audit passes all narration files. It does not certify accent, warmth or pronunciation; listening and phonics specialist review remain outstanding.

## Science references

Planet order and introductory facts were checked against [NASA's planet overview](https://science.nasa.gov/solar-system/planets/). Equatorial widths are from [NASA's planet sizes and locations](https://science.nasa.gov/solar-system/planet-sizes-and-locations-in-our-solar-system/): Mercury 4,880 km, Venus 12,104 km, Earth 12,756 km, Mars 6,792 km, Jupiter 142,984 km, Saturn 120,536 km, Uranus 51,118 km and Neptune 49,528 km. The description of Saturn's rings uses [NASA's Saturn facts](https://science.nasa.gov/saturn/facts/). Sources checked 13 September 2026.

## Verification

159 automated tests pass, with new coverage for travel gating, exactly-once observation rewards, collection migration and export, valid planet IDs, numeric comparison ratios, ordered and bounded model orbits, finite planet geometry and every new British recording. Lint, type checking and the production build pass.

Browser QA covered eight stamps earned using the direction-key layout, repeat confirmation without another reward, all three views, Start pause/resume with the same selected planet, reduced motion and simpler graphics, the Moon map shortcut and Nova's conversation entry. The viewer was inspected at 1280 × 720, 960 × 540 and 390 × 844 without internal scrollbars. Saturn's rings were corrected after a visual check found an edge-on presentation. Existing Nova questions were checked with the shared models and a successful Earth answer. Collection and reward state survived reload; parent preferences and the viewport were restored. Browser logs reported no shader or runtime errors. These are browser and simulated input checks, not physical-controller, listening or family acceptance.
