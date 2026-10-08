# Odyssey — Solar System Explorer

A first-person, browser-based space exploration prototype built with Three.js.

## Run

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. Use **W/S** to fly forward and back, **A/D** to turn left and right, **Q/E** to pitch the nose up and down, and **Shift** while flying to boost. Boost spools up and winds down, with brighter engine exhaust, subtle speed streaks, and a wider camera view. Q/E rotates the ship without moving it, is limited to 28° above or below level, and slowly returns to level after release. Press W to fly along the current heading. The **arrow keys** provide alternate turn and pitch controls. The ship banks into turns and carries visible navigation, engine, and nose lights. Switch between **Cockpit**, **Chase**, and **Front** cameras with the buttons or **C**. Use the gear button to name your ship and pilot; those names are saved in your browser.

Click a destination, including Earth's Moon, to glide into a preview while the ship stays in place. Choose **Fly to** or press **P** to return to the ship and engage autopilot. The ship turns toward the destination, steers around nearby bodies, cruises at a measured speed, and stops at a viewing distance. Use a flight key to take manual control, or press the destination button again to cancel the flight. **Return to ship** closes a preview without moving the ship. Reduced motion settings make camera switches immediate.

The solar system uses compressed distances and sizes for enjoyable navigation, not scientific scale.
