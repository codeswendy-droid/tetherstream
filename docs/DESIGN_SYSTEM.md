# Titan Stream Design System & Language Standard (v1.0 Final)

> **Core Philosophy**: Titan Stream does not sell rewards. It sells ownership of living digital infrastructure. Every interaction reinforces "I own this", "My actions matter", and "My Titan is alive."

---

## 1. Domain Terminology Dictionary

To maintain a consistent product identity, developers and designers must strictly enforce the canonical vocabulary across all screens, tooltips, notifications, and code comments.

### Forbidden vs Canonical Vocabulary

| ❌ Forbidden Term | ✅ Canonical Term | Rationale / Context |
| :--- | :--- | :--- |
| `Mining` | `Operate` / `Hashing` / `Yield Generation` | Avoid generic crypto jargon; frame as active hardware operation. |
| `Boost` | `Cooler Multiplier` / `Intake Boost` | Refer specifically to thermal and intake hardware capacity. |
| `Hashrate` | `Machine Power` / `Capacity (GH/s)` | Express computing power in human-readable terms. |
| `Farm` | `Fleet` / `Infrastructure Array` | Users own high-performance machinery, not a virtual farm. |
| `Crypto` | `USDT` / `TON` / `Digital Currency` | Name exact digital assets rather than vague category labels. |
| `Farming` | `Yield Accumulation` | Frame income as active infrastructure output. |
| `User` | `Operator` / `Titan Owner` | Emphasize ownership and operator responsibility. |
| `Referral` | `Network Member` / `Partner` | Frame referral growth as building an infrastructure business. |

---

## 2. Destination Personalities & Motion System

Each destination in Titan Stream has a distinct emotion, rhythm, visual accent, and animation physics.

```
+-------------------------------------------------------------------------+
|                                TITAN STREAM                             |
+-------------------+-------------------+-------------------+-------------+
| Wallet            | Titan Hub         | Grow              | Rewards     |
| (Calm Financial)  | (Command Cockpit) | (Business Growth) | (Career)    |
| USDT Green        | Titan Blue        | Community Cyan    | Gold/Purple |
+-------------------+-------------------+-------------------+-------------+
```

### Destination Breakdown

#### 1. Wallet (The Calm Financial Center)
- **Question Answered**: *"How much do I own?"*
- **Emotion**: Security, Ownership, Confidence, Calm.
- **Rhythm**: Stable, slow, minimal motion, spacious typography.
- **Color Accent**: USDT Green (`#00e676`) & Deep Navy.
- **Motion Physics**: Stable fade, ease-in-out counters (`duration: 0.2s`).
- **Contextual Loading**: *"Reconciling Ledger..."*

#### 2. Titan Hub (The Cockpit Command Center)
- **Question Answered**: *"What should I do right now?"*
- **Emotion**: Power, Control, Technology, High Energy.
- **Rhythm**: Fast, dynamic, high responsiveness, living telemetry.
- **Color Accent**: Electric Titan Blue (`#00b0ff`) & Power Glow.
- **Motion Physics**: Spring animations (`stiffness: 380, damping: 30`), pulse loops.
- **Contextual Loading**: *"Synchronizing Titan..."*

#### 3. Grow (Business Expansion & Momentum)
- **Question Answered**: *"How do I expand my Titan business?"*
- **Emotion**: Expansion, Momentum, Community, Hope.
- **Rhythm**: Encouraging, social, optimistic.
- **Color Accent**: Community Cyan (`#00e5ff`) & Teal.
- **Motion Physics**: Slide-in lists, expanding cards (`duration: 0.25s`).
- **Contextual Loading**: *"Loading Network..."*

#### 4. Rewards (Career Progression Screen)
- **Question Answered**: *"How am I progressing?"*
- **Emotion**: Achievement, Progress, Recognition, Game Screen.
- **Rhythm**: Celebratory, colorful, animated.
- **Color Accent**: Championship Gold (`#ffb300`) & Royal Purple (`#ab47bc`).
- **Motion Physics**: Particle rises, ring stroke animations, badge unlocks.
- **Contextual Loading**: *"Calculating Progress..."*

#### 5. Profile (Identity & Prestige Destination)
- **Question Answered**: *"Who am I inside Titan?"*
- **Emotion**: Identity, Prestige, Trust, Legacy.
- **Rhythm**: Premium, personal, elegant.
- **Color Accent**: Dark Gold & Verification Emerald (`#00c853`).
- **Motion Physics**: 3D Flip Passport rotation (`rotateY: 180deg`), golden seal shine.
- **Contextual Loading**: *"Verifying Identity..."*

---

## 3. Component Standards & Layout Rules

### Rule 1: Visual Focal Point & Hierarchy (60 / 30 / 10)
- **60% Main Feature**: Dominant hero element (e.g. Portfolio Card on Wallet, Spinner on Hub, Network Health on Grow, Season Ring on Rewards, Passport on Profile).
- **30% Supporting Information**: Detailed metrics, active lists, or telemetry.
- **10% Discovery**: Optional features (e.g. Security audit on Wallet, Mini Games launcher on Hub, Growth Analytics on Grow, Season History on Rewards, Settings on Profile).

### Rule 2: Primary Action Singular Focus
- Every page must feature exactly **one dominant primary action button**. Secondary actions must be visually subordinate (ghost/outline buttons).

### Rule 3: No Dead Ends Policy
- Every screen must conclude with a recommended next action or cross-destination link (e.g. Wallet unclaimed yield -> Hub; Grow referral milestone -> Rewards).

### Rule 4: Motivational Empty States
- Empty states must never display generic "Nothing here" copy.
- Structure:
  1. Icon with destination accent color.
  2. Educational title explaining why the section is empty.
  3. Motivational description directing the user.
  4. Direct CTA button to execute the next action.

### Rule 5: Memorable Manual Moments
- *Nothing should be done automatically if doing it manually creates a memorable moment.*
- Never silently add a machine -> trigger unboxing ceremony.
- Never silently unlock a milestone -> show celebratory card.
- Never make the machine feel like a background process -> welcome the operator back with live uptime metrics.

---

## 4. Production UX Acceptance Rules

1. Every page has exactly one primary purpose and one dominant visual focal point.
2. No two pages may have the same layout hierarchy or answer the same question.
3. No card, section, or widget may appear on multiple pages without being redesigned for that page's specific purpose.
4. Every page must contain a hero section, clear primary action, supporting info, historical context, and a next recommended action.
5. The Spinner remains the visual and emotional centerpiece of the Hub and is never visually overshadowed.
6. The platform should feel like one connected operating system, not five independent applications.
