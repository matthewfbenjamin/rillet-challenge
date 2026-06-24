# Requirements: Rillet Invoice Workspace

## Context

**Product:** Invoice workspace for an Accounting Manager at a fast-growing SaaS company.
**Persona:** Finance power-user. Needs to trust the data, move quickly, and have a clear audit trail.
**Tone:** Serious finance software — precise, calm, efficient, audit-ready. Not a marketing page.
**Time budget:** ~2–4 hours of implementation.

---

## Seed Data

Source: `invoices.json`. The company is **Northstar Metrics** (B2B SaaS, USD base currency).

5 seed invoices covering the key status combinations:
| Invoice | Customer | Status | Payment | Currency | Notable |
|---|---|---|---|---|---|
| INV-2026-0412 | Acme Labs | Sent | Open | USD | Usage overage line item |
| INV-2026-0413 | Brightline Health | Draft | Unsent | USD | Flat discount applied |
| INV-2026-0408 | Juniper Supply Co. | Sent | Overdue | CAD | Multi-currency |
| INV-2026-0399 | Northwind Analytics | Paid | Paid | GBP | Annual renewal, discount |
| INV-2026-0414 | Acme Labs | Void | Voided | USD | Duplicate, voided |

---

## Core Features (required)

### 1. Invoice List

- Scannable table/list of all invoices.
- **Required columns:** customer name, invoice number, status, payment status, due date, amount (formatted with currency), last updated.
- **Due date risk:** visually distinguish overdue invoices (past due date, not paid/void).
- **Status + payment status distinction:** these are separate fields; the UI must make both readable without confusion.
- Sorting by at least one column (e.g. due date or amount). Filtering by status is a nice-to-have.
- Empty state when no invoices exist.
- Links to invoice detail.

### 2. Create Invoice

- Form with all invoice fields (see data model below).
- At minimum 1 line item required; ability to add/remove line items.
- Derived totals computed live: subtotal, discount, tax, total.
- Field validation (required fields, numeric constraints, date logic).
- On success: invoice appears in list immediately (no page refresh).
- Form design should reduce mistakes: e.g. clear labels, sensible defaults, inline validation errors.

### 3. Invoice Detail

Focused single-invoice view including:
- Header: invoice number, customer, status badges, dates, payment terms.
- Customer details: billing email, billing address.
- Line items table: description, quantity, unit price, amount per line, account code.
- Financials summary: subtotal, discount, tax rate + tax amount, **total**.
- Memo.
- Activity / audit trail: timestamp, actor, action — ordered chronologically.
- Actions: Edit, Delete (confirm), and (stretch) status transitions.

### 4. Edit Invoice

- Pre-populated form with all current values.
- Same line item management as Create.
- Validation mirrors Create.
- On save: detail view reflects changes immediately; activity log appends an edit event.
- Paid or Void invoices: consider whether editing should be restricted or warned against (audit sensitivity).

### 5. Delete Invoice

- Deliberate interaction: requires an explicit confirmation step (modal/dialog).
- Clear feedback on success (e.g. toast/banner, redirect to list).
- On success: invoice removed from list immediately.
- Void vs. delete distinction: the seed data shows Void as a status (soft delete / accounting void). Physical deletion removes the record entirely. Both may need to exist — confirm with user.

### 6. State Management

- All CRUD operations update the UI without a full page refresh.
- Optimistic UI or loading states on async operations.
- Error states surfaced clearly (failed save, network error).

### 7. Persistence

- Backend with full CRUD backed by persistent storage.
- Seed data loaded on first run (from `invoices.json`).
- No authentication required.
- Sensible validation at the API boundary.

### 8. Responsive Behavior

- Primary target: laptop viewport.
- Must remain usable on mobile (no broken layouts, key actions reachable).

---

## Data Model

### Invoice

```
id                string         (generated, e.g. inv-YYYY-NNNN)
invoiceNumber     string         (human-readable, e.g. INV-2026-0412)
customerName      string
billingEmail      string
billingAddress    string
paymentTerms      string         (Net 15 | Net 30 | Net 45 | Due on receipt | custom)
status            enum           Draft | Sent | Paid | Void
paymentStatus     enum           Unsent | Open | Overdue | Paid | Voided
currency          string         (ISO 4217, e.g. USD | CAD | GBP)
issueDate         date
dueDate           date
paidDate          date?          (nullable)
memo              string
taxRate           number         (decimal, e.g. 0.085 = 8.5%)
discount          number         (flat dollar amount off subtotal)
lineItems         LineItem[]
activity          ActivityEvent[]
```

### LineItem

```
id                string
description       string
quantity          number
unitPrice         number
accountCode       string         (chart of accounts code)
amount            derived        (quantity * unitPrice — never stored)
```

### ActivityEvent

```
id                string
timestamp         ISO 8601 string
actor             string
action            string
```

### Derived Totals (computed, never persisted)

```
subtotal    = sum(lineItem.quantity * lineItem.unitPrice)
discounted  = subtotal - discount
tax         = discounted * taxRate
total       = discounted + tax
```

---

## Tech Stack

### Frontend
- **React 19** with **TypeScript**
- **Vite** (SPA build tool)
- **TanStack Router** (type-safe routing — better TS ergonomics than React Router for 2026)
- **TanStack Query** (server state, caching, optimistic updates)
- **React Hook Form** + **Zod** (form state + schema validation)
- **Mantine v8** (UI component library — replaces need for headless + Tailwind for this scope)
- **React Context + useReducer** for global client state (no third-party state library)

### Backend
- **Node.js** + **Express** (or Next.js API routes — TBD at architecture phase)
- **SQLite** via **better-sqlite3** or **Drizzle ORM** (simple, file-based, easy to inspect)
- Seed script that loads `invoices.json` on first run

### Testing
- **Vitest** + **React Testing Library**
- Focus: derived total calculations, form validation logic, key interactions (confirm delete, create flow)

### Code Quality
- **Biome** (lint + format, single binary)
- **TypeScript strict mode**

---

## Engineering Quality Bars

- Clear component boundaries and naming.
- Derived totals computed reliably from line items — never stored, always recalculated.
- Loading, empty, error, and destructive-action states handled.
- Accessible patterns: tables with proper headers, dialogs with focus trap, forms with labels, color contrast.
- Activity log appended on every create/edit/delete event.

---

## Design Quality Bars

- Strong information hierarchy; high signal-to-noise ratio.
- Useful density without visual clutter (finance tools need compact tables, not marketing cards).
- Clear visual language for status, payment risk, and due date urgency.
- Form design reduces errors: required-field indicators, inline validation, sensible defaults.
- Polished micro-details: hover/focus states, responsive layout, currency formatting, date formatting.

---

## Bonus: Invoice Assistant (LLM-Enhanced Workflow)

**Goal:** User pastes unstructured text (email, Slack message, contract note). App sends it to an LLM and returns a structured invoice draft for human review before creation.

**Flow:**
1. "New Invoice" flow has an optional "Import from text" entry point.
2. User pastes free-form text into a textarea.
3. App sends text to LLM (server-side, never expose API key client-side).
4. LLM returns a structured draft matching the Invoice schema, plus a `needsReview` array of field names the model was uncertain about.
5. Draft pre-populates the create form. Fields flagged `needsReview` are visually highlighted.
6. User reviews, edits if needed, and submits normally.

**Requirements if implemented:**
- Loading state while LLM processes.
- Error handling if LLM returns invalid/incomplete data (validate against Zod schema).
- `needsReview` fields visually distinguished (amber highlight or badge).
- `.env.example` with `LLM_API_KEY` and `LLM_MODEL`.
- Mock mode (`LLM_MOCK=true`) that returns deterministic output from `bonusLlmExamples` in `invoices.json`.

---

## Explicitly Out of Scope

- Authentication / multi-user sessions
- PDF generation
- Payment collection or billing infrastructure
- Email delivery of invoices
- Multi-tenant data isolation
- Real-time collaboration

---

## Decisions

1. **Void-only (no hard delete):** The "Delete" action voids the invoice (sets `status: Void`, `paymentStatus: Voided`) rather than physically removing the record. Preserves the full audit trail — a voided invoice with actor/timestamp is the correct accounting primitive. The list defaults to hiding voided invoices with a toggle to show them.

2. **Status transitions from seed data model:** Status values are `Draft | Sent | Paid | Void` as established in `invoices.json`. Transitions are driven by explicit action buttons on the detail view (e.g. "Mark as Sent", "Record Payment", "Void") — not free-form dropdowns in the edit form. This matches the audit-friendly pattern the seed data implies and keeps invalid state transitions (e.g. Void → Paid) impossible in the UI.

3. **Multi-currency with base-currency conversion:** The list shows each invoice's native currency amount. A summary bar or header shows aggregate totals converted to USD (Northstar Metrics' base currency from `invoices.json`). Conversion rates will be static/approximate for the prototype — noted as a known limitation.

4. **Invoice number:** Auto-generated on creation (e.g. `INV-2026-0415` incrementing from the highest existing number), pre-populated in the form field, and user-editable if needed.

5. **Account codes:** Combobox — dropdown with the known codes (4000, 4010, 4100, 4200, 4300) plus free-text entry for codes not in the list. Mantine's `Combobox` or `Select` with `creatable` handles this.

6. **Paid date:** Free-form date input with a "Today" button that populates the current date. Required when marking an invoice as Paid.

7. **LLM bonus — Anthropic Claude:** Implemented server-side using the Anthropic SDK. API key via `ANTHROPIC_API_KEY` in `.env`. Mock mode via `LLM_MOCK=true` using deterministic responses from `bonusLlmExamples` in `invoices.json`. Free-tier compatible (Claude Haiku for cost efficiency).
