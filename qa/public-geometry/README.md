# Public geometry QA (standalone)

This folder is a **self-contained, public, generic 3D geometry demonstration**.
It is intentionally not a copy of any private game's rig, head shape,
behavior, scene data, research, assets or physical simulation.

It demonstrates finite-coordinate validation, fixed-link length checks,
coarse triangle sample checks against simple boxes and a flat ground level,
optional discrete halfway-frame sampling, and 2D bend-onset inspection.

Run with Node.js 22 or later:

```bash
node --test qa/public-geometry/geometry.test.mjs
```

Limitations: Passing these tests **does not test or certify private code**, a
specific animal species, muscle motion, whole-surface collision, friction,
continuous swept-volume collision, or a real gameplay scene. No external
services or project secrets are needed. Nothing here is packaged into the
live game or GitHub Pages.
