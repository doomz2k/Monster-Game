# Moon rover expedition

The Moon's decorative vehicle is now a drivable six-wheel rover with a seat, dashboard, working wheels, lights, flag and a rear rack for an unfinished pizza. Monster keeps the selected appearance and outfit while driving. The picture map can always take the player back to the parked vehicle. Reloading safely returns the vehicle to its dock; expedition progress stays saved.

- A climbs in. The control pad or left stick drives; releasing it stops movement. B climbs out to a clear side of the vehicle.
- A can optionally follow the golden star to the next stop. Another A stops the ride, and any direction takes over immediately. Routes go around the observatory. Start pauses movement; closing settings resumes the same ride.
- Three numbered, pictured stops cover Moon rocks, solar panels and signal lights. Each opens a full-screen, untimed counting activity with the existing left/right number dial and A confirmation.
- A gentle hint numbers the pictures after an incorrect answer. No stars are removed. Each stop offers all quantities from one to five before repeating.
- Finishing gives one star and a saved stamp. The next route favours the least-visited stop. The expected round, answer, region and proximity prevent duplicate or stale rewards.
- Reduced motion removes decorative rover bobbing and flag movement. A quiet local motor replaces footsteps while driving and stops during speech, pauses and muted play. Twelve new British recordings explain the expedition.

The Moon scenery, vehicle and sample trays are playful illustrations, not claims about an actual lunar expedition. No isolated phoneme recordings or teaching approvals changed.

## Validation

All 87 automated tests pass, including old/corrupt saves, locked Moon access, quantity variety, exact rewards, clear exits, finite/bounded vehicle geometry and unobstructed routes between every destination. TypeScript, lint and production build pass; the existing large client chunk warning remains. All 309 narration recordings pass technical decoding checks. Human listening, phonics and physical controller/TV acceptance remain pending.

Browser checks completed the three stops with A and directional keys, including an incorrect answer, a paused unfinished answer, a prolonged pause during a guided ride, immediate directional takeover, B exit, reload with all three stamps and return home with the earlier pizza still waiting for Olive. The wallet increased from 17 to 20 across the three completed stops. Counting and stamp screens were inspected at 1280×720 and 960×540 without scrollbars. A compact-height HUD overlap was corrected. The final browser error history contained only the older, previously resolved development CSS errors.

Follow-up fixes in this checkpoint also make losing window focus pause flights and expedition screens, and leave the rover before returning to the main menu or resuming a pizza route.
