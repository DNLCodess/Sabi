# 08 — SABI DESIGN SYSTEM (Refined v2 — Build-Ready, Mobile-First)
> Stack: Next.js + Tailwind + shadcn/ui + lucide-react. Targets in priority order: **mobile (360–430px) → tablet (768–1024px) → desktop (enhancement)**. This file refines the original design doc; where they differ, this file wins.

## WHAT CHANGED FROM v1 (and why)
1. **Type scale is now mobile-first & fluid** (`clamp`). The original 72px H1 is kept only as the desktop *ceiling*, not the mobile size.
2. **Contrast guardrails added.** SABI Purple `#7C6FFF` and the gradients **fail WCAG AA for body text** — they're now restricted to accents, large text, and icons. Body copy uses `--text-primary`.
3. **"Chat" redefined.** Ayo is a **guided conversational screener with tappable answer chips**, NOT a free-text AI chat. (Safety + scope: we ruled out a generative therapy chat.)
4. **Scope-aligned.** Journaling, community, meditation library, mood-over-time, and free chat are **out of scope** (per specs 06/07). The visual language stays; those screens are not built.
5. **Crisis state recoloured** to be clear-but-calm, not alarm-red.

---

## 1. COLOR TOKENS (CSS variables)
Keep the brand hexes; the roles + rules below make them accessible.
```css
:root {
  /* Brand */
  --primary:#7C6FFF;        /* SABI purple — accents, large text, icons. NOT body text */
  --primary-hover:#6A5CF0;
  --primary-subtle:#EFEDFF; /* tints, selected states */
  --secondary:#5B8DEF;      /* trust blue */
  --accent:#3FB8AC;         /* wellness teal — slightly deepened from #4FD1C5 for contrast */
  --accent-soft:#4FD1C5;    /* original teal for fills/gradients only */
  /* Soft secondaries */
  --lavender:#B8A6FF; --sky:#D8E8FF; --mint:#DFFBF8;
  /* Neutrals */
  --background:#FAFBFF; --surface:#FFFFFF; --surface-raised:#FFFFFF;
  --border:#E8ECF5; --border-subtle:#F0F3FA;
  --text-primary:#1F2937; --text-secondary:#6B7280; --text-disabled:#9CA3AF;
  /* State (each has a readable foreground) */
  --success:#1E9E8A; --success-fg:#FFFFFF;
  --warning:#B7791F; --warning-fg:#FFFFFF;   /* concern; on tints use this deeper amber for text */
  --warning-soft:#FBBF24;
  --crisis:#D9534F; --crisis-fg:#FFFFFF;     /* softened red — CRISIS PATHWAY ONLY, used sparingly */
  --info:#5B8DEF; --info-fg:#FFFFFF;
  /* Focus ring */
  --ring:rgba(124,111,255,0.45);
}
.dark {
  --background:#0D1025; --surface:#161B38; --surface-raised:#1C2244;
  --border:#2A3160; --text-primary:#F8FAFC; --text-secondary:#AAB2D5;
  --primary:#9A90FF;        /* desaturated/lifted for dark mode */
  --accent:#4FD1C5;
}
```
**Gradients** (accents/hero only, never behind body text):
```css
--grad-primary: linear-gradient(135deg,#4FD1C5 0%,#5B8DEF 50%,#7C6FFF 100%); /* logo gradient */
--grad-dream:   linear-gradient(135deg,#A7C7FF 0%,#B8A6FF 50%,#F1E8FF 100%);
--grad-aurora:  linear-gradient(135deg,#4FD1C5 0%,#7C6FFF 100%);
```
**Color rules**
- Body/paragraph text: **always `--text-primary`** on light, `--text-primary` (light) on dark. Never purple, never on a gradient.
- Purple/gradient: large headings (≥24px), the primary CTA, icons, the Ayo avatar glow, decorative accents.
- One accent max per view. `--crisis` appears **only** on the crisis pathway — never as a general accent.
- Verify CTA text: white on the gradient is fine only at ≥16px / 600 weight (large-text AA). Keep button text large.

---

## 2. TYPOGRAPHY (mobile-first, fluid)
Fonts: **Poppins** (display/headings, used with restraint) + **Inter** (body, UI). Load both. (Optional more-distinctive display alternative: **Sora** — geometric, less common than Poppins. Keep Poppins unless you want extra distinctiveness.)
```css
--font-display:'Poppins',sans-serif;  /* weights 600,700 only */
--font-body:'Inter',sans-serif;       /* weights 400,500,600 */
```
Fluid scale — small screen first, desktop is the ceiling:
| Token | clamp() | Mobile → Desktop | Use |
|---|---|---|---|
| Display | `clamp(2rem, 6vw + 1rem, 4.5rem)` | 32 → 72 | hero headline only |
| H1 | `clamp(1.75rem, 4.5vw + 0.5rem, 3rem)` | 28 → 48 | page titles |
| H2 | `clamp(1.5rem, 3.5vw + 0.5rem, 2.25rem)` | 24 → 36 | section heads |
| H3 | `clamp(1.25rem, 2vw + 0.5rem, 1.75rem)` | 20 → 28 | card titles |
| Body-lg | `1.125rem` (18) | — | intros, Ayo messages |
| Body | `1rem` (16) | — | default; line-height 1.6; max-width 65ch |
| Small | `0.875rem` (14) | — | helper text |
| Caption | `0.75rem` (12) | — | labels; letter-spacing +0.04em; weight 600; uppercase optional |
- Display/H1/H2: line-height 1.1–1.2, letter-spacing −0.02em, weight 700.
- Body min 16px everywhere (prevents mobile zoom). Weight pair 400 + 600; 700 for rare emphasis.

---

## 3. SPACING, RADIUS, ELEVATION
**4px grid** — never use off-grid values.
```css
--space-1:4px; --space-2:8px; --space-3:12px; --space-4:16px;
--space-6:24px; --space-8:32px; --space-12:48px; --space-16:64px; --space-24:96px;
```
- Related elements 4–8px apart; sibling sections 24–48px; mobile screen padding 16–20px; tablet 24–32px.
- Card padding: 20–24px. Inline icon+text gap: 8px.

**Radius**
```css
--r-sm:8px; --r-md:14px;  /* inputs */ --r-lg:16px; /* buttons */ --r-xl:24px; /* cards */ --r-full:999px;
```
**Elevation** (use sparingly — 0 flat, 1 card, 2 popover, 3 modal)
```css
--shadow-1:0 8px 40px rgba(124,111,255,0.12);  /* floating card */
--shadow-2:0 4px 16px rgba(31,41,55,0.10);
--shadow-3:0 24px 60px rgba(31,41,55,0.18);
```

---

## 4. RESPONSIVE RULES (mobile/tablet primary)
Breakpoints (content-driven; Tailwind defaults): `sm 640 · md 768 · lg 1024 · xl 1280`. Design base = mobile; enhance up.
| Screen | Layout | Container | Nav |
|---|---|---|---|
| Mobile <768 | single column, full-width cards, sticky bottom CTA | 100% − 32px padding | minimal top bar: logo + back; no menu clutter |
| Tablet 768–1023 | 2-column where it helps (domain cards), wider cards | max 720px centered | condensed top bar |
| Desktop ≥1024 | centered reading column for flow screens; admin dashboard can use a sidebar | max 1120px centered | simple top bar (admin only) |
**Rules:** reach for `clamp()`/`%`/`fr` before breakpoints. Touch targets **≥44px (48 comfortable)**, ≥8px apart. Guard hover with `@media (hover:hover)`. No horizontal scroll at 320px. Answer chips and primary CTA are full-width, min-height 48px on mobile. The screening flow is **linear** — keep the screen focused on one question; don't add navigation chrome.

---

## 5. ICONOGRAPHY (proper icons — NO emojis, anywhere)
- **One library: `lucide-react`.** No emojis in UI or copy (emojis read as unserious for a mental-health tool and break the premium feel). Sizes 16/20/24 only; stroke 1.75. Default color `--text-secondary`; `--primary` for interactive/emphasis. Icon-only buttons need 44px tap area + an `aria-label`. Pair with a text label unless universally obvious (back, close).
Curated set (use these, don't improvise):
| Meaning | Icon |
|---|---|
| Privacy / anonymous | `ShieldCheck`, `Lock` |
| Support / reach out | `HeartHandshake` |
| Ayo / AI guide | `Sparkles` (avatar glow); `MessageCircle` (conversation) |
| Stress | `Activity` |
| Anxiety | `Wind` |
| Burnout | `BatteryLow` |
| Low mood / distress | `CloudRain` |
| Breathing exercise | `Wind` |
| Sleep | `MoonStar` |
| Booking / handoff | `CalendarCheck` |
| Helpline | `PhoneCall` |
| Crisis | `LifeBuoy` |
| Concern flag | `AlertCircle` (in `--warning`) |
| Progress / done | `Check`, `CheckCircle2` |
| Navigation | `ArrowLeft`, `ChevronRight`, `X` |

---

## 6. MOTION (calm, purposeful)
Calm brand → restrained motion. Durations ≤300ms; **ease-out** entering, **ease-in** leaving; animate **only `opacity` + `transform`**. `prefers-reduced-motion: reduce` is mandatory (global rule).
| Element | Animation | Duration |
|---|---|---|
| Ayo message appears | fade + translateY(8px→0) | 250ms ease-out |
| Answer chip press | scale(0.97) → 1 | 80 / 150ms |
| Question advance | outgoing fade-up, incoming fade-in | 200ms |
| Card hover (desktop) | translateY(−2px) + shadow | 200ms |
| Result reveal | gentle fade + 1 small stagger (≤40ms) | 250ms |
| Hero glow (Ayo) | very slow ambient pulse, optional | 3s loop, reduced-motion off |
No spring bounce on serious states. No looping animation on results.

---

## 7. VOICE & COPY (premium, Nigerian-student, non-clinical)
Tagline (formal, from logo): **"AI care. Human understanding."** · Landing hook (warm, Pidgin): **"You no need explain. We sabi."** Use the hook on the landing emotional moment; the tagline for about/footer/logo lock-up.
Rules: sentence case; plain warm verbs; light Pidgin only where natural (don't force it); never clinical labels ("you have depression"); never diagnose; no emojis; active voice; same action name through a flow ("Start a check-in" → "Check-in"). Errors give direction, not apology. Each line does one job.
Examples:
- Landing CTA: **"Start a check-in"** (not "Begin assessment").
- Privacy chip: **"Anonymous · No name · Nothing saved"**.
- Domain picker title: **"What dey weigh you down?"** options: Stress · Anxiety · Burnout · Low mood · "Not sure — check everything".
- Ayo intro: **"Let's check in. No right answers — just be honest. This stays between us."**
- Result (tier 2): **"What you shared points to a real strain. Talking to someone could help — and it's free and private."**
- ❌ "Invalid emotional state detected." → ✅ "Looks like today's been heavy. Want to talk about it?"

---

## 8. IN-SCOPE SCREENS (build only these)
1. **Landing** — hero with Ayo glow + Display headline + hook + tagline + privacy chip + one primary CTA ("Start a check-in") + a quiet 3-icon trust strip (ShieldCheck "Anonymous", HeartHandshake "Routes to real help", Sparkles "Validated tools"). Mobile: single column, CTA sticky at bottom.
2. **Domain picker** — "What dey weigh you down?" → 4 tappable cards (icon + plain label + 1-line description) + "Not sure — check everything". 1 col mobile / 2 col tablet+.
3. **Conversational screening (Ayo)** — white Ayo bubble (left) with small gradient avatar, one plain-gloss question at a time, **tappable answer chips** (Not at all · Small days · Pass half the days · Almost every day — full width), a thin top progress bar, back arrow. **No text input.** Auto-advance on tap with a 200ms transition.
4. **Results** — Ayo's templated message header → calm band summary (band word foremost, number secondary; soft ring, not alarming) → **"Why you're seeing this"** listing the fired rules in plain English (the explainable-AI moment) → barrier-aware panel (4 lines w/ icons: Lock, HeartHandshake, CalendarCheck, MessageCircle) → matched micro-intervention card → resources → **"Reach out anonymously"** (warm-handoff) button.
5. **Crisis state (tier 4 / safety item)** — calm-but-clear: a single `--crisis` accent bar + `LifeBuoy`, support-first copy ("You don't have to handle this alone"), helpline + counsellor prominent, warm-handoff prioritised. Never full-red alarm.
6. **Warm-handoff** — anonymous referral code, reassurance ("No name leaves this screen"), optional opt-in contact field (sent directly, not stored).
7. **(Optional) Admin aggregate** — desktop-leaning; anonymized cards/simple charts ("28% screened moderate+ this week"); zero individual data.

**Do NOT build:** journaling, community feed, meditation library, mood-over-time history, free-text AI chat. (Out of scope; would dilute the demo.)

---

## 9. ASSETS & ACCESSIBILITY FLOOR
- **Logo:** use the supplied lock-up; keep clear space = cap height around it; provide a white/mono version for the gradient hero and dark mode. Don't place the full-color logo on a busy gradient.
- **Illustrations:** for hackathon speed, lean on the gradient system + lucide icons + the logo; at most one abstract hero illustration (soft glowing shapes / a calm African-student scene). Avoid building a full illustration set — it's a time sink. No medical symbols, no sad faces, no clinical settings (per brand).
- **A11y (non-negotiable):** body ≥16px; AA contrast (4.5:1 body, 3:1 large/UI); visible focus ring (`--ring`); full keyboard nav; `aria-label` on icon buttons; `prefers-reduced-motion` respected; test at 320px width.
