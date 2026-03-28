# Flow-First Team Portal Design (Luxury/Refined)

Date: 2026-03-28  
Product: erem Studio  
Audience: Small team (editor + reviewer + owner)  
Primary objective: Speed of publishing  
Working mode: Dashboard + Detail  
Signature feature: Review Room

## 1. Goals

- Shorten time from transcript input to publish-ready package.
- Keep quality gates visible but lightweight.
- Make team collaboration obvious (owner/editor/reviewer responsibilities).
- Reduce cognitive load by showing one primary action per step.

## 2. Non-Goals

- Full rebuild of backend architecture.
- Replacing existing generation engines.
- Multi-workspace enterprise administration in v1.

## 3. Information Architecture

Primary surfaces:

1. Dashboard
2. Video Detail
3. Review Room

Secondary/system surfaces:

- Settings
- Tools registry

### 3.1 Dashboard

- Left rail: Projects + quick open/create.
- Center: Pipeline status view (Draft -> Titles -> Descriptions -> Clips -> Review -> Approved -> Scheduled).
- Right: Team queue + blocked items.

### 3.2 Video Detail

- Top: 6-step progress navigation.
- Main: active work canvas for current step.
- Right sticky rail: readiness checklist + primary CTA.

### 3.3 Review Room

- Side-by-side variant compare (title/description/clips).
- Timestamp review lane with approve/reject.
- Fixed decision actions: Approve, Request Changes, Approve & Queue.

## 4. Content Type Selector (Podcast vs Video)

A required selector in Core:

- `contentType = podcast | video`

This selector controls:

- Prompt context.
- Timestamp quality rules.
- Review criteria.
- Export payload defaults.

## 5. Timestamp-First UX

Timestamps become a first-class workflow object.

### 5.1 Core additions

- Timeline editor as primary input area.
- Timestamp quality score card.
- Auto-fix button.

### 5.2 Quality signals

- Format validity (`00:00 Name`).
- Coverage and segment balance.
- Presence of intro marker (`00:00`).
- Content-type-specific heuristics:
  - Podcast: longer thematic blocks.
  - Video: shorter retention-friendly cuts.

### 5.3 Publish gate

Publish is blocked when:

- Timestamps not approved.
- Timestamp score below threshold.

## 6. UX Rules

- One primary action visible per active step.
- Advanced operations collapsed under explicit "Advanced" disclosure.
- System-level tabs (Settings/Tools) visually separated from production flow.
- Every tab switch shows contextual “what to do now” hint.
- Mobile quick action cycles through flow steps only (Core -> Publish).

## 7. Data Model Changes

Project state additions:

- `contentType: "podcast" | "video"`
- `timelineQuality: { score, errors[], warnings[], coveragePct, avgSegmentSec }`
- `timelineApproved: boolean`
- `timelineVersions: Array<{ id, ts, timeline, actor, note }>`

Settings additions:

- `timelineRules: { minSegments, maxSegmentSec, requireIntroAtZero, strictFormat }`

## 8. Functional Changes

New functions:

- `analyzeTimelineQuality(timeline, contentType)`
- `autoFixTimeline(timeline, contentType)`
- `approveTimelineVersion(versionId, actor)`

Updated functions:

- `canPublishNow()` includes timestamp approval + score threshold.
- Prompt builders include `contentType` and timeline quality context.
- Export payload includes timestamp approval metadata.

## 9. API and Contract Updates

Generation contracts include:

- `content_type`
- `timeline_quality`

Export payload fields:

- `contentType`
- `timestampsApproved`
- `timestampScore`

## 10. Rollout Plan

Phase 1:

- Data model + Core UI selector + timeline quality analyzer.

Phase 2:

- Auto-fix + timeline versioning + Review Room timestamp approval.

Phase 3:

- Publish gate + contract updates + export metadata.

Phase 4:

- UX polish + regression tests + deployment.

## 11. Success Metrics

- Lower median time from Core completion to publish package ready.
- Fewer failed publishes due to missing timeline quality.
- Higher first-pass review approval rate.
- Lower frequency of runtime validation errors in generation outputs.

## 12. Risks and Mitigations

- Risk: More strict gates can feel slower.
  - Mitigation: Auto-fix and clear inline guidance.
- Risk: Existing users may resist new flow.
  - Mitigation: Keep advanced actions available and backward-compatible.
- Risk: LLM output variability.
  - Mitigation: Runtime schema validation + fallback payloads + explicit retry actions.
