# Odyssey — Earth exploration plan

Updated: 2026-10-29 (Asia/Manila).

Status: Fernlilt and its local exploration map are playable. Twelve other destinations, including Cirelune Marsh and Dorynth Volcanic Fields, are shown as closed portals and cannot currently be entered. Earlier sections below preserve dated design discussions; where they differ, this status and the October 29 update take precedence. Local ponds, groves, and hills do not represent those larger regions.

## Current direction — October 29

The map has thirteen named destinations, with themed icons on the map and minimap and matching colored entrance-route branches on the full map. The eastern routes lead to two newly agreed places: **Cirelune Marsh**, a peat bog with dark still pools, copper moss, low mist, and small patches of firm ground; and **Dorynth Volcanic Fields**, an open landscape of cooled black lava, steam vents, and warm springs. These are concepts, not playable terrain. Their portals are closed, like the other non-Fernlilt entrances. All portals are large, destination-themed landmarks with animated colored surfaces and in-world signs; only the closest nearby sign is shown and normal depth prevents names showing through scenery.

The astronaut has a non-modal backpack and an equipable hoverboard. Press B for the backpack and H to equip or put away the board; use movement keys, Shift for speed, and double Space for a board boost. Board sound responds to speed and the board is put away in water. Earth has surface movement sounds, quiet wind, and Solar Sails on touchdown, subject to the player's sound settings. The user has reported landing and surface FPS drops; graphics presets and lighter distant grass remain available, and actual performance varies by device.

## Agreed experience

Earth should feel cinematic, relaxing, and worth exploring. The journey itself matters: beautiful scenery, curiosity about what lies ahead, quiet places to linger, and distinct destinations. Do not plan activities or quest requirements yet.

Use gradual landscape transitions, distant landmarks, smaller discoveries, and generous quiet spaces. Reveal views through the player's movement while preserving camera control. Avoid filling every stretch with landmarks or covering all ground with vegetation.

## Selected names and pronunciation

The creator accepted this revised set after requesting different starting letters and distinct syllables. Count the distinctive name, not generic Mount/Lake/category prefixes. Shared individual sounds are inevitable; preserve distinct openings, stressed syllables, and endings when revising.

| Category | Selected name | Intended pronunciation |
|---|---|---|
| Grasslands | Fernlilt Grasslands | FERN-lilt |
| Forest | Rainselve Woods | RAIN-selv |
| Lake | Lake Evrathen | EV-ruh-then |
| Ridge | Vaelcren Ridge | VAYL-kren |
| Jungle | Ossamber Jungle | OSS-am-ber |
| Desert | Ashqarin Desert | ash-KAH-rin |
| Caves | Nacreloom Caverns | NAY-ker-loom |
| Mountain | Mount Keltrond | KEL-trond |
| Coast | Teshora Coast | teh-SHOR-ah |
| Snow | Hyskrum Tundra | HISS-kroom |
| Ocean | Uloqai Ocean | oo-lo-KAI |
| Marsh | Cirelune Marsh | Not yet specified |
| Volcanic fields | Dorynth Volcanic Fields | Not yet specified |

Names superseded by this revision: Mount Auldrissen, Tiderosse Coast, Rimeossel Tundra, and Aumethra Ocean. Earlier candidates are not additional regions.

Naming constraint: avoid copying existing game locations. Preliminary web searches found no relevant game-location matches for the replacements, but this is not proof of universal uniqueness. Do not describe names as guaranteed unused.

## Proposed character of each region

The creator accepted the cinematic exploration direction. These scenery and sound details are working concepts to refine during implementation, not promises of completed assets.

| Region | Landscape and atmosphere | Discovery or view to draw the player onward | Ambient sound | Music direction |
|---|---|---|---|---|
| Fernlilt | Rolling green hills, scattered wildflowers, wind moving grass, warm light and an enormous sky | A lone hilltop tree; a first glimpse of the lake beyond | Grass, wind, distant birds | Warm piano and gentle strings |
| Rainselve | Tall trees, wet bark, gentle rain, light through the canopy | A stream winding between roots to a secluded waterfall | Rain on leaves, branches, individual drops | Sparse woodland melody |
| Evrathen | Clear shallows, reeds, reflections, morning mist | A small island with a view back toward shore | Lapping water, reeds, shoreline birds | Slow piano with spacious pauses |
| Vaelcren | Weathered rock, shrubs, exposed ridgelines, cloud shadows | A winding ascent revealing surrounding regions | Gusts and distant valley sounds | Airy strings |
| Ossamber | Broad leaves, hanging roots, dense greenery, humid mist | An opening into a waterfall basin | Layered birds, insects, dripping leaves | Soft wooden percussion |
| Ashqarin | Rust-red dunes, sandstone, rippled sand, long shadows and silence | A canyon entrance between towering rock walls | Shifting sand and wind around rock | Low tones and occasional plucked notes |
| Nacreloom | Pale mineral formations, pools, echoes, occasional daylight shafts | A narrow passage opening into an immense reflected chamber | Water drops and footsteps echoing | Delicate resonant notes |
| Keltrond | Forested lower slopes, exposed stone, alpine flowers, cloud banks | A summit visible earlier in the journey, with a rewarding panorama | Wind, gravel and distant birds | Strings opening gradually near the summit |
| Teshora | Rose-colored cliffs, sheltered beaches, tide pools, sea arches and surf | A hidden beach revealed around a headland | Surf, seabirds and tide pools | Gentle guitar and piano |
| Hyskrum | Frosted grass, snowdrifts, frozen lakes, scattered trees, clear-night auroras | Blue ice across a frozen basin and a sheltered overlook | Muffled steps, snow and ice creaking | Quiet crystalline tones |
| Uloqai | Turquoise shallows deepening to blue, seabed light and remote islands | Reefs, underwater arches and island silhouettes | Waves above; muted water ambience below | Slow flowing ambient music |
| Cirelune | Dark peat pools, copper moss, low mist, and small firm islands | A path across the bog's firm ground | Not yet selected | Not yet selected |
| Dorynth | Cooled black lava, weathered formations, steam vents, and warm springs | An open volcanic field shaped by old eruptions | Not yet selected | Not yet selected |

## Connected exploration

Proposed first slice: Fernlilt → Rainselve → Lake Evrathen as one connected journey. Establish the feeling of exploration before expanding to all 11 regions.

Biome boundaries should blend. For example, trees become more frequent, grass becomes ferns, light softens, and birdsong changes before the forest title appears. Ridge and mountain should have different scales and silhouettes. Coast and ocean should transition from sheltered shore to open water and depth.

Changing time of day and weather can make revisits feel different. Exact weather systems, map layout, dimensions, travel times, streaming, region boundaries, and implementation order beyond the first proposed slice remain undecided. Eleven named region categories do not imply eleven separate loaded maps or whole-planet coverage.

## Location discovery notification

Show a centered, unobtrusive location title on first entry, for example:

LOCATION DISCOVERED
RAINSELVE WOODS
Earth

Use a gentle fade in/out, roughly three seconds on screen, and subtle audio feedback. Preserve gameplay control. Reveal the region on the map; show a simpler title for later visits. Prevent repeat notifications when hovering near a boundary. Timing and visual treatment are provisional.

## Exploration map

The creator requested a map showing the player's location and places not yet unlocked/discovered.

Proposed behavior:
- Player position and facing direction.
- Discovered terrain, region names, and found landmarks.
- Soft fog over unexplored areas with restrained geographic hints.
- Gentle region boundaries after discovery.
- Selectable waypoints with distance.
- Earth discovery progress, such as 3 of 11 regions discovered.
- Newly entered regions reveal on the map; smaller landmarks appear when found.
- Muted natural colors, topographic contours, blue water, and a clear player marker.
- M to open the full map; a compact compass during exploration.

Distinguish undiscovered from inaccessible. Proposed default is free exploration into unknown regions, reserving locks for actual access requirements. The creator has not selected any Earth access requirements; do not invent them. Final fog/reveal granularity, save behavior, map controls, and interaction details need implementation design.

## Regional audio and space

The creator requested different sounds or tracks for each place and less audio in space. Give regions distinct environmental sound and intermittent music. Blend transitions smoothly, with quiet stretches between musical passages; use occasional short musical moments for major reveals. Directional/distant audio can draw attention naturally, such as a waterfall heard before it is seen.

Space proposal: longer silence between music, restrained ship hum, subtle instrument sounds, and occasional expansive music at planetary reveals. Exact existing tracks/sounds to remove, reduce, or replace remain unresolved. A clarification was asked, but no specific selection was received. Do not assume permission to delete particular audio assets.

No music assets, composers, licensing sources, track counts, or detailed mix values have been selected.

## Next practical milestone

Review the connected grasslands/forest/lake layout, map scale, visual targets, discovery/reveal behavior, and audio approach before implementation. Keep future work distinct from shipped release notes. This document records planning only.

## Spatial layout draft

See [Earth region layout](EARTH_REGION_LAYOUT.md) for the current thirteen-region direction and the earlier eleven-region schematic. The schematic is historical, not the implemented player map.

## Creator correction — large independent regions

Each selected name denotes a substantial destination/region in its own right. Lake Evrathen is a large lakeside region, not a small pond named inside Fernlilt. Rainselve, Vaelcren, and all other named regions likewise need their own substantial areas. The compact terrain prototype must not count its pond, woodland patch, or rise as discoveries of those full regions. Small unnamed ponds, groves, and hills can exist within a region without inheriting another region's name.

The earlier compact multi-region labels are superseded. The current landing patch is only an early Fernlilt prototype. The creator is choosing whether the large regions join as one continuous landscape or use travel transitions; no scale or travel architecture is finalized yet. Map disclosure must distinguish a region that exists but is undiscovered from a region whose terrain is not yet built.

## Local map implementation — October 16

Press M or choose Map while walking on Earth or aboard its parked ship. The map uses current terrain heights and water coverage, a zoom-aware 100 m / 50 m scale bar, player position/facing, ship marker, explored-ground fog, and local waypoints. Exploration progress persists separately for Discovery and Exploration; New game clears Discovery map progress. Thirteen destinations are listed; Fernlilt is the playable region, and the other twelve entrances are closed for now. The map covers Fernlilt, not a finished whole-region or whole-planet map. Waypoints are local to the current session. The non-modal map supports walking, running, and jumping while open, with M/Escape closing and keyboard waypoint placement. It follows the player until panned; recentering resumes following. Coordinate editing clears held movement, while Settings and other blocking menus close the map and pause gameplay.


## Current scenery direction — October 17

The creator’s photographic references and follow-up feedback supersede the earlier short green meadow and orange/yellow golden-hour treatment. Fernlilt now uses a nearly continuous tall golden grass field, earthy ground, clear blue daylight and pale warm sunlight. The main grass canopy rises above the astronaut (approximately 2.3–2.6 m); paths and landing clearance remain lower. Individually spread roots and overlapping growth replace visibly separate, identical planted-looking bunches. Broader hills, distant ridges and a shallow winding creek add structure. This scenery update stays within Fernlilt and does not build or discover any of the other ten regions.


### Passage and opening balance

The creator approved broad walking corridors with selected maze-like enclosed stretches, balanced by open grassland. Ordinary paths now provide roughly 3–4 m of walking width, widening around openings, with root margins accounting for spread-out blades. Four soft passage areas raise growth along bends to roughly 3.5–4.5 m; six low meadow openings preserve arrival space, ridge views, a hillside clearing, grove space, a stream outlook, and a southern view. Near and distant grass share these height and clearance rules. Trees, rocks, and flowers respect the broader corridors. This is freely explorable scenery, not a compulsory maze or a new quest system.


### Atmosphere and longer grass range — October 17

Ordinary paths are now approximately 3–4 m across, widening around the existing meadow openings. On High, detailed grass uses a 7×7 reusable tile pool and blends between 56 and 88 m; the cheaper field continues to roughly 480 m. The distant layer samples the same placement, height and palette as the detailed field. Multisample coverage blending replaces visible height shrinking and screen-door noise. The grass-colored ground and horizon remain present beneath both layers.

Broad gusts move in a consistent world direction, with smaller blade flutter. Warmer directional sunlight, lower sky fill, subtle drifting ground-light variations and backlit tips provide depth while keeping the blue daytime sky. Reduced motion freezes the cyclic field animation. Sun shadows follow the astronaut’s location. No regional audio or weather gameplay was added. A centered Welcome to Earth greeting appears after touchdown for 5.5 active-play seconds, then fades out.


### Graphics and header follow-up — October 17

Saved graphics presets adjust resolution and grass geometry together. High draws 28 blades per near patch and four crossed canopy projections per distant patch, Medium uses 18/3, and Low uses 6/3. High extra blades fade over 24–40 m and 40–64 m; Medium extra blades fade over 28–48 m. Reusable per-tile geometry tiers skip only fully faded extras, using actual camera position and a safety margin. Base detail blends end at 88/72/56 m respectively; the distant canopy remains at every approach distance, without camera clearance or height shrinking. Low bounds 3D rendering to a 768 × 432 pixel budget while preserving native interface text. Grass tile refills are spread across frames during walking. Auto chooses lighter detail under sustained load. A saved Shadows toggle applies independently. The original plain FPS counter sits beside Odyssey in both space and surface views; the header player name and profile icon are hidden. Saved names remain editable in Settings.
