# Pip's rocket story and space travel

Pip now explains the next repair in three short chapters: the control panel, fuel tank and star battery. A pictured progress strip shows what is working and what comes next. Six new British recordings cover these chapter introductions and successful repairs. Existing repair progress is used directly; no stars or completed activities are reset.

The island rocket now has a detailed cabin, window rim and bolts, landing feet, control buttons, fuel gauge and battery. Each activity restores its corresponding visible system and gradually straightens the rocket. The Moon's return craft uses the same model.

Travel is a full-screen 3D journey with departure and arrival platforms, stylised Earth and Moon models, soft exhaust and four short stages. Clover's chosen monster appearance and outfit are visible in the cabin. These globes and travel distances are illustrative, not a scale model of the solar system.

- A lands immediately; the journey also arrives automatically after 6.8 seconds of active play.
- B cancels before arrival and leaves the player in the original region.
- Start pauses the journey behind adult settings and resumes at the same stage. Losing focus also pauses it through the existing rest screen.
- Reduced motion keeps the craft and planets still. It avoids repeatedly rendering an unchanged frame.
- A WebGL creation failure leaves a working pictured landing button. Invisible world rendering is suspended while the flight scene is active.
- An unfinished pizza stays saved during either direction of travel.

Map travel now reports the new nearby neighbour immediately, avoiding a quick second A press being handled as a hop before the next world update.

## Validation

All 80 automated tests pass, including each repaired model state, finite/bounded geometry, matching British chapter recordings, pause/resume, cancel/skip, single arrival and continuous/reduced-motion choreography. TypeScript, lint and production build pass; the existing large client chunk warning remains. All 297 narration clips pass technical decoding checks, with human listening/phonics acceptance still pending.

Browser checks inspected the repaired island rocket and Pip's progress panel, the selected monster/outfit in the cabin, a prolonged Start pause followed by resume and B cancellation, automatic Moon arrival, A-to-land return travel and the static reduced-motion scene. The return scene was inspected at 960×540 and the normal journey at 1280×720. No runtime errors were reported during the final flight checks. Settings were returned to system motion and automatic graphics afterwards. Physical gamepad/TV and family acceptance remain pending.
