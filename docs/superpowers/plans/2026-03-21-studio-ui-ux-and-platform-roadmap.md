# Studio UI/UX and Platform Roadmap Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dodat prioritizovanou roadmapu a průběžně doručit klíčové UI/UX a platform funkce tak, aby appka byla škálovatelná pro nové nástroje a produkční provoz.

**Architecture:** Postup po vlnách: P0 (UX stabilita + základní guardrails), P1 (produktové workflow + collaboration), P2 (power-user + accessibility), Platform (backend, persistence, observability). Každá vlna má měřitelné výstupy a je navázaná na existující tab-based SPA architekturu (`index.html` + `app.js` + `api/openai.php`).

**Tech Stack:** Vanilla JS SPA, PHP API endpoint, localStorage (aktuálně), GitHub + Hetzner deploy.

---

## Chunk 1: P0 UX Core (1-2 týdny)

### Task 1: Onboarding flow (first-run)
**Files:**
- Modify: `index.html`
- Modify: `app.js` (jen validační helpery)

- [ ] 3-krokový onboarding modal: URL -> timeline -> první výstup.
- [ ] Persist `onboarding_done` flag v localStorage.
- [ ] CTA z onboardingu přímo spustí první generování (titles).

### Task 2: Unified loading/progress states
**Files:**
- Modify: `index.html`

- [ ] Přidat globální progress panel (text + progress bar).
- [ ] Napojit na všechny LLM flow (`genTitles`, `genDescs`, `runRetention`, `mineClips`).
- [ ] Rozlišit kroky: validace, volání LLM, render/persist, finish/fallback.

### Task 3: Inline validation
**Files:**
- Modify: `app.js`
- Modify: `index.html`

- [ ] URL validace (YouTube pattern) s inline error hláškou.
- [ ] Timeline validace (timestamp + název) s číslem chybného řádku.
- [ ] Prompt field hinty (prázdné = default prompt, krátký prompt = warning).

## Chunk 2: P1 Product Workflow (2-4 týdny)

### Task 4: Settings IA refactor
**Files:**
- Modify: `index.html`

- [ ] Levé submenu v `Nastavení` (Prompty, Skills, Algoritmy, Channel, Presety, Optimizer).
- [ ] Sticky subnav + deep-link hash (`#settings/prompts`).

### Task 5: Generation history + rollback
**Files:**
- Modify: `app.js`
- Modify: `index.html`

- [ ] Ukládání verzí titles/descriptions/clips s timestampem.
- [ ] UI historie + tlačítko "Obnovit verzi".

### Task 6: A/B board
**Files:**
- Modify: `index.html`
- Modify: `app.js`

- [ ] Side-by-side board pro title/desc/thumb varianty.
- [ ] Výběr favorita + export shortlistu.

### Task 7: One-click publish package
**Files:**
- Modify: `index.html`
- Modify: `app.js`

- [ ] Tlačítko "Publish balíček" => titles + desc + clips + thumb notes.
- [ ] Konsolidovaný JSON payload a preview.

## Chunk 3: P1/P2 Platform Features (4-8 týdnů)

### Task 8: A/B planner + results import
- [ ] Datový model experimentu (varianty, publish windows, metriky).
- [ ] Import CSV/JSON výsledků a winner recommendation.

### Task 9: Analytics integration (YouTube)
- [ ] OAuth + secure token store server-side.
- [ ] Pull CTR/retention + mapping na varianty.

### Task 10: Prompt auto-rewrite per channel profile
- [ ] Profil kanálu (tone, avg CTR, top topics).
- [ ] Adaptivní prompt strategy podle skutečných výkonů.

### Task 11: Team approval workflow
- [ ] Stavy `draft -> review -> approved`.
- [ ] Role actions + audit trail.

### Task 12: Prompt/skill marketplace
- [ ] Katalog šablon promptů a skill packů.
- [ ] Import/export + rating.

### Task 13: Scheduler + publish queue
- [ ] Job queue model + retry state.
- [ ] UI fronta publikace + ruční override.

### Task 14: Clip pipeline
- [ ] Hook -> script -> caption -> hashtags pipeline.
- [ ] Batch generation + edit mode.

### Task 15: Audit log
- [ ] Log entit (kdo/co/kdy), diffs a filtrování.

## Chunk 4: Technical Debt Closure (průběžně)

### Task 16: Trend feed reliability
- [ ] Přesun trend fetch na backend proxy (eliminace CORS/reliability issue).

### Task 17: Runtime schema enforcement for tool contracts
- [ ] Validate input/output proti contract schema před/po execution.

### Task 18: Centralized error boundary
- [ ] Jednotný error panel + error codes + retry actions.

### Task 19: Server-side persistence
- [ ] Projektová data na serveru (DB/API), localStorage jen cache.

### Task 20: Critical flow test suite
- [ ] Testy pro titles/desc/growth/settings import-export.

## Milestones
- M1 (P0 complete): onboarding + progress + inline validation live.
- M2 (P1 core): settings IA + history + A/B board + one-click package.
- M3 (Platform): analytics + scheduling + team workflow + server persistence.

## KPIs
- Time-to-first-output < 2 min.
- Failed runs visible with actionable message 100% cases.
- Fallback rate postupně < 15%.
- Reuse rate prompt presets/history > 40%.
