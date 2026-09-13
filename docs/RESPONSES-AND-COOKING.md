# Varied responses and reliable cooking pauses

Twenty-seven response families now rotate between three short recorded takes. Sixty-three additional British recordings give the neighbours distinct celebrations and varied retry/counting hints. Rotation stays local to the current session; it does not change a question, phoneme, answer or reward. Ordinary instruction playback and the parent's listening-review buttons still play the exact requested recording.

Finished activities remember their selected celebration. Returning from Start or pressing Y replays the same result rather than restarting the old question. Rocket repair chapters, garden bonuses and delivery instructions retain their specific wording. Rover counting hints now refer to the pictures in its tray rather than the empty-space hint used in other activities.

Pizza cooking previously used a timeout that could finish while the activity was hidden, with an older completion callback. Cooking now advances only during visible, active play. Pauses keep the elapsed cooking time, completion is emitted once, and the latest callback preserves any preference changed while paused. The pizza preview also stops its baking animation during the pause. Returning to a baking activity repeats the baking instruction instead of the last topping recipe.

## Validation

- All 92 automated tests pass, including response rotation, exact replay/review playback, British recording coverage, paused cooking, invalid/stalled frames and one-time completion. TypeScript, lint and production build pass; the existing large client chunk warning remains.
- All 372 narration files decode and pass the technical audio checks. Listening quality, accent/pronunciation acceptance and the phonics review gate still require the human checks already documented; this is not a listening sign-off.
- A browser playthrough made the garden pizza with two tomatoes, three peppers and four sweetcorn. Repeated incorrect answers remained playable. Start paused the oven with 20 stars; after a longer pause, it still showed 20 and resumed baking. Completion raised the wallet to 22. A change to Simpler graphics during that pause remained selected after completion, then was returned to Automatic. Result replay remained usable.
- A fresh browser session was used after extending the audio class: development hot refresh retained the older class instance until reload. No production migration is required, and the fresh-session checks passed.
