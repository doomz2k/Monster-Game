# Playing at home

My home → My house now opens the furnished playroom. Pictured activities use the furniture actually placed in the six indoor or six outdoor spaces. Green A starts an activity; red B finishes it. Move things opens the decorating studio, and B returns to playing. Looking, playing and switching lights never spend stars.

The customised monster and its selected companion appear in the room. The monster sits on its sofa or toadstool, rests on its bed, shares a fruit picnic at the table, turns the pages of a picture book, dances on its rug, makes little splashes at the bird bath and rides the garden swing. The swing’s attachment point carries the monster with the moving seat, including furniture rotation. The companion settles during sitting, reading and rest. Ten new bundled British recordings explain the activities.

The lamp and lantern have persistent switches. The same saved state controls their emissive bulb and warm floor glow in the playroom, decorating preview and main island. Old saves default to lit, and malformed switch data cannot add arbitrary objects. No additional real-time point lights are needed.

The room and editor share a native 3D room/garden shell with curtains, window frames, skirting, a garden fence and border flowers. The floor heights align with placed furniture. The play view reuses all ten furniture models, the real appearance/outfit rig and the chosen companion. Renderers respect graphics budgets, run at most 30 frames per second, stop drawing in hidden tabs and dispose of their resources when closed. Reduced motion keeps the selected pose, disables movement and camera interpolation, and leaves every activity available. Opening Start ends the transient home animation; the saved room and light choices are retained.

## Validation

- All 121 automated tests pass, including interaction eligibility, unchanged stars/layouts, old-save light migration, light persistence, every furniture rotation, moving seat anchors and all five monster body shapes returning from every home pose to normal animation. TypeScript, lint and production build pass. The existing large Three.js client chunk warning remains.
- All 417 narration files decode and pass technical audio checks. Phonics and character listening sign-off remain human acceptance work.
- Browser checks covered picnic, sofa, bed, book pages, rug dance, swing and bird bath splashes; the chosen monster outfit and companion appeared throughout. New furniture was placed without replacing the original table or lantern. The second furniture page also worked after ownership exceeded six items.
- The lantern remained off after a full reload, then switched on again. Reduced-motion swing play worked, and the device-motion preference was restored. Play and decorating controls fitted at 1280×720 and 960×540 without scrollbars; the viewport override was reset.
- The local QA adventure bought the swing, books and rug (13 → 0 in-game stars), then completed three harbour activities (0 → 6), received Marina’s bird bath and placed it outside. The existing pizza parcel and other progress remained available. No production-browser progress was reset or restored.
- Physical controller/TV checks and family acceptance remain pending. These are optional close-up home activities, rather than free-roaming indoor navigation or learning assessments.

A replay check found that the first three harbour subtraction activities all yielded two. That existing content-sequencing weakness is the next improvement; it does not affect home interaction eligibility or rewards.
