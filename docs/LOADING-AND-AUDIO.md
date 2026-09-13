# Smaller normal-play download

The sound studio's full narration metadata and decoded-audio measurements now load only when Start opens the parent menu. The rest of that menu remains available while the studio opens, and a failed load has a retry action. Leaving during loading discards the pending component update.

Normal playback uses a generated index of recording paths plus each phoneme's exact SHA-256 and technical block. It retains the named, current-standard, exact-source approval gate, including the built-in `nk` clipping block and exact-byte approval for imported recordings. No sound is approved by generating this index. Narration text lookup is indexed once instead of scanning all recording metadata for each line. Unknown narration still produces visible guidance and never invokes browser speech synthesis.

`scripts/audit-audio.py` now regenerates `lib/audio-data/audio-runtime.json` alongside the full audit. Run it after generating or replacing recordings, then run the tests. The compact index is 47,556 bytes, compared with 312,340 bytes for the full audit and narration metadata together.

`npm run budget` inspects emitted static imports from the application entry, adventure screen and island renderer. It reports the combined script size and the code deferred exclusively to the listening studio. Before/after figures use the preceding flower-book build and this build:

| Measure | Before | After |
|---|---:|---:|
| Normal-play JavaScript | 1,819,684 bytes | 1,536,456 bytes |
| Same scripts, individually gzipped | 512,493 bytes | 437,727 bytes |
| Review code deferred until requested | 0 bytes | 324,048 bytes |

This is about 15% less compressed JavaScript for normal play. These are build measurements, not a network-speed or frame-rate benchmark; images and recordings are excluded, and hosting compression can differ. The shared Three.js bundle remains above the existing 500 kB advisory threshold.

Validation covers all 557 narration paths and 26 candidate phoneme fingerprints, exact approval conditions, case-insensitive narration lookup, ordered playback and absent synthetic fallback. All 178 tests pass. Browser checks covered a fresh launch, Y guidance, Start opening the complete 557-recording listening desk, a preview request and return to the map, with no new runtime warnings. Human listening and physical controller acceptance remain outstanding.
