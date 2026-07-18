# Device Rendering

## Device Contract

Devices render from `PatientState` through `deriveVisualDevices`. The renderer does not infer a device merely because it would be clinically convenient.

- Oxygen uses the current device and flow.
- ECG leads require a monitored unit or explicit chart/device evidence.
- Arterial monitoring requires connected or transduced state; bedside setup alone is not active.
- Pumps derive from completed fluid, antibiotic, and vasopressor actions plus current rates.
- Urinary and drain systems derive from engine device entries and current output.
- Defibrillation pads require their applied state; an available defibrillator is separate.
- Mechanical ventilation requires a matching artificial airway and circuit.

## Anchors And Tubing

Patient anchors are derived in `scene-geometry.ts`. Equipment anchors are stable in the `1200 x 680` scene. Tubing uses cubic paths and is recalculated when position changes.

ECG wiring uses one monitor trunk and short patient-side branches to avoid duplicated cables. Oxygen, IV, arterial, urinary, drain, defibrillator, and suction paths have distinct colors, widths, and labels for diagnostics. All paths must remain finite and connected after bed-angle or position changes.

## Implemented Device Foundation

- Nasal cannula, HFNC, simple, Venturi, non-rebreather, CPAP/BiPAP, bag-mask, tracheostomy collar, T-piece, ETT/ventilator
- Bedside monitor and procedural waveforms
- ECG electrodes and trunk cable
- Peripheral and central IV representations
- IV pole and up to three pump channels
- Urinary catheter/urometer with bounded fill and tone
- JP/surgical drain and pleural drain foundation
- Defibrillator monitor and pad placements
- BP cuff and pulse-oximeter indicators

Full operational workflows are not implied by a rendered device. Ventilator programming, defibrillation, chest-tube troubleshooting, and advanced pump programming remain partial until corresponding engine actions and reviewed scenario content exist.

## Adding A Device

1. Add an authoritative state field or device entry.
2. Normalize compatibility and display state in `VisualDeviceState`.
3. Add manifest metadata and required anchors.
4. Add tubing only when a physical connection is clinically present.
5. Add contradiction assertions for invalid combinations.
6. Add a visible focus target and a list-based alternative when interactive.
7. Test initial, applied, disconnected, alarm, corrected, persisted, and responsive states.

Never copy a proprietary interface, logo, alarm sound, or screen layout.
