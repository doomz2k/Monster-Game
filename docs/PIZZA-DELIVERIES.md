# Pizza deliveries and picture map

After baking a pizza, Clover can deliver it to the customer who ordered it: Olive, Tilly, Marina or Pip. Cooking still awards its normal stars immediately. Delivery is optional, has no timer, and gives one extra star when the pizza reaches the right neighbour. A pizza skipped on the results screen can be collected later from Bramble, until a newer order replaces that uncollected offer.

Monster holds a small cardboard pizza box with both hands. A picture strip remembers the recipient, and the golden guide points towards their familiar place. X opens a full-screen picture map, where the pizza trail can be resumed or any other destination visited. A gives the pizza when close to the recipient; their full-screen thank-you uses their recorded British voice. B still leaves, and Start still opens the hidden adult controls.

An accepted parcel survives reloading, other activities and Moon travel. It cannot be overwritten by another order. On the Moon, resuming the delivery trail points to the return rocket. The player can keep exploring indefinitely without the pizza spoiling or rewards being lost. Delivery tickets prevent repeated star claims and are validated when loading a save.

The map now shows all eight destinations and the discovery-book button without scrolling at 960×540 and 1280×720. It uses the existing illustrated object collection. Neighbour portraits also retain their intended size on shorter screens. Y can repeat the suggested next step from an activity's results screen.

## Checks

- 70 automated tests pass. Delivery cases cover the actual recipe customer, proximity and region, duplicate actions, invalid save fields, unfinished parcels across another recipe and save/resume, British recording coverage, and finite box geometry with stable carrying arms.
- TypeScript, lint and production build pass. All 291 narration clips decode and pass the technical audio audit; human listening and phonics review remain pending.
- Browser checks accepted Pip's previous order, reopened the game with it intact, delivered it using A and observed the extra star. A newly cooked Woodland pizza offered Olive's delivery as the focused A choice. The carrying box was inspected while turning in the world. Map and results layouts fit 540p; 720p map layout was also checked.
- Physical controller/TV and family acceptance remain pending. Browser tests used the game's controller-equivalent keyboard actions and pictured map travel, not a physical gamepad.
