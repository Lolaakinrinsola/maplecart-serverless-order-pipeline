const { EmailClient } = require("@azure/communication-email");

module.exports = async function (context) {
  const { summary, blobUrl } = context.bindings.context;

  const toList = (process.env.REPORT_RECIPIENTS || "").split(",").map(s => s.trim()).filter(Boolean);
  if (!process.env.ACS_CONNECTION_STRING || !process.env.SENDER_EMAIL || toList.length === 0) {
    context.log("⚠️ Email skipped — missing ACS_CONNECTION_STRING, SENDER_EMAIL, or REPORT_RECIPIENTS.");
    return;
  }

  const client = new EmailClient(process.env.ACS_CONNECTION_STRING);
  const subject = `Daily Sales: ${summary.totalOrders} orders • $${summary.totalRevenue.toFixed(2)}`;
  const plain = [
    `Daily Sales Summary`,
    `-------------------`,
    `Orders: ${summary.totalOrders}`,
    `Revenue: $${summary.totalRevenue.toFixed(2)}`,
    ``,
    `Top items:`,
    ...summary.topItems.map(t => `• ${t.item} (${t.count})`),
    ``,
    `CSV: ${blobUrl}`
  ].join("\n");

  const message = {
    senderAddress: process.env.SENDER_EMAIL,
    content: { subject, plainText: plain },
    recipients: { to: toList.map(address => ({ address })) }
  };

  const poller = await client.beginSend(message);
  const res = await poller.pollUntilDone();
  context.log(`Email send status: ${res.status}`);
};
