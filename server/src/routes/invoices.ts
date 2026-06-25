import { Router } from "express";
import { validateBody } from "../middleware/validateBody.js";
import { CreateInvoiceSchema, UpdateInvoiceSchema, TransitionSchema } from "~shared/schemas.js";
import { DEFAULT_ACTOR } from "~shared/constants.js";
import {
  listInvoices,
  getInvoiceById,
  createInvoice,
  updateInvoice,
  transitionInvoice,
  voidInvoice,
} from "../services/invoiceService.js";
import { generateInvoiceNumber } from "../services/invoiceNumber.js";

export const invoicesRouter = Router();

// GET / — list invoices
invoicesRouter.get("/", (req, res) => {
  const includeVoided = req.query.includeVoided === "true";
  const result = listInvoices(includeVoided);
  res.json(result);
});

// POST / — create invoice
invoicesRouter.post("/", validateBody(CreateInvoiceSchema), (req, res, next) => {
  try {
    const { actor: bodyActor, ...data } = req.body;
    const actor = bodyActor ?? DEFAULT_ACTOR;
    const invoice = createInvoice(data, actor);
    res.status(201).json({ data: invoice });
  } catch (err) {
    next(err);
  }
});

// GET /next-number — must be declared BEFORE /:id
invoicesRouter.get("/next-number", (_req, res) => {
  const invoiceNumber = generateInvoiceNumber();
  res.json({ invoiceNumber });
});

// GET /:id — get single invoice
invoicesRouter.get("/:id", (req, res) => {
  const invoice = getInvoiceById(req.params.id);
  if (!invoice) {
    res.status(404).json({ error: "Invoice not found" });
    return;
  }
  res.json({ data: invoice });
});

// PATCH /:id — update invoice
invoicesRouter.patch("/:id", validateBody(UpdateInvoiceSchema), (req, res, next) => {
  try {
    const { actor: bodyActor, ...data } = req.body;
    const actor = bodyActor ?? DEFAULT_ACTOR;
    const invoice = updateInvoice(req.params.id as string, data, actor);
    res.json({ data: invoice });
  } catch (err) {
    next(err);
  }
});

// POST /:id/transition — transition invoice status
invoicesRouter.post("/:id/transition", validateBody(TransitionSchema), (req, res, next) => {
  try {
    const { action, actor, paidDate, amountPaid } = req.body;
    const invoice = transitionInvoice(req.params.id as string, action, actor, paidDate, amountPaid);
    res.json({ data: invoice });
  } catch (err) {
    next(err);
  }
});

// DELETE /:id — void invoice
invoicesRouter.delete("/:id", (req, res, next) => {
  try {
    const invoice = voidInvoice(req.params.id);
    res.json({ data: invoice });
  } catch (err) {
    next(err);
  }
});
