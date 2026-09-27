# Box2D runtime improvements — 2026-09-28

- Keep the existing Box2D engine, map geometry, marble size, random density, skill force, artwork and UI text.
- Draw marbles and rotating obstacles at the same interpolated physics time.
- Keep 60 Hz fixed steps; replace modulo time loss with bounded catch-up (250 ms backlog, at most 12 steps per frame). Under sustained overload, real speed can still be below the selected speed.
- Release JS-owned temporary WASM definitions/shapes; reuse skill vectors and the module initialization. Never free borrowed native positions.
- Clear pending temporary-pin removal, old round state, skill effects and slow motion on reset.
- Render minimap circles directly without per-marble transform copies.
- Reset engine/UI speed to 1x when the start button begins a new round.

## Verification

Node.js 24:

```sh
pnpm install --frozen-lockfile
node --import ./scripts/register-typescript.mjs --test tests/*.test.mjs
pnpm exec tsc --noEmit --incremental false
pnpm build
```

The 27 regression tests cover four maps with skills, rotating-bar contact/interpolation, reset and native object ownership, fixed-step timing at 1/2/5x, 3,000 minimap circles, round state and the real start-button callback.

This is not a Rapier migration or a guarantee of 3,000-marble/5x FPS. Rare dense-contact penetration inherited from the original engine remains outside this change.
