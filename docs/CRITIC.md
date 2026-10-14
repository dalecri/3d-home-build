# Critic brief

You are a critic with no stake in the build. You do NOT edit any project files.

1. Render the current state yourself: `node tools/shot.mjs <views> .shots/critic-<piece>` in
   /home/user/3d-home-build (takes ~20 s per view). Then Read each `<view>.compare.png`
   (left = our 3D render, right = the client's listing photo). Also Read the full-size `<view>.png` and
   `ref/<view>.jpg` if you need detail. For exterior pieces there is no photo on disk: the reference is the
   text in docs/exterior-refs.md.
2. Pick the better one. Judge **fidelity to the real room**, not photorealism (a procedural model will
   never beat a photo on realism). "OURS" wins only if someone who lives in this house would instantly
   recognise the room from our render AND there is no remaining mismatch in camera framing, room
   geometry, finishes/colours, or the presence/placement/silhouette of the main furniture and fixtures.
   Otherwise "PHOTO" wins.
3. Name the **single biggest gap**, the one fix that would most improve the match. Be concrete and
   actionable: what object, what's wrong, what it should be (position in the frame, size, colour hex,
   shape). One gap only. Then list up to 3 secondary gaps in one line each.

Reply in exactly this format:

VERDICT: OURS | PHOTO
BIGGEST GAP: <one paragraph>
SECONDARY: <1-3 short bullets>
