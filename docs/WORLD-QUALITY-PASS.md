# World and activity quality pass

## Included

- Full-screen activities with fixed top and bottom controls and responsive workbenches.
- Left/right quantity control and A to confirm for maths and pizza. Picture answers submit directly. Spelling submits when the last sound is placed; X undoes a sound.
- Persistent pizza rendering: topping changes toggle existing geometry instead of recreating WebGL contexts.
- 80 m play radius on island and Moon (previously 49 m): approximately 2.67 times the playable area. Neighbour destinations are spaced 1.6 times farther apart while houses and characters keep their scale.
- Original grass, timber and rock material textures, warmer lighting, camera-following shadows, moving sea, wind-driven grass and trees, birds and pollen.
- Windmill, lily pond and bridge, picnic clearing, lighthouse, harbour timbers and fishing boats; lunar observatory, rover tracks, crystal field and distant ridges.
- 48 space activities: 32 narrated discoveries, eight collecting challenges and eight picture patterns. All 48 appear before any repeat, answer positions rotate, and later cycles change their starting point. Progress survives existing saves.
- 222 bundled British narration files, including the 48 space activity prompts and revised controller instructions. Kokoro British profiles, generated locally; no runtime speech service.

## Content provenance

The original child-friendly space prompts were checked against NASA’s [planet overview](https://science.nasa.gov/solar-system/planets/), [Sun](https://spaceplace.nasa.gov/all-about-the-sun/en/), [Moon](https://spaceplace.nasa.gov/all-about-the-moon/en/), [Mars](https://spaceplace.nasa.gov/all-about-mars/en/), [Venus](https://spaceplace.nasa.gov/all-about-venus/en/), [Jupiter](https://spaceplace.nasa.gov/all-about-jupiter/en/), [Uranus](https://spaceplace.nasa.gov/all-about-uranus/en/), [spacesuits](https://www.nasa.gov/humans-in-space/what-is-a-spacesuit/) and [launching into space](https://spaceplace.nasa.gov/launching-into-space/en/) resources. Planet models are schematic illustrations, not scale models or accurate surface maps.

The grass, timber and rock images in `public/textures/` were generated for this project with ImageGen. Each requested a seamless square base-colour surface with natural colours, restrained storybook detail, orthographic framing and flat diffuse illumination, without objects, text or baked lighting. Material briefs: fine meadow grass and clover; honey timber with lengthwise grain; pale warm-grey weathered rock. Source outputs were 1254 × 1254 pixels, retained at their original resolution.

## Review boundaries

Pure-sound phonics recordings remain gated by the existing British phonics review process; this release does not certify them. Automated audio checks establish British voice profile, file presence and valid audio, not a human listening review. The 50 further proposals in `ENHANCEMENTS.md` remain a roadmap.

## Validation

TypeScript and lint checks plus 39 automated tests cover progression, rewards, saved state, pad input, question validity, British voice metadata and bundled audio, and expanded boundaries. Browser checks exercised pizza from recipe to reward with direction/confirm input, a wrong maths answer and retry, Start/return preserving an in-progress recipe, Moon travel and 3D planet choices. Pizza workbench bounds were checked at 1280 × 720, 844 × 390 and 390 × 844; a short-screen overflow was found and corrected. A physical controller and a human phonics listening review remain separate playtest work.
