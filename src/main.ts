import { open } from "sqlite";
import sqlite3 from "sqlite3";

import { createSchema } from "./schema";
import { getPendingOrders } from "./queries/order_queries";
import { sendOrderAlert } from "./slack";

async function main() {
  const db = await open({
    filename: "ecommerce.db",
    driver: sqlite3.Database,
  });

  await createSchema(db, false);

  const overdueOrders = await getPendingOrders(db, 3);
  if (overdueOrders.length > 0) {
    await sendOrderAlert(
      overdueOrders.map((o) => ({
        order_number: o.order_number,
        customer_name: o.customer_name,
        phone: o.phone,
        days_pending: o.days_since_created,
      })),
    );
    console.log(`Sent alert for ${overdueOrders.length} overdue order(s).`);
  } else {
    console.log("No overdue pending orders.");
  }
}

main();
