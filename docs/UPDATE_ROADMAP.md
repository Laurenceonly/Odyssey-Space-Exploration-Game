# Odyssey — Staged update roadmap

Created: 2026-10-14 (Asia/Manila).

Source: [Design direction](DESIGN_DIRECTION.md). This is a proposed delivery sequence, not a promise of dates or authorization to implement all updates immediately. Updates 1 and 2 have been implemented. The October 15 direction expands the next milestone to a small visit at every planet and the Moon, before deeper gathering/building and co-op. The new visits are local pending final validation and review. Update names are working labels.

## Delivery rule

Finish one small playable update, verify it, and gather feedback before beginning the next. Publish player-facing notes only for shipped changes; do not add this future roadmap to src/game-updates.js as released features. Preserve existing saves and controls through migrations. Later features remain adjustable based on feedback and available time/budget.

## Update 1 — A Sense of Scale

Status: implemented and validated locally on 2026-10-14. Orbital hull reduced from 1.05 to 0.21; camera rig scaled proportionally to preserve the original on-screen ship framing, with matching lighting and collision clearance. First-person view, saved world coordinates, travel distances, and Earth surface proportions retained. Browser flight/landing and desktop POV checks passed, with 47 regression tests and steadier camera tracking. Distant effects and log-photo encoding were optimized following a reported flight stumble. Further visual tuning can follow creator feedback.

Outcome: planets feel vast relative to the ship while current first-person and third-person flight remain comfortable.

Scope:
- Review relative ship/planet sizes and choose a manageable scale approach.
- Adjust camera, clipping, safe approach distances, and related interactions as required by that approach.
- Preserve flight, autopilot, scanning, previews, Earth landing, and current view switching.

Done when: manual flight and automated approaches work at representative destinations, both camera views remain usable, and Earth landing/takeoff work without trapping or intersecting the ship. Confirm the desired sense of scale visually with the creator. Full astronomical scale is not assumed.

## Update 2 — A Window to Space

Status: implemented locally on 2026-10-14. A compact cabin connects through an open doorway to a walkable cockpit with a pilot seat and consoles. Shared monochrome controls provide Walk inside beside the flight views (I), and E near the seat takes controls. The side window and cockpit windshield render the live exterior with walking parallax. Bounded movement, looking, photos, and reliable flight-view return are supported. Entry works during manual flight anywhere in space, stopping the ship while you walk, as well as after a parked arrival. Same-tab refresh now restores the cabin position and viewing direction (updated October 15). Earth and Saturn browser checks passed; final validation is recorded in the work log. Not yet committed or published.

Depends on: Update 1 establishes the scale and camera approach.

Outcome: enter a small ship cabin while safely parked and watch the actual nearby planet through a window.

Scope:
- One compact walkable cabin connected to a cockpit, with live windows and a clear take-flight-controls interaction.
- Available during manual flight by stopping and holding position, or while parked near a destination; retain existing flight POV controls.
- Frame the live exterior scene so the window provides a satisfying planet view.

Done when: entering/exiting is reliable, movement stays inside the cabin, and the window view remains convincing at Earth and another destination. Preserve current space first/third-person views and settings. Friends aboard moving ships, labs, and extensive customization are deferred.

## Update 3 — A Place on Every World

Updated direction: prioritize breadth of explorable destinations before gathering, building, or multiplayer.

Scope implemented locally on October 15:
- Preserve Earth’s lakeside visit; add one contained surface zone each for Mercury, Venus, the Moon, and Mars.
- Add distinct imagined landscapes for Jupiter, Saturn, Uranus, and Neptune, inspired by their storms, rings, tilt, color, and winds. State that real giant planets have no walkable ground; do not substitute stations or platforms for world exploration.
- Match rocky-world gravity and broad environmental character to NASA facts. Explain Venus’s fictional protection and the giant worlds’ fictional terrain and tuned gravity.
- Make each visit playable from arrival through walking, a factual investigation, a photo, boarding, and departure.
- Save personal observations per existing game mode and retain existing flight/log/photo saves.

Follow-up: deepen the Moon into a guided introductory expedition and then extend meaningful activities across destinations. A whole seamless planet is outside this contained-zone scope.

Progression direction remains: prepare future Solo/Together deliberately, migrate existing saves before retiring Exploration, and enable multiplayer after an introduction rather than requiring all planets. Co-op is not implemented by this visit update.

## Update 4 — Gather and Build

Depends on: a reliable expedition and saved progression.

Outcome: gather a few materials, carry them in a backpack, and construct a useful shelter in one landing zone.

Scope:
- A small resource set and simple recipes.
- Backpack inventory and clear gathering/build interactions.
- One shelter design and a small buildable area with protected landmarks.
- Initial placement limits; dismantling returns defined supplies.
- Persist the camp and inventory through refresh.

Done when: the full gather/build/dismantle/save cycle works without duplication or lost resources, and structures cannot block essential access or spread across protected areas. Exact material counts and construction method are implementation choices to confirm during this update.

## Update 5 — Changing Worlds

Depends on: reusable landing interactions and shelter functionality.

Outcome: demonstrate a second planetary expedition and a meaningful environmental change.

Scope:
- One contained Mars zone with distinctive terrain.
- Clear and dusty conditions that affect visibility and one activity.
- A simple observation instrument; shelter has a practical role.
- Planet facts and fictional technology are clearly distinguished.

Done when: both conditions are enjoyable without mandatory waiting, Mars offers a reason to investigate or revisit, and the environment runs acceptably on supported desktop devices. Broader planetary coverage follows gradually; the Moon does not receive ordinary atmospheric weather.

## Update 6 — Explore Together

Depends on: stable simulation/progress boundaries and repeatable solo expeditions. Refactor necessary boundaries within this update; do not rewrite unrelated systems.

Outcome: two players create/join a private session, see each other, and complete a supported expedition together.

Scope:
- Minimal nickname/avatar profile and room-code joining.
- Networked ship/astronaut movement, shared world time, and explicitly defined shared-object ownership.
- Curated emoji reactions and location pings, with rate limits, muting/leaving, and session access control.
- Personal discoveries carry between solo and co-op.
- Disconnection and reconnection handling; server validates shared actions.

Build slices: first two ships in space, then one shared landing zone, then synchronized gathering/building with owner permissions. Do not require all planetary systems to be multiplayer-ready before the first limited test; clearly show what the initial session supports.

Done when: two real clients can join, explore, leave/rejoin, and retain progress without conflicting inventories or structures. Test network delay and measure hosting usage. No public matchmaking, unrestricted text chat, voice, or walkable interiors on moving multiplayer ships in the first version.

## Update 7 — Your Crew

Depends on: reliable co-op and a suitable identity/persistence service.

Outcome: keep a profile and mutually accepted friends, then invite them on another expedition.

Scope:
- Persistent profiles using nicknames, outfit selection, and earned mission patches.
- Mutual friends and private invitations with permission controls.
- Remove/block and parent-oriented social settings as appropriate to the intended age group.
- Avoid public personal information and unrestricted messaging.

Done when: profile progress persists, requests/invitations can be accepted or declined, blocking prevents further contact through the supported features, and friends can join without replaying the whole solo journey. Account recovery, child-oriented privacy requirements, and moderation responsibilities must be resolved before public launch; the exact identity design remains open.

## Update 8 — Support Odyssey

Depends on: an enjoyable free experience, ready cosmetic assets, and commercial-compatible hosting/payment setup.

Outcome: adults can optionally support the project through clearly priced cosmetic outfits or contributions.

Scope:
- Attractive free astronaut suit and worthwhile earned customization.
- A small optional outfit collection with identical abilities.
- Store outside expedition gameplay, with previews, exact prices, and reliable purchase fulfillment/restoration.
- Creator story, credits, dedicated contact/feedback, and voluntary support option.

Done when: free play stays complete, purchase and restoration flows work, support is clearly optional, and payment/hosting fees are understood. No random purchase boxes, hidden-price currency, countdown pressure, or paid progression advantages. Prices and provider are not settled. A creator/credits/contact page without payment can ship earlier as a small independent addition.

## Later expansions — choose based on player feedback

- More destinations, including believable fictional platforms for giant planets.
- Additional landing sites and connected investigations.
- Earth boat and an interesting water-accessible destination.
- Rovers where terrain and activities justify them.
- Robot or animal companions without absence penalties.
- Ship/cabin/shelter cosmetic styles.
- More interior rooms or friends visiting parked ships.
- Science lab, spacewalks, observatory, and larger cooperative research projects.

These are a backlog, not mandatory prerequisites for launch. Add one useful vehicle, companion, or destination at a time. Do not attempt entire planets, unrestricted construction, large public servers, or endless content in the initial scope.

## Next action

Review the new visits locally, validate landing/return and scientific labels at all nine destinations, and gather feedback before publishing. Then deepen expedition activities; gathering, building, and multiplayer remain later milestones.
