import { Router } from "express";

export const invoicesRouter = Router();

invoicesRouter.get("/", (_req, res) => {
  res.json({ data: [], meta: { total: 0, voided: 0 } });
});
