import "dotenv/config";
import { db } from "./db/database.js";
import { initializeSchema } from "./db/schema.js";
import { seed } from "./db/seed.js";
import { markOverdue } from "./lib/markOverdue.js";
import { createApp } from "./app.js";

const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;

initializeSchema(db);
seed();
markOverdue(); // On startup, mark any overdue invoices in the DB so that the service layer doesn't have to derive it on read

const app = createApp();
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
