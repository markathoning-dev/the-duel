# The Duel UI Redesign — Implementation Plan

> **For agentic workers:** Steps use checkbox syntax for tracking.

**Goal:** Full UI redesign of The Duel game — Royal Court aesthetic

**Architecture:** Replace all UI markup in `src/ui/*.js` and all styles in `src/styles/main.css`. Game logic, data, and chart rendering unchanged.

**Tech Stack:** Vanilla JS + Vite, CSS custom properties, canvas charts

---

### Task 1: Foundation — CSS palette, typography, background

**Files:**
- Modify: `src/styles/main.css`

- [ ] Rewrite CSS variables with new Royal Court palette
- [ ] Update body background with geometric pattern
- [ ] Set typography stack for all element types
- [ ] Define base screen transitions
- [ ] Define shared button styles, form styles

### Task 2: Font imports in index.html

**Files:**
- Modify: `index.html`

- [ ] Replace font imports: Cormorant Garamond + Inter + JetBrains Mono

### Task 3: Lobby screen redesign

**Files:**
- Modify: `src/ui/lobby.js`
- Modify: `src/styles/main.css` (lobby section)

- [ ] Add geometric emblem above title
- [ ] Update markup with new class names
- [ ] Style decree card with double-border
- [ ] Add footer text

### Task 4: Game header redesign

**Files:**
- Modify: `src/styles/main.css` (game header section)
- Modify: `src/ui/dashboard.js` or modify renderTurn in main.js

- [ ] Three-column header: player | Roman numeral quarter | opponent
- [ ] Gold horizontal rule
- [ ] Crown badge for player, AI chip for opponent

### Task 5: Asset cards + dashboard

**Files:**
- Modify: `src/ui/dashboard.js`

- [ ] New card markup with double-border
- [ ] Color-coded type badges
- [ ] Price with ▲/▼ indicator
- [ ] Hover effects
- [ ] Event timeline as seal badges

### Task 6: Portfolio meter + countdown

**Files:**
- Modify: `src/ui/portfolio-meter.js`
- Modify: `src/styles/main.css` (meter, countdown sections)

- [ ] Ornamental stat boxes
- [ ] Gradient allocation bar with diamond marker
- [ ] Countdown pulse animation
- [ ] Impurity warning glow

### Task 7: Allocator redesign

**Files:**
- Modify: `src/ui/allocator.js`
- Modify: `src/styles/main.css` (allocator section)

- [ ] Custom gold sliders with diamond thumb
- [ ] Preset pills (Equal/Low Impurity/High Return)
- [ ] Contextual submit button
- [ ] "Remaining" display

### Task 8: Recap screen redesign

**Files:**
- Modify: `src/ui/recap.js`
- Modify: `src/styles/main.css` (recap section)

- [ ] Roman numeral header
- [ ] Wax-seal event icons
- [ ] VS emblem between players
- [ ] Ornate gold dividers

### Task 9: Results screen redesign

**Files:**
- Modify: `src/ui/results.js`
- Modify: `src/styles/main.css` (results section)

- [ ] Winner banner with crown animation
- [ ] Golden border on winner card
- [ ] Shine animation

### Task 10: Onboarding + spectator restyle

**Files:**
- Modify: `src/ui/onboarding.js`
- Modify: `src/ui/spectator.js`
- Modify: `src/ui/event-card.js`
- Modify: `src/styles/main.css` (onboarding, spectator sections)

- [ ] Restyle onboarding to match theme
- [ ] Restyle spectator mode
- [ ] Restyle event cards

### Task 11: Sound chime

**Files:**
- Modify: `src/lib/sound.js`

- [ ] Add `playChime()` for allocation submit

### Task 12: Verify build

- [ ] Run `npm run build`
- [ ] Confirm no errors
