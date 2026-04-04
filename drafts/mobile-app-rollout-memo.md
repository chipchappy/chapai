## Mobile App Rollout Memo

### Recommendation
Ship a React Native / Expo wrapper once the web study flow is steadier.

### Why
- fastest path to iOS + Android
- reuses existing TypeScript and product logic
- easier push notifications for daily questions and study streaks
- faster than building native twice

### Phase 1
- preserve current web app as source of truth
- make quiz, tutor, streaks, and daily question mobile-safe first
- define mobile-only value:
  - quick daily question
  - tutor on the go
  - saved weak topics
  - offline session cache later

### Phase 2
- Expo app shell
- auth
- question session flow
- tutor panel
- upgrade/paywall handoff

### Phase 3
- push notifications for daily question
- one-minute warmup mode
- streak reminders

### Do not do yet
- full native rebuild
- video library first
- too many mobile-only features before the core question/tutor flow is elite
