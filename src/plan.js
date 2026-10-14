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
    { id: 'bedWin', a: 1.05, b: 2.25, y0: 0.95, y1: 2.0, type: 'window' },
  ],
  // south exterior wall z = D - T/2
  south: [
    { id: 'livWin', a: 0.55, b: 4.2, y0: 0.5, y1: 2.12, type: 'window' },
    { id: 'denSlider', a: 6.3, b: 7.95, y0: 0, y1: 2.05, type: 'slider' },
    { id: 'bathWin', a: 11.0, b: 11.7, y0: 1.3, y1: 1.9, type: 'window' },
  ],
  // west exterior wall x = T/2
  west: [
    { id: 'livFrench', a: 3.25, b: 4.1, y0: 0, y1: 2.03, type: 'door' },
    { id: 'livSlider', a: 4.3, b: 5.85, y0: 0, y1: 2.05, type: 'slider' },
  ],
  // kitchen east wall (to the screened porch) x = 9.6
  kitchenEast: [
    { id: 'sinkWin', a: 0.35, b: 2.0, y0: 1.0, y1: 2.05, type: 'window' },
    { id: 'porchDoor', a: 2.2, b: 2.9, y0: 0, y1: 2.03, type: 'door' },
  ],
  bedroomDoor: { a: 2.05, b: 2.85, y0: 0, y1: 2.05 }, // on x = 3.4 wall
  kitchenToDen: { a: 6.95, b: 8.1, y0: 0, y1: 2.12 }, // on z = 3.0 wall
  bathDoor: { a: 4.9, b: 5.65, y0: 0, y1: 2.03 }, // on x = 8.2 wall
  closetDoor: { a: 0.2, b: 0.95, y0: 0, y1: 2.03 }, // on x = 6.8 (closet tucked in the dinette corner, door faces the kitchen)
};

// Camera vantage points matching each listing photo (used for photo-compare + critic screenshots).
// fov is vertical degrees; photos are ~3:2 wide-angle real-estate shots.
export const VIEWS = {
  'living-east': { label: 'Living room → fireplace (photo 28)', pos: [1.9, 1.3, 5.3], look: [8.0, 1.1, 3.6], fov: 66 },
  'living-west': { label: 'Living room → sofa (photo 26)', pos: [6.3, 1.35, 1.2], look: [0.0, 1.05, 4.6], fov: 66 },
  kitchen: { label: 'Kitchen → fireplace (photo 20)', pos: [8.35, 1.3, 0.4], look: [7.5, 1.0, 6.0], fov: 66 },
  dinette: { label: 'Dinette (photo 25)', pos: [6.0, 1.35, 4.9], look: [7.6, 1.05, 0.2], fov: 66 },
  bedroom: { label: 'Bedroom (photo 30)', pos: [3.2, 1.3, 2.55], look: [0.0, 1.0, 1.15], fov: 66 },
  // exterior vantage points
  // ground: true => y values are heights above the terrain at that point
  front: { label: 'Front from the driveway (photo 1)', pos: [7.5, 1.4, -14], look: [7.0, 1.6, 0], fov: 58, ground: true },
  balcony: { label: 'Lake-side balcony (photo 15)', pos: [-1.6, 1.3, 6.5], look: [6.0, 0.6, 8.6], fov: 66 },
  patio: { label: 'Patio & fire pit (photo 12)', pos: [15.5, 1.5, -11.5], look: [17, 0.6, -3.5], fov: 62, ground: true },
  chalet: { label: 'Guest chalet (photo 10)', pos: [2.5, 1.4, -4.5], look: [2.5, 1.6, -16], fov: 60, ground: true },
  shed: { label: 'Shed (photo 11)', pos: [-18.5, 1.4, 10.5], look: [-13, 1.0, 18.5], fov: 60, ground: true },
  aerial: { label: 'Aerial (lot overview)', pos: [10, 45, -45], look: [6, -3, 8], fov: 50 },
};
