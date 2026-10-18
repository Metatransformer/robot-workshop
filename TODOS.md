# TODOS

## Build guidance

### Interactive build checkpoints

**What:** Add a resumable build session with expected observations, recorded
outcomes, and evidence attachments tied to project revisions.

**Why:** Help builders resume physical work and troubleshoot from what actually
happened, beyond reading a generated guide.

**Context:** Explicitly deferred by the user in CEO review D4 on 2026-10-17.
Generated guidance and ordinary experiment notes remain in the baseline. Start
from the eventual project revision and evidence model; completed steps must mean
reported completion, not certification that the device works. Changes to relevant
instructions must identify potentially affected checkpoints.

**Pros:** Continuity across build sessions and clearer troubleshooting evidence.
**Cons:** Additional workflow state, revision handling, and interaction complexity.
**Effort:** M (human 3–5 days / AI-assisted 1–2 days; provisional)
**Priority:** P3
**Depends on:** Project revisions, build guides, and evidence attachments.

## Project presentation

### Dedicated alternative-design comparison interface

**What:** Present alternative designs side by side with their parts, estimates,
assumptions, and supporting experiments.

**Why:** Make repeated design tradeoffs easier to inspect without rebuilding a
comparison document each time.

**Context:** Explicitly deferred by the user in CEO review D6 on 2026-10-17.
Ordinary agent-authored comparison documents remain supported. Do not introduce
special schemas or UI into the initial foundation for this feature. Revisit only
when actual projects demonstrate repeated comparison needs. The user then changed
the review to HOLD SCOPE; this entry records the approved deferral, not a launch
requirement or invitation to expand scope.

**Pros:** More consistent comparison of alternatives and their evidence.
**Cons:** Additional structured data, upkeep, and interface requirements.
**Effort:** M (human 3–5 days / AI-assisted 1–2 days; provisional)
**Priority:** P3
**Depends on:** Project artifacts, parts references, and evidence records.

## Purchasing services

### Hosted parts purchasing and affiliate referrals

**What:** An optional hosted service connecting project part requirements and
workshop equipment needs with supplier offers and affiliate purchase links.

**Why:** User-selected commercial direction: earn revenue when builders purchase
parts while leaving the local workshop independently useful.

**Context:** Explicitly deferred in CEO review D11. Launch supports local part
definitions, bills of materials, ordinary supplier links, and manual purchasing.
Keep part definitions, supplier offers, and owned items distinct; do not require
hosted catalog IDs. Supplier relationships and affiliate economics are unverified.

**Pros:** Revenue can follow physical building activity without funding inference.
**Cons:** Supplier coverage, changing offers, data maintenance, and conversion need
validation; commissions must not determine technical suitability.
**Effort:** Unestimated until supplier access and intended integration are known.
**Priority:** Deferred; not a launch dependency.
**Depends on:** Usable local projects and parts/BOM conventions, supplier research,
and observed purchasing needs.

**Separate future decision:** Shipping, kits, checkout, order handling, and returns
are not implied by affiliate referrals. Evaluate their scope and operating model
only if users demonstrate demand; no fulfillment implementation is authorized.

## Completed
