const { app } = require('@azure/functions');
const { BlobServiceClient } = require("@azure/storage-blob");
const { QueueClient } = require("@azure/storage-queue");
const { DefaultAzureCredential } = require("@azure/identity");
const sql = require("mssql");

app.http('CreateOrder', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        try {
            const order = await request.json();

            if (!order || !order.item || !order.customer) {
                return {
                    status: 400,
                    jsonBody: { success: false, message: "Invalid order data" }
                };
            }

            const orderId = `ORDER-${Date.now()}`;
            order.orderId = orderId;

            // ---------- 1. Save order JSON to Blob ----------
            const blobConnectionString = process.env.AzureWebJobsStorage;
            const blobServiceClient = BlobServiceClient.fromConnectionString(blobConnectionString);
            const containerClient = blobServiceClient.getContainerClient("orders");

            const blobName = `${orderId}.json`;
            const blockBlobClient = containerClient.getBlockBlobClient(blobName);
            await blockBlobClient.upload(JSON.stringify(order), Buffer.byteLength(JSON.stringify(order)));
            context.log(`✅ Saved order ${orderId} to blob storage`);

            // ---------- 2. Send message to Queue ----------
            const queueClient = new QueueClient(blobConnectionString, "orderqueue");
            await queueClient.sendMessage(JSON.stringify({ blobName }));
            context.log(`✅ Sent queue message for ${orderId}`);

            // ---------- 3. Insert into SQL using Managed Identity ----------
            const credential = new DefaultAzureCredential();
            const tokenResponse = await credential.getToken("https://database.windows.net/");

            const pool = await sql.connect({
                server: process.env.SQL_SERVER,
                database: process.env.SQL_DATABASE,
                options: { encrypt: true },
                authentication: {
                    type: "azure-active-directory-access-token",
                    options: { token: tokenResponse.token }
                }
            });

            await pool.request()
                .input("orderId", sql.NVarChar, orderId)
                .input("item", sql.NVarChar, order.item)
                .input("quantity", sql.Int, order.quantity)
                .input("price", sql.Decimal(10,2), order.price)
                .input("total", sql.Decimal(10,2), order.total)
                .input("email", sql.NVarChar, order.customer.email)
                .input("firstName", sql.NVarChar, order.customer.firstName)
                .input("lastName", sql.NVarChar, order.customer.lastName)
                .input("address", sql.NVarChar, order.customer.address)
                .input("city", sql.NVarChar, order.customer.city)
                .input("zipCode", sql.NVarChar, order.customer.zipCode)
                .input("orderDate", sql.DateTime, new Date(order.orderDate))
                .query(`
                    INSERT INTO Orders (OrderId, Item, Quantity, Price, Total, Email, FirstName, LastName, Address, City, ZipCode, OrderDate)
                    VALUES (@orderId, @item, @quantity, @price, @total, @email, @firstName, @lastName, @address, @city, @zipCode, @orderDate)
                `);

            context.log(`✅ Inserted order ${orderId} into SQL`);

            return {
                status: 200,
                jsonBody: {
                    success: true,
                    orderId,
                    message: "Order processed successfully"
                }
            };

        } catch (err) {
            context.error(" Error processing order:", err);
            return {
                status: 500,
                jsonBody: { success: false, message: "Order processing failed", details: err.message }
            };
        }
    }
});
