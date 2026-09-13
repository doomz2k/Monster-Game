# Safe focus and resume

Controller actions and movement now stop whenever another window has focus, including when the game first opens in the background. Returning to the game requires the stick and relevant buttons to return to neutral before the controller is armed again. A new press outside the game cannot choose an answer or resume play.

Home visits now use the same automatic pause as other active activities. Hiding the document also enters that pause, covering browsers that report a visibility change without a separate window blur. Returning preserves the visit or puzzle and leaves resuming to the player.

Profile activation also returns the latest saved progress when asked to reopen the current adventure. This closes an API edge case; the normal parent interface already labels the current adventure instead of offering another Open button.

All 202 automated tests, type checking, linting and the production build pass. Simulated standard controllers cover background launch, fresh presses outside the game, held buttons on return, neutral rearming and hidden tabs. Browser checks confirmed normal entry with the original 69 stars and Start access to the original 17 completed practice observations. These numbers are development walkthrough data, not child assessment results. Physical controller acceptance remains outstanding.
