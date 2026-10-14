# Odyssey — Staged update roadmap

Created: 2026-10-14 (Asia/Manila).

Source: [Design direction](DESIGN_DIRECTION.md). This is a proposed delivery sequence, not a promise of dates or authorization to implement all updates immediately. No gameplay code has changed. Update names are working labels.

## Delivery rule

Finish one small playable update, verify it, and gather feedback before beginning the next. Publish player-facing notes only for shipped changes; do not add this future roadmap to src/game-updates.js as released features. Preserve existing saves and controls through migrations. Later features remain adjustable based on feedback and available time/budget.

## Update 1 — A Sense of Scale

Outcome: planets feel vast relative to the ship while current first-person and third-person flight remain comfortable.

Scope:
- Review relative ship/planet sizes and choose a manageable scale approach.
- Adjust camera, clipping, safe approach distances, and related interactions as required by that approach.
- Preserve flight, autopilot, scanning, previews, Earth landing, and current view switching.

Done when: manual flight and automated approaches work at representative destinations, both camera views remain usable, and Earth landing/takeoff work without trapping or intersecting the ship. Confirm the desired sense of scale visually with the creator. Full astronomical scale is not assumed.

## Update 2 — A Window to Space

Depends on: Update 1 establishes the scale and camera approach.

Outcome: enter a small ship cabin while safely parked and watch the actual nearby planet through a window.

Scope:
- One compact walkable cabin with a window and a clear return-to-cockpit interaction.
- First version available only while safely parked; retain existing flight POV controls.
- Frame the live exterior scene so the window provides a satisfying planet view.

Done when: entering/exiting is reliable, movement stays inside the cabin, and the window view remains convincing at Earth and another destination. Preserve current space first/third-person views and settings. Friends aboard moving ships, labs, and extensive customization are deferred.

## Update 3 — The First Expedition

Outcome: a complete solo Moon visit with a clear beginning, discovery, and return to the ship.

Scope:
- One contained Moon landing zone.
- Land, walk, experience distinct gravity, investigate one feature, take a photo, and return.
- Reuse and extend existing log/photo/guide systems.
- Establish a short introductory expedition and personal progress format.

Done when: a new player can complete the trip and resume appropriate progress without guidance or loss of existing saves. Learning emerges from one interaction rather than a long reading requirement.

Progression direction: prepare the shared future Solo/Together structure and migrate existing Discovery/Exploration progress deliberately. Retire the fully unlocked Exploration option only once its replacement is usable and saved progress has a defined migration. Do not display a functioning Together option before co-op exists. Multiplayer will require only the introduction, not all planets.

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

- More destinations, including believable fictional stations for giant planets.
- Additional landing sites and connected investigations.
- Earth boat and an interesting water-accessible destination.
- Rovers where terrain and activities justify them.
- Robot or animal companions without absence penalties.
- Ship/cabin/shelter cosmetic styles.
- More interior rooms or friends visiting parked ships.
- Science lab, spacewalks, observatory, and larger cooperative research projects.

These are a backlog, not mandatory prerequisites for launch. Add one useful vehicle, companion, or destination at a time. Do not attempt entire planets, unrestricted construction, large public servers, or endless content in the initial scope.

## Next action

Begin only Update 1 when implementation is requested: inspect current ship/planet/camera relationships, propose and apply a scale approach that preserves existing POVs, and validate flight and Earth landing. The roadmap itself does not change the game.
