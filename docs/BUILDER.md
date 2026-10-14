# Builder brief (read fully before editing)

Project: walkable Three.js model of a Labelle, QC lake house built from listing photos.
1 unit = 1 m. House footprint 12.5 m (x, west->east) by 6.0 m (z, north->south). Road north, lake south (+z).
Floor y = 0, ceiling y = 2.4. Floor plan and photo camera vantage points live in `src/plan.js` (ROOMS, OPEN, VIEWS).

## Files
- `src/rooms/<room>.js` : furniture/fixtures for one room. YOUR main file.
- `src/furniture.js`    : shared furniture helpers (sofa, chairs, lamps, mirrors...). Add NEW helpers freely; do not change the behaviour of existing ones other rooms use (add an option instead).
- `src/lib.js`          : box()/wallX()/wallZ()/wainscot()/casing()/windowUnit()/doorSlab()/mat(). box(parent,w,h,d,mat,x,yBottom,z,opts).
- `src/textures.js`     : procedural canvas textures (tex(name, opts)). Adding a new maker is fine.
- `src/shell.js`        : walls, openings, wainscot, beams, roof, porch, deck. Shared by everyone.
- `src/plan.js`         : room rectangles, openings, VIEWS (camera poses per photo).
- `src/main.js`         : renderer, lights, UI. Shared.
- `ref/<view>.jpg`      : the client's listing photo for each view (1500x1000).

## Rules
1. The overall room layout (which room is where, walls between rooms) is fixed. You MAY nudge openings/
   windows/doors/wainscot/trim that belong to your room in shell.js/plan.js, and you MAY tune your own VIEWS
   camera pose (pos/look/fov) so it matches the photo's vantage point - that is encouraged and is usually
   the first thing to fix.
2. Other builders are editing other rooms AT THE SAME TIME. In shared files (shell.js, plan.js, main.js,
   furniture.js, lib.js, textures.js) make small surgical edits with the Edit tool and re-Read the file right
   before each edit. Never rewrite a shared file wholesale. Never revert changes you didn't make.
3. Global lighting lives in main.js. If lighting is the biggest gap, prefer adding local lights in your room
   file. Only touch main.js lighting for a clear whole-house fix, and say so in your report.
4. Render your view(s): `node tools/shot.mjs <view>[,<view>] .shots/<yourroom>`  (~20 s each, headless WebGL).
   It writes `<view>.png` and `<view>.compare.png` (ours left, photo right). LOOK at them with Read after
   every meaningful change. Check the output for "PAGE ERRORS".
5. Build must stay working: `node tools/build.mjs` must succeed.
6. Do NOT git commit or push; the orchestrator commits.
7. Keep perf sane: this runs on phones. Prefer boxes/cylinders and canvas textures; no external assets,
   no network loads. Avoid adding more than ~3 point lights per room; no new shadow-casting lights.

## What "matching" means
Same room shape and proportions from the photo vantage point, same finishes (colours, wainscot, floor,
ceiling), same furniture in the same places with the right silhouettes/colours, same fixtures (lights,
windows, doors, art). Photorealism is not expected; recognisability and accuracy are.

## Report back (final message)
- What you changed (files + 1 line each)
- The path of your latest compare image(s)
- Anything you could not match and why
