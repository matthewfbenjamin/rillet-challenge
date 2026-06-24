# Rillet Invoice Workspace — Implementation Plan

## Phase 1: Project Scaffolding

**Goal:** Working monorepo with both dev servers running, path aliases resolving, and Biome enforcing code style.

1. Initialize root `package.json` with workspaces (`client`, `server`, `shared`) and root-level scripts: `dev` (runs both servers concurrently), `build`, `lint`, `test`
2. Scaffold `server/` — `package.json` with deps: `express`, `better-sqlite3`, `zod`, `nanoid`, `@anthropic-ai/sdk`, `dotenv`, `cors`; devDeps: `tsx`, `typescript`, `@types/express`, `@types/better-sqlite3`
3. Scaffold `client/` — Vite + React 19 via `npm create vite`, add deps: `@tanstack/react-router`, `@tanstack/react-query`, `@mantine/core`, `@mantine/hooks`, `@mantine/dates`, `@hookform/resolvers`, `react-hook-form`, `zod`, `nanoid`
4. Configure `server/tsconfig.json`: strict mode, `paths: { "~shared/*": ["../shared/*"] }`, `module: NodeNext`
5. Configure `client/tsconfig.json`: strict mode, same `~shared` paths alias
6. Configure `client/vite.config.ts`: `resolve.alias` for `~shared`, dev proxy `/api → http://localhost:3001`
7. Add `biome.json` at repo root covering all three packages; add `lint` and `format` scripts
8. Create `server/.env.example`: `PORT=3001`, `DB_PATH=./data/rillet.db`, `ANTHROPIC_API_KEY=`, `LLM_MOCK=false`
9. Add `.gitignore`: `node_modules`, `server/data/rillet.db`, `.env`, `client/dist`
10. Verify: `yarn dev` starts both servers, `~shared` import resolves in a smoke-test file on each side

---

## Phase 2: Shared Layer

**Goal:** All types, Zod schemas, constants, and the `computeTotals` pure function are defined and tested.

1. Write `shared/types.ts`: `InvoiceStatus`, `PaymentStatus` (`"Unsent" | "Open" | "Partial" | "Overdue" | "Paid" | "Voided"` — note: `Overdue` is derived, never stored), `LineItem`, `ActivityEvent`, `Invoice` (includes `amountPaid?: number`), `InvoiceListItem` (Omit lineItems/activity/memo), `DerivedTotals`, `AssistantDraft`
2. Write `shared/schemas.ts`: `LineItemSchema`, `CreateInvoiceSchema` (includes `amountPaid: z.number().min(0).optional()`), `UpdateInvoiceSchema` (`.partial()`), `TransitionSchema` (with `.superRefine` for two validations: `paidDate` required for `recordPayment`; `amountPaid` required for `recordPartialPayment`; action enum includes `"recordPartialPayment"`), `AssistantParseRequestSchema`
3. Write `shared/constants.ts`: `KNOWN_ACCOUNT_CODES`, `PAYMENT_TERMS_OPTIONS`, `STATUS_TRANSITIONS` map (includes `Partial: ["recordPayment", "void"]` and `Sent` includes `"recordPartialPayment"`), `FX_RATES_TO_USD`, `DEFAULT_ACTOR`, `SYSTEM_ACTOR`
4. Write `server/src/lib/totals.ts`: `computeTotals(lineItems, discount, taxRate): DerivedTotals` — subtotal, discounted, tax, total
5. **[TEST]** Write `client/src/test/unit/totals.test.ts`: zero items, zero tax, discount > subtotal, large decimal quantities (1,480,000 events × $0.012), rounding edge cases
6. **[TEST]** Write `client/src/test/unit/schemas.test.ts`: valid `CreateInvoiceSchema` passes; missing required fields fail with correct field-level errors; `TransitionSchema` refine fires when action=recordPayment and paidDate absent

> **Note:** The project is ESM-only. Set `"type": "module"` in both `server/package.json` and `client/package.json`. Use `import`/`export` everywhere — no `require()`. This is the correct approach for `nanoid` v4+ and aligns with `module: NodeNext` in `server/tsconfig.json`. Any deps that are CJS-only will need a wrapper or replacement.

> **Overdue is a derived paymentStatus.** Store `Open` in the DB; the service layer computes `Overdue` on read when `dueDate < today && paymentStatus === 'Open'`. Similarly, `Partial` is stored directly in the DB when a partial payment is recorded.

---

## Phase 3: Database & Server Foundation

**Goal:** SQLite DB initializes, seed data loads, Express app runs with error handling.

1. Write `server/src/db/database.ts`: open/create SQLite file at `DB_PATH`, export singleton `db`
2. Write `server/src/db/schema.ts`: `initializeSchema(db)` — runs `CREATE TABLE IF NOT EXISTS invoices` DDL with all columns including JSON `lineItems` and `activity` columns, and `amountPaid REAL` (nullable); creates indexes on `status`, `dueDate`, `updatedAt`
3. Write `server/src/db/seed.ts`: check `COUNT(*)`, if 0 read `invoices.json` from repo root, map to DB rows (serialize lineItems/activity to JSON strings, derive `createdAt`/`updatedAt` from first activity timestamp), insert in a transaction
4. Write `server/src/middleware/validateBody.ts`: generic Zod middleware factory
5. Write `server/src/middleware/errorHandler.ts`: 404 handler + final error handler → `{ error, code?, issues? }`
6. Write `server/src/app.ts`: Express factory — JSON middleware, CORS (dev), mount routers (stubs for now), error handler
7. Write `server/src/index.ts`: call `initializeSchema`, `seed`, start listening on PORT
8. Verify: `tsx src/index.ts` starts cleanly, DB file created, seed data queryable via `sqlite3` CLI

> **Gotcha:** `better-sqlite3` is synchronous — never use it inside async middleware. All DB calls are blocking; that's intentional and correct for this use case.

---

## Phase 4: Invoice API

**Goal:** All REST endpoints implemented, validated, and manually testable via curl/Postman.

1. Write `server/src/services/invoiceNumber.ts`: fetch all `invoiceNumber` values, parse numeric suffix as integer (not lexicographic — `"10000" < "9999"` lexicographically), find max, increment, `String(n).padStart(4, '0')`, prefix `INV-{year}-`
2. Write `server/src/services/invoiceService.ts`:
   - `listInvoices(includeVoided)` — SELECT all columns except lineItems/activity for list perf; parse JSON for response; filter voided unless flag set; sort by updatedAt DESC; return with meta counts; **compute Overdue on read**: after fetching, if `dueDate < today && paymentStatus === "Open"`, set `paymentStatus` to `"Overdue"` in the returned object
   - `getInvoiceById(id)` — SELECT *, parse JSON columns, return full Invoice or null; **compute Overdue on read**: same derivation as listInvoices
   - `createInvoice(data, actor)` — generate id (nanoid), call invoiceNumber service, set status/paymentStatus defaults, append first activity event, INSERT
   - `updateInvoice(id, data, actor)` — validate exists, merge fields, append "Updated invoice" activity, UPDATE, return full invoice
   - `transitionInvoice(id, action, actor, paidDate?, amountPaid?)` — validate transition allowed per `STATUS_TRANSITIONS`, build new status/paymentStatus, append descriptive activity event, UPDATE; handle `recordPartialPayment` → set `paymentStatus: "Partial"`, store `amountPaid`
   - `voidInvoice(id, actor)` — convenience wrapper around transitionInvoice with action="void"
3. Write `server/src/routes/invoices.ts`: wire all 7 endpoints to service methods with `validateBody` middleware on POST/PATCH
4. Write `server/src/routes/assistant.ts`: stub returning `{ draft: {}, needsReview: [] }` for now
5. Mount both routers in `app.ts`
6. **[TEST]** Manual verification: curl each endpoint — list, get, create, update, transition (send, recordPayment, void), delete (void), next-number; confirm 409 on invalid transitions, 404 on unknown ID, 400 on bad body

> **Gotcha:** `GET /api/invoices/next-number` must be declared **before** `GET /api/invoices/:id` in the router, or Express will match `"next-number"` as an invoice ID param.

> **Gotcha:** `listInvoices` should SELECT individual columns explicitly (not `SELECT *`) to avoid sending large JSON blobs for line items and activity on every list request.

---

## Phase 5: Frontend Foundation

**Goal:** Client app renders, routing works, Mantine themed, QueryClient wired, dev proxy confirmed.

1. Write `client/src/lib/queryClient.ts`: `QueryClient` singleton with `staleTime: 30_000` for detail, `10_000` for list (set via `defaultOptions` or per-query)
2. Write `client/src/main.tsx`: wrap app in `MantineProvider` (custom theme — neutral finance palette: slate grays, subtle blue accent), `QueryClientProvider`, `RouterProvider`
3. Define Mantine theme: typography (tabular numbers for financial amounts via `fontFeatures`), color scheme, default radius, consistent spacing
4. Write `client/src/routes/__root.tsx`: Mantine `AppShell` with header (wordmark left, "New Invoice" button right), `<Outlet />`
5. Write `client/src/routes/index.tsx`: redirect to `/invoices`
6. Write stub route files for `/invoices`, `/invoices/new`, `/invoices/$invoiceId/index`, `/invoices/$invoiceId/edit` — each rendering a placeholder `<div>`
7. Run TanStack Router codegen (`tsr generate`) to produce `routeTree.gen.ts`
8. Write `client/src/lib/formatters.ts`: `formatCurrency(amount, currency)` using `Intl.NumberFormat`, `formatDate(iso)`, `formatRelativeDate(iso)` (e.g. "3 days ago")
9. Write `client/src/lib/fxRates.ts`: `convertToUSD(amount, currency)` using `FX_RATES_TO_USD`; returns `null` for unknown currencies
10. **[TEST]** Write `client/src/test/unit/fxRates.test.ts`: USD, CAD, GBP conversions; unknown currency returns null
11. Verify: app loads at localhost:5173, navigation between stub routes works, `/api/invoices` proxied correctly (check Network tab)

---

## Phase 6: Invoice List View

**Goal:** `/invoices` shows a fully functional sortable table with status/payment badges, due date risk, currency formatting, summary bar, and voided toggle.

1. Write `client/src/context/InvoiceUIContext.tsx`: reducer with actions `SET_SORT`, `TOGGLE_VOIDED`, `SET_FILTER`; initial state: `sortCol: "dueDate"`, `sortDir: "asc"`, `showVoided: false`; export `useInvoiceUI` hook
2. Write `client/src/hooks/useInvoices.ts`: TanStack Query wrapping `GET /api/invoices?includeVoided=...`; reads `showVoided` from `InvoiceUIContext`
3. Write `client/src/components/common/CurrencyDisplay.tsx`: wraps `formatCurrency`, applies `fontVariantNumeric: "tabular-nums"` for alignment
4. Write `client/src/components/invoice-list/StatusBadge.tsx`: Mantine `Badge` — Draft=gray, Sent=blue, Paid=green, Void=red/dimmed
5. Write `client/src/components/invoice-list/PaymentStatusBadge.tsx`: distinct palette — Unsent=gray, Open=blue, Overdue=orange/red, Paid=green, Voided=dimmed
6. Write `client/src/components/invoice-list/DueDateCell.tsx`: red text + warning icon when `dueDate < today` and `paymentStatus` is not Paid/Voided
7. Write `client/src/components/invoice-list/AmountCell.tsx`: `CurrencyDisplay` + optional USD equivalent in smaller text for non-USD invoices
8. Write `client/src/components/invoice-list/ListSummaryBar.tsx`: aggregate USD-equivalent totals by payment status (Open, Overdue, Paid); `~` prefix on converted amounts; note "Approximate USD conversion"
9. Write `client/src/components/invoice-list/EmptyInvoiceState.tsx`: centered illustration/icon + "No invoices yet" + "Create invoice" CTA
10. Write `client/src/components/invoice-list/InvoiceTableRow.tsx`: full row with all cells, click navigates to detail
11. Write `client/src/components/invoice-list/InvoiceTable.tsx`: sortable column headers (click dispatches `SET_SORT`), renders rows, loading skeleton (Mantine `Skeleton`), empty state
12. Wire `InvoiceListPage` (`routes/invoices/index.tsx`): voided toggle + count badge above table, `ListSummaryBar`, `InvoiceTable`, "New Invoice" button linking to `/invoices/new`
13. **[TEST]** Write `InvoiceList.test.tsx`: renders rows from mock data, overdue row has risk indicator, voided rows hidden by default, voided toggle shows them

---

## Phase 7: Invoice Detail View

**Goal:** `/invoices/:id` shows complete invoice with all sections and is navigable from the list.

1. Write `client/src/hooks/useInvoice.ts`: TanStack Query wrapping `GET /api/invoices/:id`
2. Add route loader to `$invoiceId/index.tsx`: `queryClient.ensureQueryData(invoiceQueryOptions(id))` so data is in cache before mount
3. Write `client/src/components/invoice-detail/InvoiceDetailHeader.tsx`: invoice number (monospace), customer name, status + payment status badges, issue/due/paid dates
4. Write `client/src/components/invoice-detail/InvoiceDetailMeta.tsx`: billing email, billing address, payment terms, currency — two-column grid layout
5. Write `client/src/components/invoice-detail/LineItemsTable.tsx`: read-only Mantine `Table` — description, qty, unit price, amount (qty × unitPrice), account code; right-aligned numerics
6. Write `client/src/components/invoice-detail/FinancialsSummary.tsx`: subtotal, discount (shown as `-$X` if > 0), tax rate + tax amount, **total** (bold, larger); computed client-side from `lineItems`/`discount`/`taxRate` via `computeTotals`
7. Write `client/src/components/invoice-detail/ActivityLog.tsx`: chronological list — timestamp (relative + absolute on hover), actor, action; system actor visually distinguished
8. Write `client/src/components/invoice-detail/ActionButtons.tsx`: stub for now (fully wired in Phase 12)
9. Wire `InvoiceDetailPage`: compose all sections, Edit button → navigate to edit route, loading skeleton, 404 error state

---

## Phase 8: Invoice Form

**Goal:** A single `InvoiceForm` component usable for both create and edit, with dynamic line items and live totals.

1. Write `client/src/hooks/useDerivedTotals.ts`: `useWatch` on `["lineItems", "discount", "taxRate"]`, memoized `computeTotals` call
2. Write `client/src/components/invoice-form/AccountCodeCombobox.tsx`: Mantine `Combobox` — options from `KNOWN_ACCOUNT_CODES`, free-text entry allowed for unknown codes
3. Write `client/src/components/invoice-form/PaidDateField.tsx`: Mantine `DateInput` with a "Today" `ActionIcon` button that calls `setValue("paidDate", today)`; only rendered when relevant (passed as a prop or used in the Record Payment modal)
4. Write `client/src/components/invoice-form/TotalsPanel.tsx`: reads `useDerivedTotals`, renders live subtotal / discount / tax / total; updates on every keystroke
5. Write `client/src/components/invoice-form/LineItemRow.tsx`: description `TextInput`, quantity `NumberInput`, unitPrice `NumberInput`, `AccountCodeCombobox`, computed amount (read-only), remove button
6. Write `client/src/components/invoice-form/LineItemsFieldArray.tsx`: `useFieldArray` — renders `LineItemRow` per field, "Add line item" button appends a blank row with nanoid id, minimum 1 row enforced via Zod
7. Write `client/src/components/invoice-form/NeedsReviewHighlight.tsx`: wrapper that adds amber left-border styling + Mantine `Tooltip` ("Flagged for review by Invoice Assistant") when `flagged` prop is true
8. Write `client/src/components/invoice-form/InvoiceForm.tsx`:
   - Props: `mode: "create" | "edit"`, `defaultValues?`, `onSubmit`, `needsReview?: string[]`, `isSubmitting`
   - `useForm` with `zodResolver`, `defaultValues` from props
   - Three sections: Invoice Details, Line Items, Financials + Memo
   - `NeedsReviewHighlight` wrapping fields present in `needsReview`
   - Cancel button navigates back; Save button calls `handleSubmit(onSubmit)`
   - Inline validation errors below each field (Mantine `error` prop)
9. **[TEST]** Write `InvoiceForm.test.tsx`: required fields show errors on empty submit, line item add/remove works, derived totals update when quantity changes, `needsReview` fields get amber highlight

---

## Phase 9: Create Flow

**Goal:** `/invoices/new` creates an invoice and redirects to the detail view.

1. Write `client/src/hooks/useCreateInvoice.ts`: `useMutation` wrapping `POST /api/invoices`; `onSuccess` invalidates `["invoices"]` and `["invoices", "nextNumber"]`
2. Add `GET /api/invoices/next-number` query hook — fetched on mount to pre-populate `invoiceNumber` field
3. Wire `CreateInvoicePage` (`routes/invoices/new.tsx`): fetch next number, render `InvoiceForm` in create mode, `onSubmit` calls `useCreateInvoice`, on success navigate to `/invoices/:newId`
4. Write `client/src/context/NotificationContext.tsx`: reducer for toast queue; `useNotification()` hook exposes `notify(message, type)`; integrate Mantine `notifications` package
5. Add success toast on create ("Invoice INV-2026-XXXX created"), error toast on failure
6. Verify end-to-end: create an invoice, confirm it appears in list and detail view

---

## Phase 10: Edit Flow

**Goal:** `/invoices/:id/edit` pre-populates the form and saves changes.

1. Write `client/src/hooks/useUpdateInvoice.ts`: `useMutation` wrapping `PATCH /api/invoices/:id`; `onSuccess` invalidates detail + list queries
2. Add route loader to `$invoiceId/edit.tsx`: `queryClient.ensureQueryData` so form is never empty on mount
3. Wire `EditInvoicePage`: load invoice from cache (via loader), pass as `defaultValues` to `InvoiceForm` in edit mode, `onSubmit` calls `useUpdateInvoice`, on success navigate back to detail view
4. Add success/error toasts
5. Verify: navigate to edit, all fields pre-populated, save updates detail view and activity log

---

## Phase 11: Delete / Void Flow

**Goal:** Voiding an invoice requires explicit confirmation and gives clear feedback.

1. Write `client/src/components/common/ConfirmModal.tsx`: Mantine `Modal` — title, body message, cancel + confirm buttons; confirm button styled destructively (red); accepts `onConfirm`, `onCancel`, `isLoading` props
2. Write `client/src/hooks/useVoidInvoice.ts`: `useMutation` wrapping `DELETE /api/invoices/:id`; `onSuccess` invalidates detail + list queries
3. Add void button to `InvoiceDetailPage` (not `ActionButtons` — that's for transitions): opens `ConfirmModal` with message "This will void INV-XXXX and cannot be undone. The invoice will remain in your records for audit purposes."
4. On confirm: call `useVoidInvoice`; on success navigate to `/invoices`, show "Invoice voided" toast
5. Verify voided invoice: appears in list only with "Show voided" toggle on, detail view shows Void status, activity log shows void event
6. **[TEST]** Write `ConfirmModal.test.tsx`: calls `onConfirm` on confirm click, calls `onCancel` on cancel, does not call `onConfirm` on backdrop dismiss

---

## Phase 12: Status Transitions

**Goal:** Action buttons on detail view drive status machine transitions with proper guards.

1. Write `client/src/hooks/useTransitionInvoice.ts`: `useMutation` wrapping `POST /api/invoices/:id/transition`; `onSuccess` invalidates detail + list
2. Write Record Payment modal: local `useState` in `InvoiceDetailPage`, contains `PaidDateField` (date input + "Today" button), confirm calls `useTransitionInvoice({ action: "recordPayment", paidDate })`
3. Wire `ActionButtons.tsx`:
   - Read `STATUS_TRANSITIONS[invoice.status]` to determine which buttons to render
   - "Mark as Sent" → confirm (no modal needed, low risk) → `useTransitionInvoice({ action: "send" })`
   - "Record Payment" → open paid date modal → `useTransitionInvoice({ action: "recordPayment", paidDate })`
   - No void button here — that lives separately (Phase 11)
4. Verify all valid transitions: Draft→Sent, Sent→Paid; confirm Paid and Void invoices show no action buttons; confirm activity log updates after each transition

---

## Phase 13: LLM Invoice Assistant

**Goal:** User pastes unstructured text, server calls Claude Haiku, structured draft pre-populates the create form with uncertain fields highlighted.

1. Write `server/src/services/assistantService.ts`:
   - Read `LLM_MOCK` env var
   - **Live mode:** Anthropic SDK call with system prompt (extractor persona, JSON-only output, account code hints), user message = input text, model = `claude-haiku-4-5`
   - **Mock mode:** Read `bonusLlmExamples` from `invoices.json`, match first 30 chars of input, return deterministic `AssistantDraft`; `prompt-2` mock must include `taxRate` and `discount` in `needsReview`
   - Validate raw LLM response: `JSON.parse` → `AssistantDraftResponseSchema.safeParse`; on failure throw structured error with raw string
2. Wire `server/src/routes/assistant.ts`: `validateBody(AssistantParseRequestSchema)`, call `assistantService.parseInvoiceFromText`, return draft or 422 on parse failure
3. Write `client/src/hooks/useAssistantParse.ts`: `useMutation` wrapping `POST /api/assistant/parse`
4. Write `client/src/components/assistant/AssistantForm.tsx`: `Textarea` (placeholder: "Paste an email, Slack message, or billing note…"), Submit button, loading spinner, error alert on 422
5. Write `client/src/components/assistant/AssistantDrawer.tsx`: Mantine `Drawer` (right side), contains `AssistantForm`; `onSuccess` closes drawer and calls `onDraftReceived(draft)`
6. Update `CreateInvoicePage`:
   - Add "Import from text" button in header area → opens `AssistantDrawer`
   - `onDraftReceived`: call `reset(draft.draft)` on the form, store `draft.needsReview` in page state
   - Pass `needsReview` down to `InvoiceForm` → `NeedsReviewHighlight` on flagged fields
7. Verify mock mode end-to-end: `LLM_MOCK=true`, paste text from `bonusLlmExamples[1]`, confirm form pre-populates, `taxRate` and `discount` fields show amber highlight

> **Security:** Never log the full API key. Validate `ANTHROPIC_API_KEY` is set at server startup — log a warning (not an error) if absent so mock mode still works.

---

## Phase 14: Testing

**Goal:** Meaningful test coverage on trust-critical logic and key interactions.

1. Finalize `client/src/test/unit/totals.test.ts` (from Phase 2) — ensure all edge cases covered
2. Finalize `client/src/test/unit/fxRates.test.ts` (from Phase 5)
3. Finalize `client/src/test/unit/schemas.test.ts` (from Phase 2)
4. Finalize `client/src/test/integration/InvoiceForm.test.tsx` (from Phase 8)
5. Finalize `client/src/test/integration/InvoiceList.test.tsx` (from Phase 6)
6. Finalize `client/src/test/integration/ConfirmModal.test.tsx` (from Phase 11)
7. Add `vitest.config.ts` to client with `jsdom` environment, `globals: true`, setup file pointing to `test/setup.ts`
8. Write `test/setup.ts`: import `@testing-library/jest-dom`; configure `QueryClient` with `retry: false`, `gcTime: 0`
9. Run full test suite; fix any failures; confirm coverage on `computeTotals` and `convertToUSD` is 100% branch

---

## Phase 15: Polish & Responsive

**Goal:** Loading/empty/error states complete, mobile layout usable, accessibility solid, app ready to demo.

1. **Loading states:** Add Mantine `Skeleton` to list table rows while fetching; `LoadingOverlay` on form submit; spinner in action buttons while mutation is in-flight
2. **Error states:** 404 page for unknown invoice IDs; `ErrorAlert` component for failed fetches with retry button; network error toast on mutation failure
3. **Empty state:** `EmptyInvoiceState` shows when invoice list is empty (new DB); includes "Create your first invoice" CTA
4. **Responsive layout:**
   - List: on mobile, collapse to card-style rows or horizontal scroll with pinned customer/amount columns
   - Detail: stack two-column meta into single column; ensure action buttons are full-width on small screens
   - Form: single-column layout below md breakpoint; line items table scrolls horizontally
5. **Accessibility:**
   - Invoice table: `<th scope="col">` on all headers, `role="status"` on loading state
   - Confirm modal: focus trap (Mantine handles this), correct `aria-labelledby`
   - Action buttons: `aria-label` on icon-only buttons, `aria-busy` on loading states
   - Color: verify overdue red and amber review highlights meet WCAG AA contrast (don't rely on color alone — add icon)
6. **Financial formatting:** Ensure all currency amounts use tabular numerals (`fontVariantNumeric: "tabular-nums"`) so columns align correctly
7. **Edge cases:**
   - Invoice with discount > subtotal (negative discounted amount — clamp to 0 or show warning)
   - Invoice with no memo — hide memo section rather than showing empty box
   - Very long customer names — truncate with `title` tooltip in table cells
   - Zero-tax invoices — hide tax row in financials summary
8. **Final README:** Concise overview of design decisions, backend persistence approach, LLM integration, how to run locally, known tradeoffs

---

## Cross-Cutting Concerns

- **Activity log discipline:** Every mutation (create, update, transition, void) must append an `ActivityEvent`. Double-check this in `invoiceService.ts` — it's easy to forget on the update path.
- **Derived totals never stored:** `computeTotals` is the only source of truth. The server does not store subtotal/tax/total columns. The client computes them for display. If the server ever needs to validate totals (e.g. for the assistant draft), it calls `computeTotals` inline.
- **nanoid for IDs:** Every `id` (invoices, line items, activity events) uses `nanoid()`. Never use sequential integers as public IDs.
- **Invoice number integer parsing:** In `invoiceNumber.ts`, always extract and compare the suffix as `parseInt(suffix, 10)`. Do not rely on string sort order.
- **Zod schemas are the contract:** When requirements change (new field, new status), update `shared/schemas.ts` first, then the DB schema, then the UI. The Zod schema is the single source of truth.
- **TanStack Router codegen:** Run `tsr generate` after adding or renaming route files. The generated `routeTree.gen.ts` must be committed.
