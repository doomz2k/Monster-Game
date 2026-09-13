# Visual home decorating

My home → My house now shows a large 3D room with numbered spaces that match the controller buttons. Choosing furniture shows a translucent placement preview. Green A places it; Turn rotates the selected space by a quarter turn; Put away returns the item to its shelf. Undo reverses up to twenty decorating actions during the current editor visit. It restores only the layouts and orientations, preserving stars, plants, preferences, companions and other progress.

Indoor furniture and garden decorations now have separate sets of six spaces. Choosing an outdoor item switches the preview and buttons to the garden. A garden lantern can occupy outdoor space 1 while the picnic table remains in indoor space 1. Old saves that mixed these items in one array move outside decorations into the corresponding garden spaces, preserving their orientation, ownership and indoor items. Garden spacing also accommodates all four rotations without furniture overlapping neighbouring cells.

Ten shared 3D furniture models now appear in the world and editor: a cushioned sofa, starry bed, plank picnic table with benches, book corner, shaded lamp, rainbow rug, bird bath, garden swing, spotted toadstool seat and garden lantern. Timber uses the existing texture, and rounded edges and smaller details improve the close-up view. The preview respects rendering budgets, pauses in hidden tabs, renders at most 30 frames per second and disables ambient swing movement for reduced motion. Four short British recordings explain placing, turning, putting away and undo.

A browser check also exposed a controller navigation defect: moving right on a wide shelf could choose a diagonally closer tab above. Shared menu navigation now prefers a control in the same row or column before considering diagonal alternatives.

## Validation

- All 109 tests pass, including saved rotations, moving and clearing furniture, isolated undo, old mixed-layout migration, independent indoor/outdoor placement, bounded geometry at all rotations and the controller shelf regression. TypeScript, lint and production build pass; the existing large client chunk warning remains.
- All 383 narration files pass technical decoding and audio-level checks. Human listening and phonics sign-off remain pending.
- Browser checks at 1280×720 and 960×540 covered selecting the sofa, following the translucent preview, placing it in space 5, rotating it, putting it away and undoing those changes. The test sofa changes were undone. Every control fitted without a scrollbar, and the compact header gave the room more space.
- A garden lantern was bought for two in-game stars (22 → 20). It was placed and rotated in outdoor space 1 while the table remained in indoor space 1. Existing plants, the chosen companion and the pizza delivery remained available. The viewport override was reset and the shared furniture models were inspected back in the world.
- Physical controller/TV and family acceptance remain outstanding. The editor is still a decorating activity; sitting on furniture and other direct interactions are separate roadmap work.
