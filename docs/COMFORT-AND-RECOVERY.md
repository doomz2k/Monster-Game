# Comfort, camera and recovery checkpoint

Implemented 12 September 2026 during the continuous improvement run.

- Saves now retain the three latest distinct valid recovery copies. Loading a corrupt or missing primary save falls back to the newest valid copy. Broken data is never rotated into recovery. Backup writes happen before replacing the primary, so a quota failure does not overwrite the existing primary save.
- The hidden Start/P menu provides adventure export, validated import with a preview, and recovery-copy previews. Importing does not carry phonics recordings or audio approvals between devices. Restoring requires the explicit in-game adult restore button.
- Preferences persist with the adventure: reduced motion, stronger activity contrast, larger activity text, calm mode, separate speech/environment volume and gentle/fixed camera direction. Device reduced-motion preference is always honoured. Calm mode also reduces environmental volume and celebration particles.
- The world camera makes small, damped turns around nearby trees/buildings and lifts when an obstruction remains. Held movement uses its initial camera heading, preventing the camera turn from steering Monster in a circle. A fixed-direction option is available. Moon camera height now follows lunar ground rather than the island height function.
- Full-screen activities and parental controls suspend the hidden world renderer. Spoken audio always takes priority over environmental sound. Portrait and pizza motion follow the selected motion preference.

Validation: 51 automated checks pass, including migration, malformed settings/imports, three-copy recovery, corrupted primary/backup data, storage quota failure, import/export round-trip, and stable camera avoidance. Type checking, lint and production build pass. Browser checks confirm that comfort settings apply, three recovery copies appear, the existing 12-star test adventure remains playable, and larger-text/high-contrast maths with a hint fits 1280×720 without scrolling or off-screen buttons. No browser errors were observed.

The live-browser restore action was blocked by automatic approval review because it could overwrite existing player progress. It was not retried or bypassed; restoration was tested with isolated in-memory storage instead. No browser restore success is claimed. The normal presentation preferences were restored after the visual check. Physical controller/TV and family listening acceptance remain pending as documented in CONTROLLER-MATRIX.md and PHONICS.md.
