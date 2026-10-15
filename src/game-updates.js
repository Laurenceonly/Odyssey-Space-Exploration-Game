export const gameUpdates = [
  {
    "date": "2026-10-15",
    "title": "A place on every world",
    "summary": "Explore all eight planets and the Moon, swim on Earth, climb rocks, and resume your visit after refresh.",
    "notes": [
      "Added: Land on Mercury, Venus, the Moon, Mars, Jupiter, Saturn, Uranus, and Neptune alongside Earth, with a distinct landscape and landmark at every destination.",
      "Added: Each visit supports walking, a NASA-linked observation, photos, boarding, and takeoff. Observations save separately for Discovery and Exploration; a new Discovery game clears that voyage’s observations.",
      "Added: Storm terraces on Jupiter, ringlit ice fields on Saturn, a tilted frost canyon on Uranus, and wind-carved ridges on Neptune. These are imagined landscapes; real giant planets have no walkable ground.",
      "Improved: Rocky worlds have different gravity and environmental character. Discovery panels distinguish real science from fictional giant-planet terrain and Venus’s protective technology.",
      "Improved: Landing requires an actual nearby approach or autopilot arrival. Remote previews cannot grant landing, and Saturn supports its wider ring-safe parking distance.",
      "Added: Wade and swim in Earth’s lake, use Shift for a stronger stroke and Space or J for a water kick, with paddling and a waterline ripple.",
      "Improved: Jump onto reachable rocks and landmark surfaces, stand on their visible tops, walk off edges, and pass beneath raised arches.",
      "Fixed: Curved rock edges no longer trap the astronaut. Brief jump taps are remembered until the next movement frame.",
      "Improved: Forward elbow bends, opposing arm swing, and smoother transitions between walking, jumping, and swimming.",
      "Added: Refresh in the same tab restores your visited world, surface or cabin position, camera view, and looking direction, including on rocks and in water. Existing discoveries, logs, photos, and flight saves remain supported.",
      "Added: Find ship below Return to ship shows direction and distance and turns your view toward the ship without moving the astronaut. Repeated camera rotations use the shortest turn back.",
      "Improved: Larger survey flags mark every landmark. Earth’s fallen wood rests on the terrain and a subtle soil path replaces the small trail pegs removed from all worlds.",
      "Improved: Planet previews fit the space beside the guide panels and HUD. Saturn and Uranus have closer default views with their rings visible.",
      "Added: A credited NASA photo of comet NEOWISE in the Field Guide, shown as a real comet example.",
      "Improved: Concise landing guidance, consistent Field Guide action text, centered cabin controls, and aligned cockpit keys. Buttons use clear action labels while keyboard shortcuts continue to work.",
      "Removed: The flight key strip and its Settings toggle, plus cabin walking instructions, interaction prompts, shortcut badges, and console instruction captions. The control reference remains available."
    ]
  },
  {
    date: '2026-10-14',
    title: 'Quiet loading, distinct music',
    summary: 'A minimal loading screen and two distinctly different soundtrack arrangements.',
    notes: [
      'Improved: Startup and refresh reveal the Odyssey wordmark from gray to white as the scene prepares, with quiet status text and clear recovery instructions.',
      'Added: Enter your cabin anywhere in space during manual flight. The ship stops and holds position while you explore.',
      'Improved: Solar Sails has a rhythmic synth arrangement with drums, bass, and arpeggios.',
      'Improved: Blue Hour uses sparse piano and chimes, with space between phrases instead of sustained pads.'
    ]
  },
  {
    date: '2026-10-14',
    title: 'Sharper views and smoother controls',
    summary: 'Subtle button feedback, interactive cockpit controls, and two new original scores.',
    notes: [
      'Improved: Buttons across the intro, flight, menus, and Earth respond to hover without moving.',
      'Added: Use cockpit screens and keys for navigation, photos, the log, music, and flight views. Click or press E while aiming at a control.',
      'Fixed: Cabin windows keep their live exterior view sharp when you approach the glass.',
      'Fixed: Voyages stays hidden while inside the ship, including after refresh.',
      'Added: Solar Sails and Blue Hour join the soundtrack, with a Next track button in Settings.',
      'Fixed: Prepared music loops continue through delayed game updates, and the current track plays while another prepares.'
    ]
  },
  {
    date: '2026-10-14',
    title: 'A window to space',
    summary: 'Walk through your parked ship’s cabin and cockpit, with live views of nearby worlds.',
    notes: [
      'Added: Walk through a compact cabin into a separate cockpit with a pilot seat, navigation consoles, and equipment lockers.',
      'Added: The side observation window and cockpit windshield show the live exterior from your parked ship, with views that change as you walk.',
      'Added: Choose Walk inside beside the camera views or press I during manual flight or while parked. The ship stops while you explore. Use WASD to walk and mouse dragging or arrow keys to look.',
      'Improved: Walk freely into and out of the cockpit. Press E near the pilot seat to take controls, or use Flight view or Escape to return to your original flight camera while remaining parked.',
      'Improved: The ship interior and buttons follow Odyssey’s charcoal shading, monochrome text, and shared control style.',
      'Added: Take cabin photos with T and open Captain’s log with L. Refreshing returns you safely to the parked cockpit.'
    ]
  },
  {
    "date": "2026-10-14",
    "title": "Larger-feeling worlds and steadier flight",
    "summary": "Worlds feel larger around your ship, with familiar views and smoother camera tracking.",
    "notes": [
      "Improved: Planets feel larger relative to the spaceship while third-person flight retains the original ship framing and field of view.",
      "Improved: Ship lighting and collision clearance match its smaller size, allowing closer approaches to worlds and debris.",
      "Improved: First-person flight retains its original viewpoint. Saved positions, travel distances, and the full-sized ship on Earth are preserved.",
      "Fixed: Third-person camera tracking stays steady when frame timing varies, avoiding catch-up jumps during flight.",
      "Improved: Flight does less background work on distant effects while keeping nearby comet and ring motion detailed.",
      "Improved: Captain’s log photos encode without pausing flight for JPEG compression."
    ]
  },
  {
    "date": "2026-10-14",
    "title": "Desktop exploration and a smoother launch",
    "summary": "Odyssey now focuses on desktop play, with a smoother launch and a clearer experience.",
    "notes": [
      "Fixed: Mouse drag-to-look works on Earth in both camera views. Releasing the mouse stops looking, and menus pause camera input.",
      "Improved: The tab icon is dark in light browser themes and white in dark themes.",
      "Added: Phones and tablets show a desktop-only notice without loading the 3D game.",
      "Removed: Mobile gameplay, the joystick, and touch-only action buttons. Play on a desktop or laptop with a keyboard and mouse.",
      "Fixed: Play transitions smoothly into the ship view without a camera correction at the start or end, including narrow desktop windows.",
      "Improved: The launch and flight camera use the same framing on wide and narrow desktop windows. Reduced motion keeps its immediate handoff."
    ]
  },
  {
    "date": "2026-10-13",
    "title": "Recent improvements and fixes",
    "summary": "Cleaner controls, simpler astronaut steps, and fixes for autopilot, sound, and takeoff.",
    "notes": [
      "Fixed: Landing gear stays retracted through the final takeoff transition instead of reappearing near the atmosphere.",
      "Fixed: Settings stays at the top right on Earth and uses the same circular icon as space.",
      "Fixed: Earth parking says “Parked near Earth · ready to land” instead of showing 11 units away. Landing remains a separate action.",
      "Fixed: Autopilot leads moving destinations, completes detours, and recovers stalled or overlong flights.",
      "Fixed: Settings and other controls stay hidden during loading, including after refresh.",
      "Fixed: Opening the menu no longer types held flight keys into the name field.",
      "Fixed: Sound preferences survive refresh, and turning sound on or off preserves music volume.",
      "Added: A refined profile icon and saved name share a non-clickable pill in space.",
      "Improved: Astronauts use a simple step cycle with clearer strides, forward-bending knees, level boots, and less leg twisting.",
      "Improved: Rounded, translucent charcoal buttons share white text and adapt their shading to Earth daylight.",
      "Improved: Earth’s Log button sits beside the camera and photo controls. The flight manual has larger instructions.",
      "Removed: Intro/header music icons. Music and sound on/off is now in Settings.",
      "Removed: The duplicate header name on Earth; the astronaut keeps its name label.",
      "Removed: The Start exploring button from the manual. Close it with × or Escape.",
      "Removed: Settings from the intro. Open the gear button during flight or on Earth to change sound and profile preferences.",
      "Improved: Planet texture credits moved into Settings, clearing the bottom-right game view while keeping source and license links."
    ]
  },
  {
    "date": "2026-10-13",
    "title": "Earth expeditions and mobile play",
    "summary": "Land beside a lake, step outside your ship, and explore on foot.",
    "notes": [
      "One grassy Earth landing site with trees, rocks, water, and a welcome for your pilot.",
      "An articulated astronaut with Earth gravity, walking, running, jumping, and first- or third-person cameras.",
      "Touch controls for phone play in portrait and landscape; desktop keeps keyboard controls.",
      "Fly to Earth and park, or approach manually, before landing. Board your ship and take off when you’re ready.",
      "Compact landing supports deploy beneath the hull and retract after lift-off.",
      "Landing, exploring, boarding, and takeoff now appear in the Captain’s log with snapshots.",
      "Autopilot keeps its course through impacts and recovers stalled approaches. Use Cancel flight or P to stop it.",
      "Reopen the Field Guide after closing it, including during planet previews. Flight panels stay hidden on Earth.",
      "Music choices are available through Settings during play, with smoother transitions and a cleaner interface."
    ]
  },
  {
    "date": "2026-10-10",
    "title": "Richer worlds and safer flights",
    "notes": [
      "Detailed planet textures, Earth clouds and night lights, atmospheric rims, and Saturn’s ring shadows.",
      "Asteroid and ring fragments react to collisions, with fracture effects, dust, hull sounds, and camera recoil.",
      "A moving comet with curved dust and ion tails, plus a clearer close-up preview.",
      "Safer Moon spawning and recovery when moving bodies overlap the ship.",
      "Planet details and shaders prepare behind a loading screen before the intro appears."
    ]
  },
  {
    "date": "2026-10-09",
    "title": "Discoveries, voyages, and memories",
    "notes": [
      "Discovery mode lets you scan and reveal 11 destinations. Exploration opens every destination immediately.",
      "Resume a saved Discovery voyage or start a new one. Signal pulses help locate unknown worlds.",
      "Scan Olympus Mons, the Great Red Spot, and the Cassini Division as planetary landmarks.",
      "Follow the optional Inner Worlds, Giant Planets, and Outer Dark voyages.",
      "The Captain’s log records scans, flybys, arrivals, and encounters. Save, view, download, or delete photos in its gallery.",
      "Explore more facts in a scrolling Field Guide, with NASA imagery and source credits."
    ]
  },
  {
    "date": "2026-10-08",
    "title": "Your first voyage",
    "notes": [
      "Free flight, boost, autopilot, and first- or third-person ship cameras.",
      "An Earth-side intro with a smooth handoff into flight, enlarged planets, and spaced planetary orbits.",
      "Saved ship and pilot names, flight resume after refresh, and a confirmed return to the intro.",
      "Original music with track selection, a playlist, volume control, and engine and flight sounds.",
      "The monochrome Odyssey interface, textured destination icons, and the Solar System Field Guide."
    ]
  }
];
