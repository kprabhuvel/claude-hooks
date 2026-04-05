const SLACK_WEBHOOK_URL = process.env.SLACK_WEBHOOK_URL;

export interface SlackMessage {
  channel?: string;
  text: string;
  blocks?: SlackBlock[];
}

interface SlackBlock {
  type: string;
  text?: { type: string; text: string };
  fields?: { type: string; text: string }[];
}

export async function sendSlackMessage(message: SlackMessage): Promise<void> {
  if (!SLACK_WEBHOOK_URL) {
    throw new Error("SLACK_WEBHOOK_URL environment variable is not set");
  }

  const response = await fetch(SLACK_WEBHOOK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(message),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Slack API error ${response.status}: ${body}`);
  }
}

export async function sendOrderAlert(
  orders: {
    order_number: string;
    customer_name: string;
    phone: string;
    days_pending: number;
  }[],
): Promise<void> {
  if (orders.length === 0) return;

  const orderLines = orders
    .map(
      (o) =>
        `• *${o.order_number}* — ${o.customer_name} (${o.phone ?? "no phone"}) — pending ${Math.floor(o.days_pending)} days`,
    )
    .join("\n");

  await sendSlackMessage({
    channel: "#order-alerts",
    text: `*${orders.length} order(s) have been pending for more than 3 days*\n${orderLines}`,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `:warning: *${orders.length} order(s) pending for more than 3 days*`,
        },
      },
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: orderLines,
        },
      },
    ],
  });
}
