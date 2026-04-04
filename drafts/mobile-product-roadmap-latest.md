# Mobile product roadmap

Generated: 2026-04-04T09:30:39.3666900-07:00
Recommendation: Expo + React Native + Expo Router

## Core principle
- Ship one shared product brain with the fewest platform-specific branches.

## Phases
### phase-1: Mobile shell and practice flow
- Expo app shell
- shared question session fetch
- saved progress basics
- offline question cache

### phase-2: Tutor, streaks, and daily question notifications
- AI tutor panel
- daily question push/email bridge
- streak loop
- review mistakes view

### phase-3: Subscription and polish
- RevenueCat evaluation
- deep links
- offline review packs
- analytics and retention loops

## Shared packages
- shared question types
- shared rationale and visual rationale model
- shared tutor prompts
- shared growth telemetry hooks

## Risks
- Do not fork business logic between web and mobile.
- Do not start native billing until the subscription path is cleaner.
- Keep notifications and email loops using the same daily-question source.

## Next action
- Create one Expo-first memo and keep the mobile path scoped to practice, tutor, and retention.
