# Rillet Invoice Workspace — Architecture

## Table of Contents

1. Repository Structure
2. Shared Types
3. Backend Architecture
4. Frontend Architecture
5. API Contract
6. LLM Integration
7. Testing Strategy
8. Key Design Decisions and Tradeoffs

---

## 1. Repository Structure

Single Git repository with a flat monorepo layout. No Turborepo or Nx — a root-level `package.json` provides workspace scripts that delegate to `client/` and `server/`. A `shared/` directory holds TypeScript types and Zod schemas consumed by both sides without a build step (imported via path aliases).

```
rillet/
├── .env.example
├── .gitignore
├── biome.json                     # single Biome config for client + server + shared
├── package.json                   # root: "dev", "build", "test" scripts
├── invoices.json                  # seed source (read by server on first run)
├── README.md
│
├── shared/
│   ├── types.ts                   # Invoice, LineItem, ActivityEvent, derived types
│   ├── schemas.ts                 # Zod schemas (used by RHF resolver + Express validation)
│   └── constants.ts               # ACCOUNT_CODES, PAYMENT_TERMS, STATUS_TRANSITIONS, FX_RATES
│
├── server/
│   ├── package.json
│   ├── tsconfig.json              # paths alias "~shared" → ../shared
│   ├── src/
│   │   ├── index.ts               # entry: init DB, seed, start server
│   │   ├── app.ts                 # Express app factory (exported for testing)
│   │   ├── db/
│   │   │   ├── database.ts        # opens/creates SQLite DB, exports singleton
│   │   │   ├── schema.ts          # CREATE TABLE statements
│   │   │   └── seed.ts            # reads invoices.json, inserts if DB is empty
│   │   ├── routes/
│   │   │   ├── invoices.ts        # CRUD + transition routes for /api/invoices
│   │   │   └── assistant.ts       # POST /api/assistant/parse
│   │   ├── middleware/
│   │   │   ├── validateBody.ts    # Zod validation middleware factory
│   │   │   └── errorHandler.ts    # structured JSON error responses
│   │   ├── services/
│   │   │   ├── invoiceService.ts  # business logic: CRUD, activity append, transitions
│   │   │   ├── invoiceNumber.ts   # auto-increment invoice number generator
│   │   │   └── assistantService.ts# Anthropic call + mock mode + response validation
│   │   └── lib/
│   │       └── totals.ts          # computeTotals(lineItems, discount, taxRate)
│   └── data/
│       └── rillet.db              # SQLite file (git-ignored)
│
└── client/
    ├── package.json
    ├── tsconfig.json              # strict, paths alias "~shared" → ../shared
    ├── vite.config.ts             # proxy /api → localhost:3001, path alias "~shared"
    ├── index.html
    └── src/
        ├── main.tsx               # RouterProvider + QueryClientProvider + MantineProvider
        ├── routeTree.gen.ts       # TanStack Router generated file (do not edit)
        ├── routes/
        │   ├── __root.tsx         # Root layout: AppShell, nav header, Outlet
        │   ├── index.tsx          # / redirect to /invoices
        │   └── invoices/
        │       ├── index.tsx      # /invoices — InvoiceListPage
        │       ├── new.tsx        # /invoices/new — CreateInvoicePage
        │       └── $invoiceId/
        │           ├── index.tsx  # /invoices/:invoiceId — InvoiceDetailPage
        │           └── edit.tsx   # /invoices/:invoiceId/edit — EditInvoicePage
        ├── components/
        │   ├── invoice-list/
        │   │   ├── InvoiceTable.tsx
        │   │   ├── InvoiceTableRow.tsx
        │   │   ├── StatusBadge.tsx
        │   │   ├── PaymentStatusBadge.tsx
        │   │   ├── DueDateCell.tsx        # overdue highlight
        │   │   ├── AmountCell.tsx         # currency-formatted amount
        │   │   ├── ListSummaryBar.tsx     # USD equivalent aggregate header
        │   │   └── EmptyInvoiceState.tsx
        │   ├── invoice-form/
        │   │   ├── InvoiceForm.tsx        # shared for create + edit
        │   │   ├── LineItemsFieldArray.tsx
        │   │   ├── LineItemRow.tsx
        │   │   ├── TotalsPanel.tsx        # live subtotal/tax/total
        │   │   ├── AccountCodeCombobox.tsx
        │   │   ├── PaidDateField.tsx      # date input + "Today" button
        │   │   └── NeedsReviewHighlight.tsx
        │   ├── invoice-detail/
        │   │   ├── InvoiceDetailHeader.tsx
        │   │   ├── InvoiceDetailMeta.tsx
        │   │   ├── LineItemsTable.tsx
        │   │   ├── FinancialsSummary.tsx
        │   │   ├── ActivityLog.tsx
        │   │   └── ActionButtons.tsx      # Mark as Sent, Record Payment, Void
        │   ├── common/
        │   │   ├── ConfirmModal.tsx
        │   │   ├── LoadingSpinner.tsx
        │   │   ├── ErrorAlert.tsx
        │   │   └── CurrencyDisplay.tsx    # Intl.NumberFormat wrapper
        │   └── assistant/
        │       ├── AssistantDrawer.tsx
        │       └── AssistantForm.tsx
        ├── hooks/
        │   ├── useInvoices.ts
        │   ├── useInvoice.ts
        │   ├── useCreateInvoice.ts
        │   ├── useUpdateInvoice.ts
        │   ├── useTransitionInvoice.ts
        │   ├── useVoidInvoice.ts
        │   ├── useAssistantParse.ts
        │   └── useDerivedTotals.ts
        ├── context/
        │   ├── InvoiceUIContext.tsx       # reducer: voided toggle, sort col/dir, filter
        │   └── NotificationContext.tsx    # reducer: toast queue
        ├── lib/
        │   ├── queryClient.ts
        │   ├── fxRates.ts                 # static USD rates + convertToUSD()
        │   └── formatters.ts              # formatCurrency, formatDate, formatRelativeDate
        └── test/
            ├── setup.ts
            ├── unit/
            │   ├── totals.test.ts
            │   ├── fxRates.test.ts
            │   └── schemas.test.ts
            └── integration/
                ├── InvoiceForm.test.tsx
                ├── InvoiceList.test.tsx
                └── ConfirmModal.test.tsx
```

---

## 2. Shared Types

**Module system:** The entire project is ESM-only. Both `server/package.json` and `client/package.json` set `"type": "module"`. All imports use `import`/`export` syntax; `require()` is never used. `server/tsconfig.json` uses `module: NodeNext` and `moduleResolution: NodeNext`.

**Import strategy:** Both `client/tsconfig.json` and `server/tsconfig.json` define a `paths` alias `"~shared/*"` pointing to `../shared/*`. Vite's `resolve.alias` maps the same key for the client bundle. No compilation step needed — both sides consume raw TypeScript source via Vite and `tsx` respectively.

### `shared/types.ts`

```typescript
export type InvoiceStatus = "Draft" | "Sent" | "Paid" | "Void";
// Overdue is derived: never stored in DB; computed on read when dueDate < today && paymentStatus === "Open" or "Partial"
export type PaymentStatus = "Unsent" | "Open" | "Partial" | "Overdue" | "Paid" | "Voided";

export interface LineItem {
  id: string;
  description: string;
  quantity: number;
  unitPrice: number;
  accountCode: string;
}

export interface ActivityEvent {
  id: string;
  timestamp: string; // ISO 8601
  actor: string;
  action: string;
}

export interface Invoice {
  id: string;
  invoiceNumber: string;
  customerName: string;
  billingEmail: string;
  billingAddress: string;
  paymentTerms: string;
  status: InvoiceStatus;
  paymentStatus: PaymentStatus;
  currency: string;
  issueDate: string;
  dueDate: string;
  paidDate?: string;
  amountPaid?: number;
  memo: string;
  taxRate: number;
  discount: number;
  lineItems: LineItem[];
  activity: ActivityEvent[];
  createdAt: string;
  updatedAt: string;
}

export interface DerivedTotals {
  subtotal: number;
  discounted: number;
  tax: number;
  total: number;
}

// Used in list view — avoids sending lineItems/activity on list endpoint
export type InvoiceListItem = Omit<Invoice, "lineItems" | "activity" | "memo">;

export interface AssistantDraft {
  draft: Partial<Omit<Invoice, "id" | "status" | "paymentStatus" | "createdAt" | "updatedAt" | "activity">>;
  needsReview: string[];
}
```

### `shared/schemas.ts`

Zod schemas are the single source of truth for validation. The server uses them in Express middleware; the client uses them as the RHF resolver.

```typescript
import { z } from "zod";

export const LineItemSchema = z.object({
  id: z.string().min(1),
  description: z.string().min(1, "Description required"),
  quantity: z.number().positive("Must be > 0"),
  unitPrice: z.number().min(0, "Must be ≥ 0"),
  accountCode: z.string().min(1, "Account code required"),
});

export const CreateInvoiceSchema = z.object({
  invoiceNumber: z.string().min(1),
  customerName: z.string().min(1),
  billingEmail: z.string().email(),
  billingAddress: z.string().min(1),
  paymentTerms: z.string().min(1),
  currency: z.string().length(3),
  issueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  paidDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().nullable(),
  memo: z.string(),
  taxRate: z.number().min(0).max(1),
  discount: z.number().min(0),
  lineItems: z.array(LineItemSchema).min(1, "At least one line item required"),
});

export const UpdateInvoiceSchema = CreateInvoiceSchema.partial();

export const TransitionSchema = z.object({
  action: z.enum(["send", "recordPayment", "recordPartialPayment", "void"]),
  paidDate: z.string().optional(),
  amountPaid: z.number().positive().optional(),
  actor: z.string().default("Maya Chen"),
}).superRefine((d, ctx) => {
  if (d.action === "recordPayment" && !d.paidDate) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "paidDate required for recordPayment", path: ["paidDate"] });
  }
  if (d.action === "recordPartialPayment" && d.amountPaid === undefined) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "amountPaid required for recordPartialPayment", path: ["amountPaid"] });
  }
});

export const AssistantParseRequestSchema = z.object({
  text: z.string().min(1).max(4000),
});
```

### `shared/constants.ts`

```typescript
export const KNOWN_ACCOUNT_CODES = [
  { code: "4000", label: "4000 — Subscription Revenue" },
  { code: "4010", label: "4010 — Usage Revenue" },
  { code: "4100", label: "4100 — Professional Services" },
  { code: "4200", label: "4200 — Advisory Services" },
  { code: "4300", label: "4300 — Support Revenue" },
] as const;

export const PAYMENT_TERMS_OPTIONS = [
  "Net 15", "Net 30", "Net 45", "Due on receipt",
] as const;

export const STATUS_TRANSITIONS: Record<string, string[]> = {
  Draft: ["send", "void"],
  Sent: ["recordPayment", "void"],
  Paid: [],
  Void: [],
};

// Static FX rates relative to USD — shown as approximate (~) in UI
export const FX_RATES_TO_USD: Record<string, number> = {
  USD: 1,
  CAD: 0.74,
  GBP: 1.27,
  EUR: 1.09,
};

export const SYSTEM_ACTOR = "Rillet automation";
export const DEFAULT_ACTOR = "Maya Chen";
```

---

## 3. Backend Architecture

### 3.1 Express Application Structure

`server/src/app.ts` exports a factory that creates and configures the app without starting the HTTP server — enabling `supertest` imports for integration tests.

```
app.ts
  ├── json middleware
  ├── cors (dev only — Vite proxy handles prod)
  ├── /api/invoices router  (invoices.ts)
  ├── /api/assistant router (assistant.ts)
  └── errorHandler middleware (must be last)

index.ts
  ├── imports app from app.ts
  ├── initializes DB (database.ts)
  ├── runs seed (seed.ts)
  └── listens on PORT (default 3001)
```

### 3.2 SQLite Schema

`lineItems` and `activity` are stored as JSON text columns. They are always read/written as atomic units with the parent invoice, have no independent query requirements, and keeping them in JSON columns makes the DB trivially inspectable. See tradeoff discussion in section 8.

```sql
CREATE TABLE IF NOT EXISTS invoices (
  id              TEXT PRIMARY KEY,
  invoiceNumber   TEXT NOT NULL UNIQUE,
  customerName    TEXT NOT NULL,
  billingEmail    TEXT NOT NULL,
  billingAddress  TEXT NOT NULL,
  paymentTerms    TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'Draft',
  paymentStatus   TEXT NOT NULL DEFAULT 'Unsent',
  currency        TEXT NOT NULL DEFAULT 'USD',
  issueDate       TEXT NOT NULL,
  dueDate         TEXT NOT NULL,
  paidDate        TEXT,
  amountPaid      REAL,                                -- nullable; set when recordPartialPayment action is applied
  -- Overdue is never stored; computed on read when dueDate < today and paymentStatus is Open or Partial
  memo            TEXT NOT NULL DEFAULT '',
  taxRate         REAL NOT NULL DEFAULT 0,
  discount        REAL NOT NULL DEFAULT 0,
  lineItems       TEXT NOT NULL DEFAULT '[]',   -- JSON array of LineItem
  activity        TEXT NOT NULL DEFAULT '[]',   -- JSON array of ActivityEvent
  createdAt       TEXT NOT NULL,
  updatedAt       TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_invoices_status    ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_dueDate   ON invoices(dueDate);
CREATE INDEX IF NOT EXISTS idx_invoices_updatedAt ON invoices(updatedAt);
```

JSON columns are serialized/deserialized in `invoiceService.ts` using `JSON.parse` / `JSON.stringify`. All queries use `better-sqlite3` synchronous prepared statements.

### 3.3 `invoiceService.ts` Interface

```typescript
listInvoices(includeVoided: boolean): InvoiceListItem[]
getInvoiceById(id: string): Invoice | null
createInvoice(data: CreateInvoiceInput, actor: string): Invoice
updateInvoice(id: string, data: UpdateInvoiceInput, actor: string): Invoice
transitionInvoice(id: string, action: TransitionAction, actor: string, paidDate?: string, amountPaid?: number): Invoice
voidInvoice(id: string, actor: string): Invoice
generateInvoiceNumber(): string
```

**Overdue derivation:** `listInvoices` and `getInvoiceById` compute `Overdue` on read. After fetching rows from the DB, if `dueDate < today && paymentStatus === "Open"`, the service sets `paymentStatus` to `"Overdue"` in the returned object before returning it. `"Overdue"` is never written to the DB column.

Activity is always appended, never replaced. On every mutation, the service reads the existing `activity` array, pushes a new `ActivityEvent` (nanoid id, current ISO timestamp, actor, descriptive action string), and writes back the full JSON column.

### 3.4 Route Layout

**`/api/invoices`**

| Method | Path | Description |
|---|---|---|
| GET | `/api/invoices` | List; `?includeVoided=true` to include voided |
| POST | `/api/invoices` | Create invoice |
| GET | `/api/invoices/next-number` | Next auto-generated invoice number |
| GET | `/api/invoices/:id` | Get single invoice |
| PATCH | `/api/invoices/:id` | Update invoice fields |
| POST | `/api/invoices/:id/transition` | Apply status transition |
| DELETE | `/api/invoices/:id` | Void invoice (no hard delete) |

**`/api/assistant`**

| Method | Path | Description |
|---|---|---|
| POST | `/api/assistant/parse` | Parse unstructured text → AssistantDraft |

### 3.5 Validation Middleware

```typescript
// server/src/middleware/validateBody.ts
export const validateBody =
  (schema: ZodSchema) =>
  (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: "Validation failed",
        issues: result.error.flatten().fieldErrors,
      });
    }
    req.body = result.data;
    next();
  };
```

### 3.6 Error Responses

All thrown errors propagate to the final error handler middleware:

- **400** — validation failed (from `validateBody`)
- **404** — invoice not found
- **409** — invalid status transition (`INVALID_TRANSITION` code)
- **500** — unexpected error (stack logged server-side, generic message returned)

Shape: `{ error: string, code?: string, issues?: Record<string, string[]> }`

### 3.7 Seed Strategy

`server/src/db/seed.ts`:
1. Checks `SELECT COUNT(*) FROM invoices` — exits immediately if > 0 (idempotent).
2. Reads `invoices.json` from repo root.
3. Maps each invoice to a flat DB row (serializing `lineItems` and `activity` to JSON strings, adding `createdAt`/`updatedAt` from the earliest activity timestamp).
4. Inserts all rows in a single transaction.
5. Called from `index.ts` after DB initialization.

### 3.8 Invoice Number Generation

`server/src/services/invoiceNumber.ts`:
1. `SELECT invoiceNumber FROM invoices ORDER BY invoiceNumber DESC LIMIT 1`
2. Parses the numeric suffix after the second `-`; increments by 1; formats with `String(n).padStart(4, '0')` — 4 digits minimum, grows naturally beyond 9999 (i.e. `INV-2026-9999` → `INV-2026-10000`).
3. Prefixes with `INV-{currentYear}-`.
4. `GET /api/invoices/next-number` exposes this for form pre-population without reserving the number — actual sequence determined at INSERT.

> **Note:** Sorting by `invoiceNumber DESC` to find the highest works correctly because the numeric suffix is variable-length and we parse it as an integer, not rely on lexicographic ordering. If lexicographic sort were used, `INV-2026-9999` would sort after `INV-2026-10000` — the implementation must parse the integer explicitly.

---

## 4. Frontend Architecture

### 4.1 Route Structure

```
/                              → redirect to /invoices
/invoices                      → InvoiceListPage
/invoices/new                  → CreateInvoicePage
/invoices/$invoiceId           → InvoiceDetailPage
/invoices/$invoiceId/edit      → EditInvoicePage
```

`__root.tsx` renders a persistent Mantine `AppShell` (header nav with wordmark + "New Invoice" button) and `<Outlet />`. Each page manages its own loading states.

Route `loader` functions call `queryClient.ensureQueryData` for detail and edit pages, ensuring invoice data is in the cache before the component mounts — so `defaultValues` are always populated on first render without a `reset()` call after load.

### 4.2 Component Hierarchy

#### Invoice List (`/invoices`)

```
InvoiceListPage
├── ListSummaryBar              (USD equivalent totals, from InvoiceUIContext)
├── [voided toggle + count badge]
├── InvoiceTable
│   ├── [sortable thead — click dispatches SORT to InvoiceUIContext]
│   └── InvoiceTableRow × n
│       ├── DueDateCell         (red text + icon when overdue)
│       ├── StatusBadge
│       ├── PaymentStatusBadge  (distinct color palette from StatusBadge)
│       └── AmountCell          (formatCurrency)
└── EmptyInvoiceState
```

#### Invoice Detail (`/invoices/:id`)

```
InvoiceDetailPage
├── InvoiceDetailHeader
│   ├── InvoiceNumber + CustomerName
│   ├── StatusBadge + PaymentStatusBadge
│   └── ActionButtons (rendered per STATUS_TRANSITIONS[status])
│       ├── "Mark as Sent"     → useTransitionInvoice({ action: "send" })
│       ├── "Record Payment"   → PaidDateModal → useTransitionInvoice({ action: "recordPayment" })
│       └── "Void Invoice"     → ConfirmModal → useVoidInvoice()
├── InvoiceDetailMeta           (dates, terms, billing email, address)
├── LineItemsTable              (read-only)
├── FinancialsSummary           (subtotal → discount → tax → total bold)
├── MemoSection
├── ActivityLog                 (chronological ActivityEvent list)
└── EditButton → /invoices/:id/edit
```

**Record Payment modal:** local `useState` in `InvoiceDetailPage`. Contains a `PaidDateField` (date input + "Today" button). On confirm → calls `useTransitionInvoice`.

#### Create / Edit Form

Both use the same `InvoiceForm` component with `mode: "create" | "edit"` and optional `defaultValues`.

```
InvoiceForm
├── [Invoice Details section]
│   ├── invoiceNumber (TextInput — pre-filled, editable)
│   ├── customerName, billingEmail, billingAddress
│   ├── currency (Select), paymentTerms (Select)
│   └── issueDate, dueDate (DateInput)
├── [Line Items section]
│   └── LineItemsFieldArray
│       └── LineItemRow × n
│           ├── description, quantity, unitPrice, accountCode (AccountCodeCombobox)
│           └── computed amount (read-only, from useDerivedTotals)
│       └── "Add line item" Button
├── [Financials section]
│   ├── discount (NumberInput), taxRate (NumberInput, % display)
│   └── TotalsPanel (live: subtotal / discount / tax / total)
├── memo (Textarea)
└── [Cancel | Save]
```

`NeedsReviewHighlight` wraps individual fields when the LLM has flagged them — amber left-border + tooltip ("Flagged for review by Invoice Assistant").

### 4.3 State Management

| Concern | Solution | Rationale |
|---|---|---|
| Server data (list, single invoice) | TanStack Query | Caching, background refetch, optimistic updates |
| CRUD mutations | TanStack Query `useMutation` | Integrates with query invalidation |
| List UI state (sort, voided toggle, filter) | `InvoiceUIContext` + `useReducer` | Persists across navigations; shared by table + summary bar |
| Toast notifications | `NotificationContext` + `useReducer` | Global; triggered from mutation callbacks |
| Form state | React Hook Form | Local to form component |
| Modal open/close | Local `useState` in parent | Ephemeral, not shared |
| LLM draft + needsReview | Parent page `useState`, passed as props | Single consumer; no need for context |

### 4.4 TanStack Query Keys and Invalidation

```typescript
const queryKeys = {
  list: (includeVoided: boolean) => ["invoices", { includeVoided }] as const,
  detail: (id: string) => ["invoices", id] as const,
  nextNumber: () => ["invoices", "nextNumber"] as const,
};
```

**Invalidation rules:**
- `createInvoice` → invalidate `["invoices"]` (all variants) + `["invoices", "nextNumber"]`
- `updateInvoice` → invalidate `["invoices", id]` + `["invoices"]`
- `transitionInvoice` → invalidate `["invoices", id]` + `["invoices"]`
- `voidInvoice` → invalidate both

`queryClient.invalidateQueries({ queryKey: ["invoices"], exact: false })` handles all list variants simultaneously.

**staleTime:** 30s for detail, 10s for list.

### 4.5 Form Architecture

```typescript
const { control, register, handleSubmit, watch, setValue, formState } = useForm<CreateInvoiceInput>({
  resolver: zodResolver(mode === "create" ? CreateInvoiceSchema : UpdateInvoiceSchema),
  defaultValues: buildDefaultValues(defaultInvoice, nextNumber),
});
```

Line items use `useFieldArray`:

```typescript
const { fields, append, remove } = useFieldArray({ control, name: "lineItems" });
```

The "add row" button appends a default `LineItem` with a `nanoid` id. Remove has no confirmation — line items are easily re-added.

### 4.6 Derived Totals

`useDerivedTotals` watches the form and re-computes on every change:

```typescript
export function useDerivedTotals(control: Control<CreateInvoiceInput>): DerivedTotals {
  const [lineItems, discount, taxRate] = useWatch({
    control,
    name: ["lineItems", "discount", "taxRate"],
  });
  return useMemo(() => computeTotals(lineItems, discount, taxRate), [lineItems, discount, taxRate]);
}
```

`computeTotals` is the same function used server-side (imported from `shared/` or duplicated in `client/src/lib/totals.ts`). Totals are never persisted.

---

## 5. API Contract

All endpoints under `/api`. Errors: `{ error: string, code?: string, issues?: Record<string, string[]> }`.

### `GET /api/invoices`

**Query:** `includeVoided=true|false` (default: `false`)

**Response 200:**
```typescript
{
  data: InvoiceListItem[]; // sorted by updatedAt DESC
  meta: { total: number; voided: number };
}
```

`InvoiceListItem` omits `lineItems`, `activity`, and `memo`.

### `POST /api/invoices`

**Body:** `CreateInvoiceSchema`

**Response 201:** `{ data: Invoice }`

Server assigns `id`, `status: "Draft"`, `paymentStatus: "Unsent"`, `createdAt`, `updatedAt`, appends "Created invoice" activity event.

### `GET /api/invoices/next-number`

**Response 200:** `{ invoiceNumber: string }` — e.g. `"INV-2026-0415"`

Does not reserve the number.

### `GET /api/invoices/:id`

**Response 200:** `{ data: Invoice }`
**Response 404:** `{ error: "Invoice not found" }`

### `PATCH /api/invoices/:id`

**Body:** `UpdateInvoiceSchema` (partial)

`status` and `paymentStatus` are ignored if passed — use the transition endpoint for status changes.

**Response 200:** `{ data: Invoice }`

### `POST /api/invoices/:id/transition`

**Body:**
```typescript
{
  action: "send" | "recordPayment" | "recordPartialPayment" | "void";
  paidDate?: string;    // required for recordPayment
  amountPaid?: number;  // required for recordPartialPayment
  actor?: string;       // defaults to DEFAULT_ACTOR
}
```

**Transition table:**

| Current | Action | New Status | New PaymentStatus | Activity appended |
|---|---|---|---|---|
| Draft | send | Sent | Open | "Sent invoice to customer" |
| Sent | recordPayment | Paid | Paid | "Recorded payment" |
| Draft or Sent | void | Void | Voided | "Voided invoice" |
| Sent or Partial (payment) | recordPartialPayment | Sent | Partial | "Recorded partial payment of $X" |

**Response 200:** `{ data: Invoice }`
**Response 409:** `{ error: "Invalid transition", code: "INVALID_TRANSITION" }`

### `DELETE /api/invoices/:id`

Voids the invoice. Equivalent to `POST /transition` with `action: "void"` but exposed as DELETE for REST semantics. Does not physically remove the row.

**Response 200:** `{ data: Invoice }`

### `POST /api/assistant/parse`

**Body:** `{ text: string }` (1–4000 chars)

**Response 200:**
```typescript
{
  draft: Partial<CreateInvoiceInput>;
  needsReview: string[]; // field names model was uncertain about
}
```

**Response 422:** `{ error: "Assistant could not parse a valid invoice draft", raw?: string }`

---

## 6. LLM Integration

### 6.1 Architecture

Fully server-side. Client sends raw text to `POST /api/assistant/parse`; server calls Anthropic and returns a validated draft. `ANTHROPIC_API_KEY` never reaches the browser.

### 6.2 Prompt Design

**System prompt:**
```
You are an invoice data extractor for Northstar Metrics, a B2B SaaS company.
Extract invoice fields from the user's text and return ONLY a JSON object:
  { draft: <invoice fields>, needsReview: <array of uncertain field names> }

Rules:
- Dates: ISO 8601 (YYYY-MM-DD)
- currency: ISO 4217 (default USD if unspecified)
- taxRate: decimal (0.085 for 8.5%)
- discount: flat dollar amount
- paymentTerms: one of "Net 15", "Net 30", "Net 45", "Due on receipt"
- lineItems: array with description, quantity, unitPrice, accountCode
- If a field is uncertain, omit it and add the field name to needsReview
- Return only JSON, no prose

Known account codes:
  4000 = Subscription Revenue
  4010 = Usage Revenue
  4100 = Professional Services
  4200 = Advisory Services
  4300 = Support Revenue
```

Model: `claude-haiku-4-5` (cost-efficient; sufficient for structured extraction).

### 6.3 Response Validation

```typescript
const AssistantDraftResponseSchema = z.object({
  draft: CreateInvoiceSchema.partial(),
  needsReview: z.array(z.string()).default([]),
});
```

Raw LLM text → `JSON.parse` (try/catch) → `AssistantDraftResponseSchema.safeParse`. On failure → 422 with raw response in development.

### 6.4 Mock Mode

When `LLM_MOCK=true`:
1. Reads `invoices.json`, selects from `bonusLlmExamples`.
2. Matches input text prefix (first 30 chars) against stored `input`; falls back to index 0.
3. Returns a deterministic `AssistantDraft` using the matching example's `expectedDraftFields`.
4. Optional 500ms simulated delay for realistic UX testing.

The `prompt-2` mock intentionally includes `taxRate` and `discount` in `needsReview` to exercise the amber-highlight UI path.

### 6.5 Client-Side LLM Flow

```
CreateInvoicePage
├── state: assistantDraft, needsReview
├── AssistantDrawer (Mantine Drawer, triggered by "Import from text" button)
│   └── AssistantForm
│       ├── Textarea
│       ├── Submit → useAssistantParse mutation
│       │   onSuccess: close drawer, setAssistantDraft(result)
│       │   onError: ErrorAlert inside drawer
│       └── LoadingSpinner
└── InvoiceForm
    ├── defaultValues ← assistantDraft.draft (applied via reset())
    └── needsReview prop → NeedsReviewHighlight on flagged fields
```

`.env.example`:
```
ANTHROPIC_API_KEY=
LLM_MOCK=false
PORT=3001
DB_PATH=./data/rillet.db
```

---

## 7. Testing Strategy

### 7.1 Unit Tests (Vitest, no DOM)

- `shared/totals.ts` — `computeTotals()`: zero items, zero tax, discount > subtotal, large decimal quantities (the 1,480,000-event usage overage case)
- `client/src/lib/fxRates.ts` — `convertToUSD()`: each known currency, unknown currency fallback
- `shared/schemas.ts` — valid payloads pass, invalid payloads produce expected field-level errors
- `server/src/services/invoiceNumber.ts` — generation with various existing numbers including year boundary

### 7.2 Component Tests (Vitest + RTL)

- `InvoiceForm` — required fields rendered, validation errors on empty submit, add/remove line items, derived totals update live
- `ConfirmModal` — calls `onConfirm` on confirm, calls `onCancel` on cancel, does not call `onConfirm` on dismiss
- `InvoiceTable` — renders rows from mock data, overdue row has visual indicator, voided rows hidden by default

### 7.3 Integration Tests (Vitest + RTL + fetch mock)

- Create flow: fill form → submit → mock POST success → invoice appears (query invalidation)
- Edit flow: form pre-populates with existing data → partial update → detail view reflects change

### 7.4 Infrastructure

`client/src/test/setup.ts` imports `@testing-library/jest-dom`. `QueryClient` in tests uses `retry: false`, `gcTime: 0`. API calls mocked with `vi.fn()` on the fetch layer.

### 7.5 Coverage Goals

- `computeTotals`, `convertToUSD`: 100% branch coverage (trust-critical pure functions)
- Form validation: happy path + at least 3 invalid cases per field group
- `ConfirmModal`: all interactive states

---

## 8. Key Design Decisions and Tradeoffs

### 8.1 JSON Columns for LineItems and Activity

**Decision:** JSON text columns in SQLite for both.

**For:** Always read/written atomically with the invoice. No independent query requirements. Zero join complexity. DB is trivially inspectable via `sqlite3` CLI. Append-only (activity) and replace-wholesale (lineItems) semantics map cleanly.

**Against:** Cannot be efficiently filtered or aggregated at SQL level. If a future requirement needed "all line items with account code 4000 across all invoices", a separate `line_items` table would be needed. Acceptable for this scope.

### 8.2 Void-Only Delete

**Decision:** `DELETE /api/invoices/:id` voids, never removes.

**For:** Preserves full audit trail. A hard-deleted invoice leaves an unexplainable gap in the invoice number sequence. Voiding preserves the record, actor, and timestamp — the correct accounting primitive. List hides voided invoices by default.

**Against:** List accumulates voided records over time. Mitigated by the voided toggle (hidden by default, shown with a count badge).

### 8.3 Status Machine Server-Side

**Decision:** Transition logic lives in `invoiceService.ts`, enforced server-side. The client only renders buttons for valid transitions.

**For:** Client-side enforcement is UX; server-side is correctness. The server rejects any invalid transition with 409 regardless of client behavior. Prevents state corruption from direct API calls.

### 8.4 Shared Types Without a Build Step

**Decision:** `shared/` imported via TS `paths` alias. No separate npm package.

**For:** A proper shared workspace package adds significant setup overhead for this scope. The paths alias approach works with `tsx` on the server and Vite on the client.

**Against:** Shared directory is not independently publishable or versioned. Acceptable here; trivial to extract into a proper package later.

### 8.5 React Context + useReducer (No Zustand)

**Decision:** Two thin context providers for the narrow global state needed.

**For:** No third-party dependency. Explicit typed action unions make state transitions predictable and testable. The shared state surface is small — voided toggle, sort state, toast queue.

### 8.6 TanStack Router Loaders for Prefetching

**Decision:** Route `loader` calls `queryClient.ensureQueryData` for detail and edit pages.

**For:** Without loaders, the edit form renders with empty `defaultValues` then needs a `reset()` after data arrives — bad UX. Loaders ensure data is in cache before mount, so `defaultValues` is always correct on first render. Also enables TanStack Router's `pendingComponent` skeleton during navigation.

### 8.7 Hardcoded Actor Identity

**Decision:** `DEFAULT_ACTOR = "Maya Chen"`, `SYSTEM_ACTOR = "Rillet automation"` — no auth.

**For:** Single-user app per requirements. Using named actors rather than "Unknown" makes the activity log realistic, consistent with seed data, and immediately demo-able.

### 8.8 Static FX Rates

**Decision:** Hardcoded in `shared/constants.ts`, shown with `~` prefix in UI.

**For:** Real-time FX APIs are out of scope. The `~` prefix makes the approximation transparent. No external dependencies required.

### 8.9 Dedicated Transition Endpoint

**Decision:** `POST /api/invoices/:id/transition` instead of accepting `status` in PATCH.

**For:** Transitions have distinct side effects (activity events, conditional required fields, guard logic) that don't belong in a generic field-update endpoint. The API surface is explicit: only named transitions are possible, not arbitrary status values. The PATCH endpoint ignores `status`/`paymentStatus` if passed.
