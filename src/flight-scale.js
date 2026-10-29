// Orbital rendering uses compressed distances; surface scenes use metres.
// Scale the hull and camera rig together to retain the original on-screen
// ship framing. Saved world coordinates and first-person view stay intact.
const orbitalRatio = .2;
export const flightScale = Object.freeze({
  ship: 1.15 * orbitalRatio,
  clearance: .76,
  chaseDistance: 8.5 * orbitalRatio,
  chaseHeight: 3.2 * orbitalRatio,
  chaseFocus: 3 * orbitalRatio,
  transitionVisibilityDistance: 5 * orbitalRatio,
  cameraResponse: 9,
});
