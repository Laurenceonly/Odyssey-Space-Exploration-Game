# Odyssey — Solar System Explorer

A first-person, browser-based space exploration prototype built with Three.js.

## Run

```sh
npm install
npm run dev
```

Open the local URL printed by Vite and choose **Play**. The intro shows the ship flying slowly near Earth before the camera moves into third-person flight. Use **W/S** to fly forward and back, **A/D** to turn left and right, **Q/E** to pitch the nose up and down, and **Shift+W** to boost forward. Reverse flight stays at normal speed and cancels the boost effect. Boost spools up and winds down, with brighter engine exhaust, subtle speed streaks, and a wider camera view. Q/E rotates the ship without moving it, is limited to 28° above or below level, and slowly returns to level after release. Press W to fly along the current heading. The **arrow keys** provide alternate turn and pitch controls. The ship banks into turns and carries visible navigation, engine, and nose lights. Switch between **First person** and **Third person** cameras with the buttons or **C**. Use the gear button to name your ship and pilot; those names are saved in your browser.

The intro quotes Neil Armstrong's first step on the Moon, using [NASA's published wording](https://www.nasa.gov/history/50-years-ago-one-small-step-one-giant-leap/). Display text uses Oxanium; descriptions use DM Sans.

Click a destination, including Earth's Moon, to glide into a preview and open its info panel while the ship stays in place. Aim the ship's **+ reticle** at a planet to see its name; press **F** to open its info without entering preview, and press **F** again to close it. Choose **Fly to** or press **P** to return to the ship and engage autopilot. The ship turns toward the destination, steers around nearby bodies, cruises at a measured speed, and stops at a viewing distance. Use a flight key to take manual control, or press the destination button again to cancel the flight. **Return to ship** closes a preview without moving the ship. Reduced motion settings make camera switches immediate.

The tab beside the destinations panel hides or shows the list and remembers your choice. The field guide opens when you choose a destination, hides after 12 seconds of inactivity, and can be reopened from its right edge tab. Planetary orbits and the asteroid belt are spaced 3.2 times farther apart to make flights take longer. The space backdrop is nearly black.

An original, continuous score adds layered chords, low pulses, and sparse melodic notes. Engine sound follows speed and boost, and the music softens during boost so flight cues remain clear. The sound button in the top bar mutes music and effects. Ship settings has a saved Music volume slider from 0% to 150%. The game attempts to start music on load; browsers that restrict autoplay begin playback on the first click or key press.

The planets are enlarged relative to the ship so they dominate the flight view. Orbital distances remain compressed for navigation rather than following one astronomical scale.
