# Gentle island weather and puddle play

The island has a ten-minute active-play weather cycle: sunshine, slowly gathering clouds, a light shower, a seven-colour rainbow and gradually drying puddles. A session starts with three minutes of sunshine. Time pauses in menus, activities, travel, the Moon and hidden windows; it never catches up time spent away. Rain does not water crops, change rewards or close activities.

Eight shallow, irregular puddles follow the terrain beside familiar routes. Walking makes small ripples. A normal green-A hop produces a larger splash and a happy Monster reaction on landing, including while carrying a pizza. A pictured A cue appears when puddle play is the available action, and the first puddle has a brief British recorded invitation. Y repeats it. Nothing costs stars and no additional controls are required.

Start → Comfort and sound adds a saved **Island weather** choice: the cycle, sunshine, drizzle with puddles or a rainbow with puddles. Calm play makes the weather sunny. Reduced motion removes falling rain and flying splash droplets, freezes the automatic weather clock and retains a small stationary ripple response to deliberate play. Existing saves gain the cycle preference without changing progress.

The rendering budget is one rain draw call with 300/180/72 streaks for rich/balanced/simple graphics, eight puddle surfaces and a reusable pool of ten splash effects. Simple graphics omits splash droplets. Drops use a ground-aligned volume around Monster and avoid the building shelter areas. Rainbow bands are flat translucent arcs, not solid tubes. There are no extra lights or shadow passes. Weather geometry and materials are disposed with the world.

Quiet rain and wet footsteps share the existing environment volume and mute controls. All environmental sound stops during narration, inactive play and hidden windows. The Moon retains its separate sound and lighting. The voice bank now has 505 technically checked British narration clips; actual listening acceptance remains outstanding.

## Verification

136 automated tests pass, including weather continuity and brightness, active-time bounds, saved preferences, reachable puddles, contact and landing events, idle/teleport/pause suppression, finite geometry, tier budgets and audio mix bounds. Type checking, lint and the production build pass.

Browser checks at 1280 × 720 and 960 × 540 covered the puddle cue, green-A hopping, Y replay, saved weather choices, reduced-motion drizzle, calm-play sunshine, the rainbow and island/Moon round-trip separation. The pizza parcel, companion and 18-star test wallet remained intact. The console reported no runtime errors. Physical controller/TV, listening and family acceptance still need human playtesting; brief automated keyboard taps did not provide reliable continuous walking, so walking contact coverage here comes from the deterministic tests.
