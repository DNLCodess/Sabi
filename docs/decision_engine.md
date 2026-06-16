# 07 — SABI AI DECISION ENGINE (Knowledge Base + Rules)
> This file IS the AI. It is the knowledge base + rule set that Sabi's expert system reads to judge a student's responses and decide what to recommend. No LLM is used for judgement. The engine must be deterministic, transparent, and explainable.

## WHAT MAKES THIS "AI-DRIVEN" (say this to judges, put in README)
Sabi uses a **rule-based expert system** — a form of symbolic AI / clinical decision support. It encodes validated clinical knowledge as explicit rules, evaluates a student's inputs against them, infers a risk picture across four domains, and produces an explained recommendation. It is **transparent** (every output states which rule fired) and **safe** (no generative model inventing medical claims). This is a legitimate, auditable AI approach — and for a privacy-first health tool it is arguably more responsible than a black-box LLM. An LLM is explicitly out of scope here.

## EVIDENCE BASE (legit, validated — use in README + pitch)
- **PHQ-9 is validated in Nigerian university students** (Adewuya et al., 2006): internal consistency α = 0.85; concurrent validity with the Beck Depression Inventory r = 0.67; one-month test–retest r = 0.894; optimal cut-off of **5** for minor depressive disorder in that population. → PHQ-9 is the right depression/distress instrument for this exact group.
- **GAD-7** has excellent reliability among university/college students (α/ω ≈ 0.91) and strong convergent validity; standard severity cut-offs are widely used.
- **PSS-10** (Cohen) is a classic, widely validated stress measure; free for educational use. Note: its developer states it is **not diagnostic** and publishes no official cut-offs — the bands below are commonly used interpretive guidelines, not diagnoses.
- **Copenhagen Burnout Inventory (CBI)** is **public domain / open access**, validated across many countries **including Nigeria**, with high internal consistency (α ≈ 0.85–0.90). It was created as the free alternative to the licensed Maslach inventory.
- Context (uploaded studies): Nigerian students show good attitude but poor utilization of services; the #1 barrier is privacy/confidentiality (73.3%). This justifies Sabi's anonymous, instant design.

---

## THE FOUR DOMAINS — INSTRUMENTS, SCORING, BANDS
All instruments are scored **client-side**. Encode each as typed constants.

### A. EMOTIONAL DISTRESS / LOW MOOD — PHQ-9 (also carries the safety item)
- 9 items, each 0–3, total **0–27**. Scale: 0 Not at all · 1 Several days · 2 More than half the days · 3 Nearly every day (last 2 weeks).
- **Bands:** 0–4 Minimal · 5–9 Mild · 10–14 Moderate · 15–19 Moderately severe · 20–27 Severe.
- **Nigerian-student flag:** total ≥ 5 indicates possible minor depression (validated cut-off for this population).
- **Item 9 is the SAFETY ITEM** (thoughts of being better off dead / self-harm). Handled by the override below.
- (Exact items are in spec file 06.)

### B. ANXIETY — GAD-7
- 7 items, each 0–3, total **0–21**. Same 2-week scale.
- **Bands:** 0–4 Minimal · 5–9 Mild · 10–14 Moderate · 15–21 Severe.
- **Clinical-concern flag:** total ≥ 10 (commonly used threshold for likely clinically significant anxiety).
- (Exact items are in spec file 06.)

### C. STRESS — Perceived Stress Scale (PSS-10)
- 10 items, each 0–4 (0 Never · 1 Almost never · 2 Sometimes · 3 Fairly often · 4 Very often), referring to the **last month**.
- **REVERSE-SCORE items 4, 5, 7, 8** before summing (0↔4, 1↔3, 2 stays 2). These are the positively-worded "self-efficacy" items; getting the reversal right is mandatory for validity.
- Total **0–40**. **Interpretive bands (guideline, not diagnostic):** 0–13 Low · 14–26 Moderate · 27–40 High.
- **Use the official CMU PSS-10 item wording** (free for educational use). Do NOT invent items. Subscales: helplessness (items 1,2,3,6,9,10); self-efficacy (items 4,5,7,8).

### D. BURNOUT — Copenhagen Burnout Inventory, Personal Burnout subscale
- Use the **6-item Personal Burnout subscale** (the "generic" exhaustion measure — appropriate for students, who have no "work/client" subscale). Public-domain items:
  1. How often do you feel tired?
  2. How often are you physically exhausted?
  3. How often are you emotionally exhausted?
  4. How often do you think: "I can't take it anymore"?
  5. How often do you feel worn out?
  6. How often do you feel weak and susceptible to illness?
- **Response → points:** Always = 100 · Often = 75 · Sometimes = 50 · Seldom = 25 · Never/almost never = 0.
- **Score = the AVERAGE of the answered items** (range 0–100). If fewer than 3 items answered, the subscale is invalid.
- **Bands:** <50 Low · 50–74 Moderate · 75–99 High · 100 Severe. (≥50 is the established "burnout present" threshold from the PUMA study.)

---

## SAFETY OVERRIDE (highest priority — evaluated FIRST, always)
```
IF PHQ-9 item 9 > 0:
    set overall_tier = CRISIS
    result page MUST lead with crisis resources + "please reach out now"
    show campus counsellor + verified national helpline prominently
    do NOT bury this under the numeric score
    still allow the rest of the results to show below
```
This rule fires regardless of any total score. It is non-overridable.

---

## PER-DOMAIN SEVERITY WEIGHT (normalise the four to one scale 0–4)
Map each domain's band to a severity weight so they can be combined:

| Weight | PHQ-9 | GAD-7 | PSS-10 | CBI-Personal |
|---|---|---|---|---|
| 0 (well) | 0–4 | 0–4 | 0–13 | <25 |
| 1 (early/mild) | 5–9 | 5–9 | 14–18 | 25–49 |
| 2 (moderate) | 10–14 | 10–14 | 19–26 | 50–74 |
| 3 (high) | 15–19 | 15 | 27–34 | 75–99 |
| 4 (severe) | 20–27 | 16–21 | 35–40 | 100 |

`domain_weight = mapped value above` (only for instruments the student completed).

---

## OVERALL TIER LOGIC (the engine's core "judgement")
```
1. If SAFETY OVERRIDE fired -> overall_tier = CRISIS (4+). Stop escalation logic; go to resources.
2. base_tier = MAX(domain_weight) across completed domains
3. Apply PATTERN RULES (below) — they can raise the tier by at most +1, never lower it.
4. Apply EARLY-SIGNS rule (below) — can raise a tier-0 picture to tier-1.
5. overall_tier = result, clamped 0..4
```
Tier meaning → support level:
- **0 Well** → affirm + general wellbeing tips.
- **1 Early signs** → psychoeducation + self-care + gentle "support is here"; offer optional re-check.
- **2 Mild–moderate** → encourage campus counselling; self-help + a matched micro-intervention.
- **3 High** → strongly encourage professional support now; warm-handoff prominent; coping resources.
- **4 Crisis/urgent** → crisis resources first; warm-handoff prioritised; urge immediate human contact.

---

## EARLY-SIGNS DETECTION (mandate emphasis: catch problems EARLY, conservatively)
The problem statement asks for **early** signs, so do not wait for severe scores. Raise a tier-0 student to **tier-1 (early signs)** if ANY of these fire — framed gently, never as alarm:
```
- Two or more domains at weight 1 (mild) simultaneously, OR
- Sentinel items elevated (>=2 "More than half the days"/"Fairly often") even with a low total:
    PHQ-9 items 3 (sleep), 4 (energy/fatigue), 7 (concentration)
    GAD-7 items 1 (on edge), 4 (trouble relaxing)
    CBI items 1,5 (tired, worn out)
    PSS items 1,2 (upset by unexpected, can't control things)
```
Early-signs output is supportive and non-pathologising: "A few things you shared suggest you may be under more pressure than usual — here are some things that help, and support is here whenever you want it."

## PATTERN RULES (explainable AI inferences — each must state which rule fired)
Each rule may raise the tier by +1 (capped) and adds an explanation line:
```
R1 BURNOUT-DRIVEN LOW MOOD: CBI-Personal >=50 AND PHQ-9 >=10
    -> "High exhaustion alongside low mood — burnout and depression often overlap."
R2 ANXIOUS-STRESS LOAD: PSS-10 >=27 AND GAD-7 >=10
    -> "High stress plus anxiety symptoms — your system is carrying a heavy load."
R3 FUNCTIONAL IMPAIRMENT: GAD-7 >=10 AND PHQ-9 items 3 OR 4 OR 7 >=2
    -> "Anxiety is affecting sleep/energy/focus — this affects day-to-day functioning."
R4 PERVASIVE DISTRESS: three or more domains at weight >=2
    -> "Strain is showing across several areas, not just one."
```
Rules are transparent: the result page lists the plain-English explanation of every rule that fired. That transparency is the demoable "AI is reasoning, and showing its work" moment.

---

## RESOURCE-MATCHING MATRIX (tier + dominant domain → what to recommend)
Always show: the barrier-aware panel (privacy/free/convenient/what-to-expect) + the matched items below. Resources come from the verified RESOURCES constants (filled on the day).

| Tier | Always | Domain-matched micro-intervention (general wellbeing, NOT treatment) |
|---|---|---|
| 4 Crisis | Crisis helpline FIRST + counsellor + "reach out now" | Grounding technique; "stay with someone you trust" |
| 3 High | Counsellor contact + warm-handoff button | Stress→paced breathing; Anxiety→worry-postponement; Burnout→rest/boundaries + sleep; Mood→one small activating step |
| 2 Mild–mod | Counsellor info + warm-handoff | same matched micro-intervention as above |
| 1 Early | Psychoeducation + self-care; optional re-check | a single matched 2-minute exercise |
| 0 Well | Affirmation + general wellbeing tips | optional general tip |

Micro-interventions are short, evidence-informed self-help (e.g., box breathing for anxiety, behavioural-activation "one small step" for low mood, sleep-hygiene + saying-no for burnout). They are framed as coping support, never as therapy or cure.

---

## AYO RESPONSE TEMPLATES (templated, NOT generative — warm, plain, Nigerian-student tone)
Ayo never diagnoses. Ayo reflects the tier in plain language. Examples (pick by tier):
- Tier 0: "You dey hold up well. Keep doing the things wey dey help you."
- Tier 1: "You seem to be under more pressure than usual lately. Nothing alarming — but let's look at a few things that help."
- Tier 2: "What you shared points to a real strain. Talking to someone could help — and it's free and private. Here's how."
- Tier 3: "This is a heavy load to carry alone. I'd really encourage you to speak to a counsellor soon — I can help you reach out anonymously right now."
- Tier 4: "I'm really glad you shared this. Your safety matters most — please reach out to one of these right now. You don't have to handle this alone."
Tone rules: short lines, warm, no clinical jargon, no fake cheeriness, no emojis. Never say "you have depression/anxiety" — say "what you shared suggests…".

---

## ENGINE OUTPUT (what the result page receives)
```json
{
  "overall_tier": 0-4,
  "safety_triggered": true|false,
  "domains": [{ "name": "stress", "score": 22, "band": "Moderate", "weight": 2 }, ...],
  "fired_rules": ["R2: high stress + anxiety…", "EARLY: two mild domains…"],
  "ayo_message": "templated string for the tier",
  "recommendations": ["counsellor", "warm_handoff", "breathing_2min"],
  "resources_to_show": [ ...from RESOURCES constants ]
}
```
The `fired_rules` array is shown to the student in plain English ("Why you're seeing this") — that is the explainability that makes it trustworthy AI.

---

## DISPLAYED WORDING (comprehension layer — no language toggle)
Each item is displayed in a plain, familiar gloss while the **validated item maps underneath unchanged** for scoring. Single presentation, no toggle. The gloss is a comprehension aid and is **not** claimed to be a validated translation. Keep glosses faithful to the original meaning; do not change what is measured. (Glosses to be finalised with the team; do not invent new clinical content.)

---

## HARD CONSTRAINTS / CAVEATS (must appear in UI + README)
- Sabi is a **screening + signposting** tool. It does **not diagnose** and is **not** a substitute for a professional.
- PSS bands and CBI/early-signs tiers are **interpretive guidelines**, not clinical diagnoses; PHQ-9/GAD-7 bands are standard screening bands, still not diagnoses.
- The safety override is mandatory and non-overridable.
- No data identifying a person is stored (see privacy pillar in file 06).

## SOURCES (validation evidence)
- Adewuya et al. (2006), *Journal of Affective Disorders* — PHQ-9 validity in Nigerian university students (cut-off 5; α 0.85).
- Spitzer/Kroenke et al. — PHQ-9 and GAD-7 original validation; GAD-7 student psychometrics (α/ω ≈ .91).
- Cohen, Kamarck & Mermelstein (1983); CMU PSS materials — PSS-10 scoring (reverse items 4,5,7,8; range 0–40; non-diagnostic).
- Kristensen et al. (2005), *Work & Stress* — Copenhagen Burnout Inventory (public domain; personal-burnout 6 items; ≥50 threshold), validated across countries incl. Nigeria.
- Kukoyi et al. (2022), *Heliyon*; Li, Li & Fan (2025), *Frontiers in Public Health* — student utilisation barriers (privacy 73.3%) and effective digital/education interventions.
