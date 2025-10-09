const { app } = require("@azure/functions");
const { CosmosClient } = require("@azure/cosmos");

app.eventGrid("OnOrderCreated", {
  handler: async (event, context) => {
    try {
      const data = event.data;
      const blobUrl = data.url;
      const orderId = blobUrl.split("/").pop().replace(".json", "");

      const client = new CosmosClient(process.env.COSMOS_CONN);
      const container = client.database("OrdersDB").container("OrdersSummary");

      const summary = {
        id: orderId,
        blobUrl,
        createdAt: new Date().toISOString(),
        source: "BlobCreatedEvent"
      };

      await container.items.upsert(summary);
      context.log(`Order summary added for ${orderId}`);
    } catch (err) {
      context.log(" Error in OnOrderCreated:", err);
    }
  }
});
