# The Duel — Full UI Redesign

**Date:** 2026-05-25
**Project:** The Duel — Sharia-Compliant Investing Battle
**Design Direction:** The Royal Court (Islamic Golden Age aesthetic)

## Overview

Complete visual overhaul of the Duel game UI. The current UI is a functional dark dashboard; the redesign transforms it into an experience rooted in Islamic Golden Age aesthetics — geometric patterns, rich jewel tones, scholarly typography, and ornate details. The "duel" is reframed as a courtly competition between two viziers managing the royal treasury.

## Color Palette

| Token | Hex | Role |
|-------|-----|------|
| `--bg` | `#0a0e1a` | Deepest background |
| `--bg-deep` | `#060910` | Body/base background |
| `--surface` | `#12182b` | Card surfaces |
| `--surface-elevated` | `#1a2240` | Hovered/active surfaces |
| `--border` | `#1e2a4a` | Subtle borders |
| `--border-light` | `#2a3a66` | Stronger borders |
| `--text` | `#e8e4da` | Body text (warm off-white) |
| `--text-muted` | `#7a8ba8` | Muted text |
| `--text-dim` | `#3d4e6e` | Dim labels |
| `--gold` | `#c8a45e` | Primary accent |
| `--gold-bright` | `#e0be72` | Highlight gold |
| `--gold-dim` | `#705a30` | Dim gold (borders) |
| `--gold-glow` | `rgba(200,164,94,0.1)` | Gold glow |
| `--turquoise` | `#4ac7b0` | Secondary accent |
| `--turquoise-dim` | `#2a7868` | Dim turquoise |
| `--emerald` | `#4ecb8d` | Positive returns |
| `--red` | `#d4605a` | Negative returns |
| `--crimson` | `#b8443a` | Alert/warning |

## Typography

- **Headings:** `'Cormorant Garamond', serif`
- **Body/UI:** `'Inter', sans-serif`
- **Data/Mono:** `'JetBrains Mono', monospace`

## Background

Subtle geometric star tessellation (girih-style) at ~2% opacity via repeating SVG pattern.

## Screen Designs

### 1. Lobby Screen

Full-screen centered decree card:
- CSS-drawn geometric star/shield emblem
- "The Duel" in Cormorant Garamond, gold gradient
- "Sharia-Compliant Investing Battle" subtitle in turquoise small caps
- Ornate gold divider with diamond motif
- Name input with gold focus ring
- Custom difficulty dropdown
- Gold "Start Duel" button with shimmer hover
- Footer: "4 Quarters • 6 Assets • Purify Your Returns"
- Animations: fade-in, emblem slow-spin, button pulse

### 2. Game Header

Three-column: player name + crown badge | Roman numeral quarter | opponent + AI badge
Full-width gold horizontal rule below.

### 3. Dashboard (Asset Cards)

2-column grid, 6 cards, each with:
- Double-border (manuscript margin style)
- Gold gradient top accent
- Type badge color-coded (sukuk=turquoise, equity=gold, commodity=emerald, realestate=crimson)
- Price with ▲/▼ indicator
- 120px mini charts (up from 80px) with quarter markers
- Hover lift + gold glow
- Event timeline as horizontal seal badges below grid

### 4. Command Panel

**Portfolio Meter:** Large gold capital, 2x2 stat grid with ornamental borders, gradient allocation bar with diamond marker

**Countdown:** Gold fill bar, pulse under 10s, color transitions at 15s/5s

**Allocator:** 7 rows (6 assets + cash), custom gold sliders with diamond thumb, "Remaining" display, contextual submit button, 3 preset pills (Equal/Low Impurity/High Return)

**Impurity Warning:** Crimson glow at >3%, alert banner at >5%

### 5. Recap Screen

Overlay with three sections: Events (wax-seal icons), Asset Performance (3x2 grid), Player Positions (side-by-side with VS emblem)

### 6. Results Screen

Winner banner with crown animation, two side-by-side cards (winner gold-bordered), "Play Again" button

### 7. Onboarding

Same 3-step structure, restyled to match new theme

### 8. Spectator Mode

Restyled with new palette

## Animations

- Screen transitions: fade + drift (0.5s)
- Price flash: gold/crimson on change
- Capital count-up
- Slider thumb scale 1.2x on hover
- Button shimmer + press scale
- Loading: rotating geometric star
- Countdown pulse acceleration
- New sound chime on allocation submit

## Files to Modify

- `src/styles/main.css` — Complete rewrite
- `src/ui/lobby.js` — Updated markup
- `src/ui/dashboard.js` — Updated card structure
- `src/ui/allocator.js` — Slider + preset updates
- `src/ui/portfolio-meter.js` — Stat box layout
- `src/ui/recap.js` — Styled markup
- `src/ui/results.js` — Winner styling
- `src/ui/onboarding.js` — Restyled
- `src/ui/spectator.js` — Restyled
- `src/ui/event-card.js` — Updated styling
- `src/lib/sound.js` — Add allocation chime
- `index.html` — Update font imports

## What's NOT Changing

Game logic, data layer, math utilities, chart canvas rendering, API layer, sound architecture, package deps, build config
