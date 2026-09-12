# A living garden and home-grown pizza

Eight varieties now have distinct native 3D plants at every growth stage: daisy, sunflower, tulip, carrot, strawberry, moonflower, tomato and pepper. The world and the new close-up garden use the same models. Mature varieties attract small animated bees, butterflies or birds. Visitors are decorative; nothing eats crops, dies or penalises time away.

The home editor fills the screen. A live garden diorama sits beside six large controller-operated patches, with tools, a seed box and the baskets saved for Bramble. Empty patches plant the selected seed; growing plants receive water; ripe tomato/pepper plants offer a basket. Picking keeps the plant and returns it to its first leafy stage. It needs two more drinks before the next harvest. The selected seed falls back to an available packet when the last packet is used.

Tomato and pepper seeds cost two game stars each. New adventures start with one tomato packet. Existing adventures keep their seed counts and can buy the new varieties at Poppy’s. Each basket supplies one matching recipe ingredient batch; quantities in the maths puzzle remain the same. Completing a pizza uses at most one basket of each requested home-grown ingredient and awards one bonus star for each used basket. All ingredients remain available to players who have not gardened. Leaving an activity does not spend baskets. Pantry counts are limited to 99, and a full pantry leaves ripe plants intact.

Furniture choices are paged in groups of six, with the room’s placement spaces always visible. The home and garden fit 960×540 and 1280×720 without off-screen controls or scrollbars. Invisible world rendering pauses while the home diorama is open. Reduced-motion and calm preferences apply to plants and visitors.

## Verification

- 61 automated tests pass, including repeatable harvests, invalid slots, storage migration, capped pantries, recipe-specific use, duplicate completion protection, ordinary pizza rewards, wildlife conditions and finite bounded plant geometry.
- TypeScript, lint and production build pass. Four additional British recordings were generated locally; all 282 narration clips pass decoded integrity checks. Human accent/naturalness listening review remains pending.
- Browser playtest: bought tomato seeds (13 to 11 stars), planted an empty patch, watered it to maturity, picked one basket, made Pip’s recipe using 5 olives, 1 tomato and 2 peppers, and received three stars (11 to 14). Returned home to verify zero tomato baskets and the original plant still present at its first leafy stage.
- Checked mature sunflower and tomato models, garden visitors, controller confirmation, compact garden/furniture layouts and absence of runtime errors. A deprecated Three.js shadow setting reported during early QA was replaced with the supported setting.

Physical pad/TV and family acceptance remain part of the existing controller matrix. Phonics recordings and their Read Write Inc. review gate were not changed by this slice.
