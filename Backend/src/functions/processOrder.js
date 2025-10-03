const { app } = require("@azure/functions");
const { BlobServiceClient } = require("@azure/storage-blob");
const sql = require("mssql");
const { DefaultAzureCredential } = require("@azure/identity");
const { EmailClient } = require("@azure/communication-email");

//
// -------------------- ProcessOrder (Queue Trigger) --------------------
//
app.storageQueue("ProcessOrder", {
  connection: "AzureWebJobsStorage",
  queueName: "order-queue",
  handler: async (message, context) => {
    context.log(`📦 Processing queue message: ${JSON.stringify(message)}`);

    try {
      // Parse queue message safely
      let payload;
      if (typeof message === "string") {
        payload = JSON.parse(message);
      } else {
        payload = message;
      }
      const { blobName, orderId } = payload;

      // --- 1. Get order JSON from Blob ---
      const blobServiceClient = BlobServiceClient.fromConnectionString(
        process.env.AzureWebJobsStorage
      );
      const containerClient = blobServiceClient.getContainerClient("orders");
      const blockBlobClient = containerClient.getBlockBlobClient(blobName);

      const downloadResponse = await blockBlobClient.download();
      const downloaded = await streamToString(
        downloadResponse.readableStreamBody
      );
      const order = JSON.parse(downloaded);

      // --- 2. Insert into SQL with Managed Identity ---
      const credential = new DefaultAzureCredential();
      const tokenResponse = await credential.getToken(
        "https://database.windows.net/"
      );

      await sql.connect({
        server: process.env.SQL_SERVER,
        database: process.env.SQL_DATABASE,
        options: { encrypt: true },
        authentication: {
          type: "azure-active-directory-access-token",
          options: { token: tokenResponse.token },
        },
      });

      // ✅ Idempotent insert: only insert if OrderId does not exist
      await sql.query`
                IF NOT EXISTS (SELECT 1 FROM Orders WHERE OrderId = ${orderId})
                BEGIN
                    INSERT INTO Orders (OrderId, Item, Quantity, Price, Total, Email, FirstName, LastName, Address, City, ZipCode, OrderDate)
                    VALUES (${orderId}, ${order.item}, ${order.quantity}, ${
        order.price
      }, ${order.total}, 
                            ${order.customer.email}, ${
        order.customer.firstName
      }, ${order.customer.lastName}, 
                            ${order.customer.address}, ${
        order.customer.city
      }, ${order.customer.zipCode}, ${new Date(order.orderDate)})
                END
            `;

      context.log(
        `✅ Inserted order ${orderId} into SQL (or skipped if duplicate)`
      );

      // --- 3. Send confirmation email ---
      if (
        process.env.ACS_CONNECTION_STRING &&
        process.env.SENDER_EMAIL &&
        order.customer?.email
      ) {
        const emailClient = new EmailClient(process.env.ACS_CONNECTION_STRING);

        const message = {
          senderAddress: process.env.SENDER_EMAIL,
          content: {
            subject: `Order ${orderId} Confirmed`,
            plainText: `Hi ${order.customer.firstName}, your order ${orderId} was confirmed!`,
          },
          recipients: { to: [{ address: order.customer.email }] },
        };

        const poller = await emailClient.beginSend(message);
        const result = await poller.pollUntilDone();

        if (result.status === "Succeeded") {
          context.log(`📧 Sent email to ${order.customer.email}`);
        } else {
          context.log(`⚠️ Email not sent. Status: ${result.status}`);
        }

        context.log(`📧 Sent email to ${order.customer.email}`);
      } else {
        context.log(
          "⚠️ Email not sent — ACS settings missing or no customer email."
        );
      }
    } catch (err) {
      context.log("❌ Failed processing order:", err);
      throw err; // re-queue until maxRetries → poison queue
    }
  },
});

// Helper: convert blob stream → string
async function streamToString(readableStream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    readableStream.on("data", (d) => chunks.push(d.toString()));
    readableStream.on("end", () => resolve(chunks.join("")));
    readableStream.on("error", reject);
  });
}
