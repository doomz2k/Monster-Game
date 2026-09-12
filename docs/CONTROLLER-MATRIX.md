# Controller and screen acceptance — 12 September 2026

Browser testing used the actual game UI. Keyboard arrows, Enter, Escape, M, Y and P exercise the same action handler as D-pad, A, B, X, Y and Start. These results do not claim a physical controller or television was tested.

| Coverage | Result | Evidence / remaining check |
|---|---|---|
| Xbox standard mapping | Automated pass | A/B/X/Y, Start, D-pad, left-stick deadzone, edge detection and disconnect. Physical USB/Bluetooth check pending. |
| PlayStation standard mapping | Automated pass | Cross/Circle/Square/Triangle are browser indices 0/1/2/3 and Options is Start. Physical DualSense/DualShock check pending. The child sees the consistent green A / red B teaching cues. |
| Generic standard-mapped pad | Automated pass | Same action contract. Browser mapping must be `standard`; unknown mappings are ignored rather than guessed. Physical device compatibility pending. |
| Reconnect with A or a direction held | Automated pass | No confirm or movement until mapped controls return to neutral. Disconnect or identity change suspends play. |
| Accidental double A | Automated pass | Held edges do not repeat; separate A presses less than 220 ms apart cannot advance twice. |
| Simultaneous face presses | Automated pass | One face action per frame; Start, then B, take priority over A. |
| D-pad / stick repeat | Automated pass | Direction changes react immediately, holds repeat after 300 ms. No trigger, shoulder, right-stick or stick-click dependency. |
| Window blur / hidden page | Automated pass | Movement clears, controller must return to neutral, no hidden-tab movement. |
| First-play lesson | Browser pass | Actual walking advances; left/right choice, A into basket, B out, A explore. The completion flag persists. |
| Full pizza recipe | Browser pass | Missing/excess hints, changing quantities, three recipe steps and baking. |
| Y demonstration replay | Browser pass | Existing topping count and current recipe step survive the example. |
| Start / return | Browser pass | Review desk appears only under Start/P; returning keeps the same pizza and count. |
| Sound review boundary | Browser pass + automated pass | No approvals initially; exact-source matching required; `nk` warns and cannot be approved until replaced. No listening approvals were fabricated during testing. |
| 1280 × 720 | Browser pass | Tutorial, animated examples, pizza with error feedback and Nova’s three-picture activity. No document or activity scrollbars. |
| 1920 × 1080 | Browser pass | Pizza controls stay in the viewport; no document/activity scrollbar. |
| 3840 × 2160 | Browser pass | Pizza controls stay in the viewport; no document/activity scrollbar. Actual TV viewing-distance readability pending. |
| 960 × 540 | Browser pass | Compact landscape pizza layout keeps all controls visible. |

Before claiming hardware acceptance, repeat these flows using a physical Xbox pad, a PlayStation pad and one generic pad on the target browser/TV: connect while holding A; release; walk; open a neighbour; replay Y; deliberately overfill and underfill; finish a recipe; press Start and return; unplug during a question; reconnect while holding A; confirm that stars are awarded only once. Check quiet sound levels from the sofa, speech intelligibility, wireless reconnects and television overscan.
