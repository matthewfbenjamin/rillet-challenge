import express from "express";
import cors from "cors";
import { invoicesRouter } from "./routes/invoices.js";
import { assistantRouter } from "./routes/assistant.js";
import { notFoundHandler, errorHandler } from "./middleware/errorHandler.js";

export function createApp() {
  const app = express();
  app.use(express.json());
  app.use(cors());
  app.use("/api/invoices", invoicesRouter);
  app.use("/api/assistant", assistantRouter);
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}
