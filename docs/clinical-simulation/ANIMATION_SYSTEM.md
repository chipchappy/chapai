# Patient Scene Animation System

## Inputs

Animation parameters are derived from persisted patient state, not randomized idle behavior:

- respiratory rate controls breath duration;
- respiratory pattern controls timing curve;
- depth and work of breathing control amplitude;
- LOC controls eye opening, blink interval, tracking, and purposeful movement;
- behavior controls restrained restlessness, guarding, shivering, or seizure motion;
- device state controls flow dashes and alarm emphasis;
- virtual events control abrupt or delayed state transitions.

The deterministic seed selects appearance only. It never randomizes physiology.

## Rendering Channels

- CSS transforms animate chest, accessory muscles, eyes, head, movement, moisture, and tubing flow.
- Canvas renders high-frequency monitor waveforms independently.
- SVG and React update only when event-driven visual state changes.
- No WebGL or full 3D runtime is used.

## Respiratory Patterns

Quiet, tachypneic, bradypneic, shallow, deep, Kussmaul-type, irregular, agonal, apnea, and assisted patterns have separate timing or amplitude rules. Exhaustion lowers amplitude despite ongoing distress. Apnea removes spontaneous chest animation unless assisted ventilation is represented.

## Transition Rules

CSS transitions smooth camera and nonurgent visual changes. Clinical state timing remains owned by the engine: delayed medication effects, worsening over virtual minutes, and improvement after reassessment are applied by scheduled engine effects. The visual layer does not add arbitrary treatment delays.

Abrupt engine events such as collapse may change immediately. Progressive engine changes produce progressive overlays as severity values change.

## Reduced Motion And Visibility

Reduced motion removes restlessness, blink, shimmer, cable flow, and camera transitions. A slow, low-amplitude respiratory cycle remains unless the state is apnea. Hidden tabs pause animation frames, including reduced breathing. Critical information remains in text and device state.

## Performance

The protected panel samples FPS, average frame interval, optional Chromium JS heap, SVG node count, quality mode, and external asset bytes. Pause animation when hidden, avoid per-frame React state, keep monitor updates in Canvas, and memoize visual selectors and geometry.
