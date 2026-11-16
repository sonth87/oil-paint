# Licence notes: oil paint

Code MIT. Art CC0 1.0. Checked 2026-11-10.

| Part | Where it came from | Licence | In this repo? |
|---|---|---|---|
| `src/oilpaint/` (dabs, brush, ground, pins, shade, canvas) | Written by Patch for this block | MIT | Yes |
| `src/world/` (land, floor, trees, sky, leaves) | Written by Patch for this demo. Every tree, leaf and brush mark is made in code; no picture or model is loaded for them | MIT; what it draws CC0 | Yes |
| `src/figure/cloak.js`, `figure.js`, `camera.js` | Written by Patch for this demo | MIT; what it draws CC0 | Yes |
| `src/figure/man.js`, `animator.js`, `player.js`, `input.js`, `hands-anymove.json` | Patch's starter man (patch-lab, `starter-character-combined`), copied with three small changes: the three.js import, a loading-progress callback, and a caught pointer-lock refusal | CC0 1.0, Patch | Yes |
| `public/figure/starter-man.glb` | Patch's starter man: built with MPFB2 from MakeHuman system assets (the body, `male_casualsuit06`, `shoes05`, `short01` hair), rigged by Patch onto the Universal Animation Library's skeleton. Its pictures are taken out here, since the demo paints him | CC0 1.0 (MakeHuman's system assets are released as CC0) | Yes, in Git LFS |
| `public/figure/starter-man-clips.glb` | Quaternius' Universal Animation Library 1 and 2 (idle, walk, jog, strafes, turns, jumps), and Patch's own clips made with anymove (run, sprint, starts, stops, the tired idle) | CC0 1.0 (Quaternius); CC0 1.0, Patch | Yes, in Git LFS |
| `src/figure/puffy.js`, `public/figure/puffy.glb` (Puffy) | The code written for this demo. The model: mesh, weights and Idle/Walk/Fly clips made by `puffy/build_puffy.py` (painted-valley); rig based on "Kirby Model Rigged" by CirclesCreate (Sketchfab), only the armature's bone names and hierarchy kept, re-placed, with ears and tail added; no mesh, texture or material of it used | Code MIT. Rig: CC BY 4.0, credit CirclesCreate | Yes |
| `src/figure/rapier/` | Rapier 0.21.0, `@dimforge/rapier3d-compat`, as vendored in patch-lab | Apache-2.0, `src/figure/rapier/LICENSE`, shipped as `RAPIER-LICENSE.txt` | Yes |
| `lib/patch-block.js` | Patch's block helper, from staging.patch.gg/patch-block.js | Patch's, shipped with every block | Yes |
| `shots/` | Stills of this demo | CC0 1.0, Patch | Yes, in Git LFS |
| three.js 0.186.1 | npm | MIT | Installed by npm; its notice ships as `THIRD-PARTY-NOTICES.md` |

No reference picture was used or stored, and there is no sound.

**Nothing here has no stated source.**
