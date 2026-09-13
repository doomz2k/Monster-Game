# Gentle island daylight

The island now moves through daytime, afternoon, sunset, a bright evening and sunrise during twelve minutes of active exploration. A fresh session begins in daylight. Activities, Start, pauses, hidden tabs and Moon visits do not advance the island clock. Calm play and reduced motion hold the current phase and keep fireflies still.

Sunlight, ambient light, fog, the sky gradient and sea tint change together. Evening brings warm house windows, eight path lanterns with soft pools of light, a star field and fireflies around the woods, pond and gardens. The evening palette deliberately retains enough light to see Monster and the paths. The Moon retains its separate lighting; the monster studio also keeps its own lights.

Start → Comfort and sound → Island light offers the gentle cycle, permanent daytime, warm sunset or cosy evening. This preference is saved with the adventure. There are no timed quests, shop closures, real-world clock requirements or penalties for stopping play.

The effects add no shadow-casting lights or external assets. Simpler graphics uses 90 stars and 24 fireflies; other tiers use 300 and 72. Existing rendering budgets remain in force.

## Validation

- Automated coverage checks active/paused time, invalid and stalled frames, wrapping, finite colours and light levels, fixed settings and save compatibility. All 95 tests, TypeScript, lint and the production build pass. The existing large client chunk warning remains.
- Fresh-session browser checks compared daytime, sunset and evening, verified the saved evening selection after reload, inspected warm windows, lanterns and fireflies, and travelled to the Moon and back. Existing stars, the carried delivery and rover stamps remained intact. The local preference was returned to the gentle cycle afterwards.
- Visibility on physical televisions and the family's preference for the evening brightness remain playtest checks; automated light-level bounds are not a substitute for those checks.
