import { Router } from "express";

export const assistantRouter = Router();

assistantRouter.post("/parse", (_req, res) => {
  res.json({ draft: {}, needsReview: [] });
});
