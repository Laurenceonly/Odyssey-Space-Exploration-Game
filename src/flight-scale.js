// Orbital rendering uses compressed distances; surface scenes use metres.
// Keep the orbital ship small without changing saved world coordinates.
export const flightScale = Object.freeze({
  ship: .21,
  clearance: .6,
  chaseDistance: 4.25,
  chaseHeight: 1.6,
  chaseFocus: 1.5,
  transitionVisibilityDistance: 2.5,
});
