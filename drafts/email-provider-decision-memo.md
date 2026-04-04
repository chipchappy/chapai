# Email Provider Decision Memo

## Goal
Pick the smallest reliable provider for daily-question sends without overbuilding.

## Requirements
- simple API
- easy from-address setup
- low monthly cost at low volume
- clear deliverability basics
- easy PowerShell / HTTP integration

## Decision rule
- choose the provider with the shortest path to first send
- do not optimize for scale before the first real pilot
- keep vendor logic isolated so Beacon can swap later

## Recommendation
- start with a low-friction transactional provider
- send one small pilot batch first
- confirm deliverability and click behavior
- only then build deeper automation
