# Scene Asset System

## Current Format

All first-phase scene art is original, programmatic SVG and CSS. There are no external image downloads, generated faces, proprietary device screenshots, vendor logos, or runtime asset requests. Initial external scene-asset payload is therefore zero bytes.

`scene-assets.ts` is the typed manifest. Each definition records:

- asset ID and category;
- body region;
- compatible patient bases, positions, and devices;
- layer order;
- anchors and mask;
- transform origin;
- required and excluded states;
- accessibility description;
- source, creator, license, and version.

`getActiveSceneAssetIds` resolves the manifest IDs for the current visual state. `findMissingSceneAssets` is surfaced in the protected inspector.

## Layer Order

1. Room shell and lighting
2. Bed and environmental shadows
3. Patient base and clothing
4. Skin findings and movement layers
5. Tubing and device bodies
6. Focus and emergency overlays
7. HTML interaction targets and focused assessment panel

Layer order is clinical: tubing may cross a visible limb, but it must not cover the airway, assessment target, or critical monitor text.

## Adding A Patient Variant

1. Add only profile attributes that have a real visual purpose.
2. Keep disease and outcome independent from skin tone, body size, hair, age, and identity.
3. Use existing anchors and silhouette proportions where possible.
4. Add the variant to the profile union and manifest compatibility list.
5. Test every supported position, oxygen interface, skin overlay, and mobile crop.
6. Obtain clinical and respectful-representation review before release.

## Adding A Room Preset

Add a typed room ID, a `RoomScene` layer, a manifest record, and deterministic screenshot coverage. A room must differ through clinically relevant density and equipment, not decorative recoloring. Preserve safe behavioral-health design and avoid stigmatizing imagery.

## Quality Checklist

- Anatomical and placement plausibility
- Correct device silhouette, connection, side, and level
- Consistent perspective, lighting, line treatment, and scale
- Tone-aware skin findings
- Dignity and minimal exposure
- No embedded device text that should be live data
- Keyboard, screen-reader, contrast, and reduced-motion behavior
- Stable desktop, tablet, and mobile crops
- Original or documented licensed source
- Editable source and manifest version available

The current vector foundation still requires a formal nurse/device-art review before student release.
