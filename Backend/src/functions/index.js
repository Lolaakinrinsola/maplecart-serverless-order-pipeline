const df = require("durable-functions");
const fetchOrders = require("./Activity_FetchOrders");
const summarizeSales = require("./Activity_SummarizeSales");
const saveReport = require("./Activity_SaveReport");
const sendReport = require("./Activity_SendReport");

module.exports = async function TimerTrigger(context, myTimer) {
  const client = df.getClient(context);
  const instanceId = await client.startNew("OrchestrateDailyReport", undefined, {});
  context.log(`✅ Daily report orchestration started. Instance ID: ${instanceId}`);
};

// Register the orchestrator function
df.app.orchestration("OrchestrateDailyReport", function* (context) {
  const end = context.df.currentUtcDateTime;
  const start = new Date(end);
  start.setUTCDate(end.getUTCDate() - 1);
  start.setUTCHours(0, 0, 0, 0);
  const endOfDay = new Date(start);
  endOfDay.setUTCDate(start.getUTCDate() + 1);

  const orders = yield context.df.callActivity("FetchOrders", { start: start.toISOString(), end: endOfDay.toISOString() });
  const summary = yield context.df.callActivity("SummarizeSales", orders);
  const blobInfo = yield context.df.callActivity("SaveReport", { summary, startIso: start.toISOString() });
  yield context.df.callActivity("SendReport", { summary, blobUrl: blobInfo.blobUrl });

  return { status: "Succeeded", count: orders.length, blobUrl: blobInfo.blobUrl };
});

// Register activity functions
df.app.activity("FetchOrders", fetchOrders);
df.app.activity("SummarizeSales", summarizeSales);
df.app.activity("SaveReport", saveReport);
df.app.activity("SendReport", sendReport);
