# Rillet Design Engineering Challenge

## Invoice Workspace

Rillet is an AI-native ERP for modern finance teams. The product helps accounting teams move faster while keeping financial data accurate, reviewable, and audit-ready.

For this challenge, design and build a prototype for a Rillet invoice workspace.

Your user is an Accounting Manager at a fast-growing SaaS company. They need to create, review, edit, and delete customer invoices while keeping invoice data trustworthy. The interface should feel like serious finance software: precise, calm, efficient, and easy to audit.

Helpful Rillet context:

- [Rillet homepage](https://www.rillet.com/)
- [Rillet platform](https://www.rillet.com/product/platform)
- [Advanced revenue recognition](https://www.rillet.com/product/advanced-revenue-recognition)

## The Assignment

Build a CRUD web app for invoices.

Spend roughly **2-4 focused hours**. If you go beyond that, please note what you chose to polish and what you intentionally left unfinished.

Your app should support:

1. **Display all invoices**
2. **Create an invoice**
3. **View an individual invoice**
4. **Edit an individual invoice**
5. **Delete an invoice**

Use the provided data in [data/invoices.json](data/invoices.json) as your starting point. Keep the data model simple: a single persisted `Invoice` model or document is enough.

## What We're Indexing On

We are indexing on design sense, creativity, curiosity, functionality, and implementation quality.

The best submissions work well, feel considered, and show a thoughtful point of view on how invoice workflows can be clearer, faster, and more trustworthy.

## Product Requirements

Include these elements in some form:

- **Invoice list:** a scannable view of all invoices with useful columns such as customer, status, due date, amount, and last updated date.
- **Create flow:** a form for creating invoices.
- **Invoice detail:** a focused view for one invoice, including line items, totals, status, customer details, memo, and activity/history.
- **Edit flow:** a way to modify invoice fields and line items.
- **Delete flow:** a deliberate deletion interaction with confirmation and clear feedback.
- **State changes:** invoice creation, edits, and deletion should update the interface without a full refresh.
- **Persistent data:** invoice data should persist across browser sessions using a backend. You do not need to build authentication.
- **Responsive behavior:** the experience should work well on a laptop viewport and remain usable on a mobile viewport.

You do not need to build authentication, PDF generation, payment collection, or production-grade billing infrastructure.

## Backend Requirements

Include a backend so invoice data persists across sessions.

You may choose the backend approach: server routes, REST, GraphQL, SQLite, Postgres, Supabase, Firebase, Prisma, Rails, Django, Express, Next.js route handlers, or another stack you are comfortable with.

We will look for:

- Create, read, update, and delete operations backed by persistent storage.
- A clear single-model approach for invoices. Customer details, line items, and activity/history can be embedded on the invoice.
- Sensible validation at the backend boundary.
- Seed data or preloaded live data so we can evaluate the app quickly.
- No authentication requirement. Assume a single internal Rillet user.

## Engineering Expectations

Use the stack you would normally choose for a production-quality frontend prototype. TypeScript is preferred but not required.

We will look for:

- Clear component boundaries and naming.
- Thoughtful form state and validation.
- Sensible data modeling for invoices, including embedded line items, customer details, statuses, and audit events.
- Derived totals that are computed reliably from line items, discounts, taxes, and fees.
- Backend persistence that is simple, reliable, and easy to inspect.
- Loading, empty, error, and destructive-action states.
- Accessible interaction patterns, especially around tables, forms, dialogs, focus, and color contrast.
- At least a small amount of testing around important logic or interactions.
- A README that makes the live app easy to evaluate.

## Design Expectations

This is an enterprise finance product, not a marketing page. That said, bring some taste and creativity to the interaction model, layout, and details. The product should feel trustworthy without feeling generic.

We will look for:

- Strong information hierarchy.
- High signal-to-noise ratio.
- Useful density without visual clutter.
- Clear distinction between invoice status, payment status, due date risk, and financial amount.
- Form design that makes mistakes less likely.
- Interactions that reduce cognitive load for a busy accounting user.
- A thoughtful point of view on how invoice work could feel faster, clearer, or more modern.
- Polished details: spacing, typography, alignment, hover/focus states, responsive layout, and edge cases.
- Visual language that feels appropriate for audit-sensitive financial workflows.

## Bonus: LLM-Enhanced Workflow

If you want to go further, add one meaningful LLM-enhanced workflow.

The recommended bonus is an **Invoice Assistant**:

1. The user pastes messy, unstructured invoice context, such as an email, contract note, Slack request, or plain-language billing instruction.
2. The app sends that text to an LLM.
3. The LLM returns a structured invoice draft, including customer name, due date, line items, amounts, currency, memo, and any fields that need human review.
4. The user can review the draft, edit fields, and choose whether to create the invoice.

The LLM should help produce or improve invoice data. Avoid building a generic chatbot that is disconnected from the CRUD workflow.

You may use any LLM provider. Include an `.env.example` if one is needed, and do not expose API keys in client-side code. If you cannot or prefer not to call a live LLM, you may include a deterministic mock mode.

If you attempt this bonus, we will look for thoughtful handling of loading states, errors, schema validation, human review, and safe behavior when the model returns invalid or incomplete data.

## Submission

Please send:

- A GitHub repository link.
- A live deployed app link.
- Known tradeoffs or unfinished areas.
- Optional: a short Loom walkthrough.

Your project README should give us a concise overview of the design decisions you made and why they fit an invoice workflow for finance users.

It should also explain the most important technical decisions, including your backend persistence approach and, if you attempted the bonus, how the LLM-enhanced workflow is implemented.

## AI Tooling

You may use AI coding tools, design tools, component libraries, and open-source packages. Use the tools you would use in real work.

You should be ready to explain and modify any code you submit.

## What We Care About Most

The strongest submissions usually make a few sharp choices and execute them deeply. We would rather see one convincing invoice workflow with excellent craft and solid code than five shallow screens.

Use this challenge to show us how you think, how you design, and how you build when the product surface is detail-heavy and the user needs to trust the system.
