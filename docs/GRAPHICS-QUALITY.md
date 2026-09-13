# Graphics budgets and automatic adjustment

Start → Comfort and sound now offers Automatic, More detail, Balanced and Simpler graphics. Existing saves use Automatic. The choice is saved with the adventure and never changes activities, discoveries, progression or rewards.

| Setting | Maximum 3D render scale | Pixel budget | Sun shadow map | Meadow density | Celebration particles |
|---|---:|---:|---:|---:|---:|
| More detail | 1.5 | 2,304,000 | 2048², up to 60 updates/s | 100% | 28 |
| Balanced | 1.25 | 1,600,000 | 1024², up to 30 updates/s | 65% | 18 |
| Simpler graphics | 1.0 | 921,600 | Disabled | 25% | 8 |

Render scale is also limited by the device pixel ratio and pixel budget, including at 4K. Text and controls keep their normal browser resolution. Simpler graphics hides decorative pollen; all characters and interactive items stay present. Calm/reduced-motion celebrations remain capped at five particles.

Automatic begins at Balanced. It ignores the first 2.5 seconds, hidden pages, non-playing screens and isolated long stalls. Two three-second windows below 35 fps lower one tier; eight windows above 57 fps raise one tier. A fifteen-second cooldown prevents rapid switching. Sustained extremely slow frames still count as load. Manual settings do not adapt.

The garden and neighbour portraits follow the chosen render budget (Balanced in Automatic) and animate at up to 30 fps. Hidden pages skip their rendering. A local-only information panel behind Start reports the last world sample; no performance measurements are transmitted.

## Validation

- All 75 tests pass, including sustained/isolated stalls, pauses, manual overrides, recovery to higher quality, pixel budgets across common resolutions and save migration.
- TypeScript, lint and production build pass. The existing large Three.js client chunk warning remains.
- Browser inspection switched More detail → Simpler → More detail → Simpler while preserving scenery, Monster's eyes/outfit and a held delivery. A discovered shadow-material invalidation bug was fixed and both directions rechecked. The garden's existing plants and wildlife were also inspected.
- Entering or leaving the monster studio preserves the selected pixel budget. Browser checks confirmed a 1.00 render scale in both the studio and exploration with Simpler graphics; TypeScript, lint, the five graphics tests and the production build passed after this follow-up fix.
- Indicative local development samples from the central island: More detail reported 57 fps, 1,571 draw calls and 970,351 triangles; Simpler reported 57 fps, 797 draw calls and 459,752 triangles. These are different live frames on this computer, not a controlled benchmark or a claim about slower hardware. Physical low-spec-device acceptance remains pending.

The game is left on Automatic after testing.
