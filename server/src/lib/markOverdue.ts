import { db } from "../db/database.js";
import { SYSTEM_ACTOR } from "~shared/constants.js";
import { nanoid } from "nanoid";

export function markOverdue() {
  const today = new Date().toISOString().slice(0, 10);

  const candidates = db
    .prepare(
      `SELECT id, dueDate, activity FROM invoices
       WHERE paymentStatus IN ('Open', 'Partial')
       AND status NOT IN ('Void', 'Paid')
       AND dueDate < ?`
    )
    .all(today) as Array<{ id: string; dueDate: string; activity: string }>;

  if (candidates.length === 0) return;

  const now = new Date().toISOString();

  const update = db.prepare(
    `UPDATE invoices SET paymentStatus = 'Overdue', activity = ?, updatedAt = ? WHERE id = ?`
  );

  db.transaction(() => {
    for (const row of candidates) {
      const activity = JSON.parse(row.activity) as Array<Record<string, unknown>>;
      activity.push({
        id: nanoid(),
        timestamp: now,
        actor: SYSTEM_ACTOR,
        action: "Marked invoice overdue",
      });
      update.run(JSON.stringify(activity), now, row.id);
    }
  })();

  console.log(`Marked ${candidates.length} invoice(s) as overdue`);
}
