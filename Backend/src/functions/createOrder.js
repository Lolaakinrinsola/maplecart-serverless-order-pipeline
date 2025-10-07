// src/functions/CreateOrder/index.js
const { app } = require('@azure/functions');
const { BlobServiceClient } = require("@azure/storage-blob");
const { QueueClient } = require("@azure/storage-queue");

app.http('CreateOrder', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        try {
            const order = await request.json();

            if (!order || !order.item || !order.customer) {
                return { status: 400, jsonBody: { success: false, message: "Invalid order data" } };
            }

            const orderId = `ORDER-${Date.now()}`;
            order.orderId = orderId;
            context.log(`[CreateOrder] accepted orderId=${orderId} stage=accepted`);

            // --- Save to Blob ---
            const blobServiceClient = BlobServiceClient.fromConnectionString(process.env.AzureWebJobsStorage);
            const containerClient = blobServiceClient.getContainerClient("orders");
            await containerClient.createIfNotExists();

            const blobName = `${orderId}.json`;
            const blockBlobClient = containerClient.getBlockBlobClient(blobName);
            await blockBlobClient.upload(JSON.stringify(order), Buffer.byteLength(JSON.stringify(order)));
            context.log(`[CreateOrder] saved-to-blob orderId=${orderId} blob=${blobName} stage=blob`);

            // --- Send to Queue ---
            const queueClient = new QueueClient(process.env.AzureWebJobsStorage, "order-queue");
            await queueClient.createIfNotExists();
            await queueClient.sendMessage(Buffer.from(JSON.stringify({ blobName, orderId })).toString("base64"));
            context.log(`[CreateOrder] enqueued orderId=${orderId} queue=order-queue stage=queue`);

            // context.log(`✅ Queued order ${orderId}`);
            // --- Return FAST response ---
            return {
                status: 202, // Accepted, processing async
                jsonBody: { success: true, orderId, message: "Order accepted for processing" }
            };

        } catch (err) {
            context.log("❌ Error creating order:", err);
            return { status: 500, jsonBody: { success: false, message: err.message } };
        }
    }
});
