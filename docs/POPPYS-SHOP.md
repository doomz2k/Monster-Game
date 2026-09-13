# Poppy’s illustrated shop and saving goals

Poppy now fills the screen with three pictured shelves: seeds, house furniture and garden decorations. Selecting an item opens a separate inspection with the actual 3D plant or furniture model, its price shown as stars, and a distinct green confirm button. Looking and cancelling do not spend stars. Seeds show how many packets are already at home, owned furnishings are marked, and rocket and seed-capacity requirements explain unavailable purchases.

Each inspection allows one successful purchase. A receipt replaces the buying controls, so repeated confirm presses cannot charge for the same inspection twice. A deliberate return to the shelf starts a new purchase. Twenty-four bundled British Poppy recordings explain the shelves, each item and its price, and saving a goal; Y replays the last relevant instruction.

The child can remember one pictured saving goal without spending stars. It appears in Poppy’s shop and on the island picture map, with a shortcut back to the selected item. The goal survives reloads and clears when the item is bought or received as a friendship gift. Other purchases leave it intact. Invalid and already-owned goals are safely normalised on loading older saves. There are no timers or real-money purchases.

Hand-drawn SVG illustrations match the actual item colours and shapes. The same illustrations now appear in the furniture studio, replacing inconsistent platform emoji. The shop preview reuses the shared plant/furniture factories and timber texture, respects graphics and reduced-motion settings, and disposes of replaced models and its renderer.

## Validation

- All 116 automated tests pass; TypeScript, lint and the production build pass. Tests cover duplicate/stale confirmations, unsuccessful retries, ownership/unlock/capacity rules, goal persistence, fulfilment by purchases and gifts, safe old-save loading, and complete recorded price instructions. The existing large Three.js client chunk warning remains.
- All 407 narration recordings decode and pass technical audio-level checks. This does not constitute human listening or phonics approval; those remain outstanding.
- Browser/controller-keyboard checks at 1280×720 and 960×540 cover all three shelves, seed pagination, the 3D preview, inspect/back, saving and reopening a goal, and a completed purchase. These layouts fit without scrollbars.
- The local QA adventure bought a starry bed for five in-game stars (20 → 15) and a tomato packet for two (15 → 13). A double click on the tomato purchase produced one packet and one charge. The bed goal cleared; the subsequent garden swing goal was saved without spending more stars.
- Physical controller/TV and family playtest acceptance remain pending.
