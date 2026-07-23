# Clinical Simulation — bedside patient photos

The photoreal scene (`PatientPhotoScene.tsx`) composites its live reactive layer
(breathing, cyanosis/mottling/diaphoresis overlays, monitor, clickable regions)
over a base bedside photograph. Drop the images here with these EXACT names:

| Filename                         | Shot                                                        |
| -------------------------------- | ----------------------------------------------------------- |
| `adult-female-icu-side.jpg`      | **Side view, semi-Fowler's** — head at LEFT, feet at RIGHT. This is the one the scene renders. |
| `adult-female-icu-front.jpg`     | Front view (kept for future front-facing scenarios).        |

Guidelines for the base image:
- Landscape, ideally ~1456×1080 (4:3-ish). If the aspect differs, update `aspect`
  in `PatientPhotoScene.tsx` to `width / height`.
- Neutral/baseline appearance (calm, pink skin). All abnormal findings —
  cyanosis, mottling, diaphoresis, pallor — are added as live overlays driven by
  the engine, so the base image should be the healthy-looking starting point.
- Plain, uncluttered background reads best behind the overlaid monitor and panels.

Anchor percentages (face / lips / chest / hand / legs / feet / monitor) are set in
`PatientPhotoScene.tsx` for the supplied side-view image. If a replacement image
has different framing, nudge those numbers so the overlays land on the right
anatomy — each is an `{ x, y }` percentage of the image.

Not committed with real patient photos in this README's directory by default;
add your licensed/generated assets locally, then deploy.
