# Little travelling companions

Sprig, Puff and Twinkle are small animated friends with matching illustrated choice cards and 3D models. Sprig joins new and existing adventures immediately. Helping Tilly once unlocks Puff; repairing all three rocket systems unlocks Twinkle. These use permanent quest progress, so rearranging a garden or spending stars cannot remove a friend. Choosing companions costs no stars.

My home → My friends opens a full-screen choice screen. Green A chooses, red B returns to exploration, and Y repeats the current companion instruction. Stay at home lets Monster explore alone. The choice is saved and validated with the adventure; old saves receive Sprig without changing their stars, inventory, deliveries or learning progress. Y also now follows the garden and furniture tabs instead of repeating the general home introduction.

Companions fly beside Monster, blink, flap, settle after a quiet moment, turn towards nearby neighbours and join celebrations. They rejoin after map travel, choose a clear shoulder position around scenery, appear on both the island and Moon, and perch beside Monster during rover rides. They never obstruct movement or answer an activity for the child. Reduced motion removes bobbing, flapping and blinks. There are no hunger meters, feeding obligations, timers or absence penalties.

The three characters use native geometry and shared materials within each rig. Only the selected companion is drawn. The home preview respects graphics pixel budgets, renders at most 30 frames per second, stops in hidden tabs and disposes its renderer when closed. Seven additional British recordings explain the choices and unlocks; no live speech service is used.

## Validation

- All 100 tests pass, including companion unlocks, immutable/no-cost selection, old and current saves, the rest choice, paused follower motion, scenery clearance, teleport recovery, finite/bounded animated geometry and British recording coverage. TypeScript, lint and production build pass; the pre-existing large client chunk warning remains.
- All 379 narration recordings decode and pass technical checks. Human listening and phonics acceptance remain pending as previously documented.
- Browser checks used directional keys, confirm and back to reach the friends tab and choose Puff and Twinkle. A fresh reload preserved Stay at home and showed solo exploration. The 960×540 layout displayed the preview, all three friends and rest action without scrolling. Twinkle travelled to the Moon, perched on the rover during a guided ride to Rock trail, left the rover and returned to the island. Stars remained at 22 and the existing pizza parcel remained available. The temporary viewport override was reset.
- No new browser errors appeared during the fresh-session companion checks. Physical controller and family acceptance remain outstanding; keyboard checks do not certify gamepad hardware.
