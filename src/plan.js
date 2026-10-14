// Floor plan: the single source of truth for room bounds and openings.
// Footprint 12.5 m (x, west->east) by 6.0 m (z, north->south). Road north, lake south.
// Interior floor at y = 0, ceiling at CEIL. Exterior walls sit inside the footprint.
export const W = 12.5;
export const D = 6.0;
export const T = 0.15; // exterior wall
export const t = 0.1; // interior wall
export const CEIL = 2.4;
export const WALL_TOP = 2.55;

// Room rectangles (interior coords, metres).
export const ROOMS = {
  bedroom: { name: 'Bedroom', x0: T, x1: 3.35, z0: T, z1: 2.95 },
  living: { name: 'Living room', x0: T, x1: 4.6, z0: 3.05, z1: D - T, extra: { x0: 3.45, x1: 4.6, z0: T, z1: 3.05 } },
  dinette: { name: 'Dinette', x0: 4.6, x1: 6.8, z0: T, z1: 3.0 },
  kitchen: { name: 'Kitchen', x0: 6.85, x1: 9.55, z0: T, z1: 2.95 },
  den: { name: 'Fireplace room', x0: 4.6, x1: 8.2, z0: 3.05, z1: D - T },
  bath: { name: 'Bathroom + utility (awaiting photos)', x0: 8.25, x1: W - T, z0: 3.05, z1: D - T },
  porch: { name: 'Screened porch', x0: 9.6, x1: W, z0: -1.9, z1: 3.0 },
};

// Openings. Wall coords: a..b along the wall, y0..y1 height.
export const OPEN = {
  // north exterior wall z = T/2
  north: [
    { id: 'bedWin', a: 1.35, b: 2.2, y0: 0.95, y1: 2.0, type: 'window' },
  ],
  // south exterior wall z = D - T/2
  south: [
    { id: 'livWin', a: 0.55, b: 4.2, y0: 0.35, y1: 2.12, type: 'window' },
    { id: 'denSlider', a: 5.15, b: 6.7, y0: 0, y1: 2.05, type: 'slider' }, // just west of the SE-corner fireplace
    { id: 'bathWin', a: 11.0, b: 11.7, y0: 1.3, y1: 1.9, type: 'window' },
  ],
  // west exterior wall x = T/2
  west: [
    { id: 'livFrench', a: 3.12, b: 3.92, y0: 0, y1: 2.03, type: 'door' },
    { id: 'livSlider', a: 4.12, b: 5.6, y0: 0, y1: 2.1, type: 'slider' },
  ],
  // kitchen east wall (to the screened porch) x = 9.6
  kitchenEast: [
    { id: 'sinkWin', a: 1.0, b: 2.3, y0: 1.15, y1: 2.05, type: 'window' },
    { id: 'porchWin', a: 2.42, b: 2.88, y0: 1.15, y1: 2.05, type: 'window' }, // photo 20: glass beyond the valance window, no door
  ],
  bedroomDoor: { a: 2.05, b: 2.85, y0: 0, y1: 2.05 }, // on x = 3.4 wall
  kitchenToDen: { a: 7.1, b: 8.1, y0: 0, y1: 2.12 }, // on z = 3.0 wall
  bathDoor: { a: 3.2, b: 3.95, y0: 0, y1: 2.03 }, // on x = 8.2 wall (north end: the den fireplace fills the SE corner)
  closetDoor: { a: 0.2, b: 0.95, y0: 0, y1: 2.03 }, // on x = 6.8 (closet tucked in the dinette corner, door faces the kitchen)
};

// Camera vantage points matching each listing photo (used for photo-compare + critic screenshots).
// fov is vertical degrees; photos are ~3:2 wide-angle real-estate shots.
export const VIEWS = {
  'living-east': { label: 'Living room → fireplace (photo 28)', pos: [0.95, 1.15, 3.85], look: [5.3, 0.8, 6.2], fov: 68 },
  'living-west': { label: 'Living room → sofa (photo 26)', pos: [6.6, 1.35, 3.9], look: [1.82, 1.09, 2.44], fov: 70 },
  kitchen: { label: 'Kitchen → fireplace (photo 20)', pos: [8.30, 1.20, 0.60], look: [7.26, 1.20, 6.51], fov: 72 },
  dinette: { label: 'Dinette (photo 25)', pos: [6.75, 1.28, 4.3], look: [6.2, 1.0, 0.4], fov: 66 },
  bedroom: { label: 'Bedroom (photo 30)', pos: [3.08, 1.22, 2.71], look: [0.63, 0.95, 1.0], fov: 60 },
  // exterior vantage points
  // ground: true => y values are heights above the terrain at that point
  front: { label: 'Front from the driveway (photo 1)', pos: [7.2, 1.5, -12.8], look: [6.4, 1.6, 0], fov: 58, ground: true },
  balcony: { label: 'Lake-side balcony (photo 15)', pos: [-1.6, 1.3, 6.5], look: [6.0, 0.6, 8.6], fov: 66 },
  patio: { label: 'Patio & fire pit (photo 12)', pos: [10.1, 1.5, -5.5], look: [17.5, 0.4, -4.4], fov: 62, ground: true },
  chalet: { label: 'Guest chalet (photo 10)', pos: [-0.1, 1.4, -6.8], look: [-0.5, 1.5, -14.5], fov: 60, ground: true },
  shed: { label: 'Shed (photo 11)', pos: [-21.5, 1.4, 15.5], look: [-14, 1.0, 19.5], fov: 60, ground: true },
  aerial: { label: 'Aerial (lot overview)', pos: [-15, 45, -74], look: [6, -3, 8], fov: 50 },
};
