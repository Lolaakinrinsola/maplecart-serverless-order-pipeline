const { BlobServiceClient } = require("@azure/storage-blob");

module.exports = async function (context) {
  const { summary, startIso } = context.bindings.context;
  const date = new Date(startIso);
  const yyyy = date.getUTCFullYear();
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(date.getUTCDate()).padStart(2, "0");

  const blobName = `sales-${yyyy}-${mm}-${dd}.csv`;
  const container = "reports";

  // Reuse the connection string the Functions runtime already has
  const blobService = BlobServiceClient.fromConnectionString(process.env.AzureWebJobsStorage);
  const containerClient = blobService.getContainerClient(container);
  await containerClient.createIfNotExists();

  const blockBlob = containerClient.getBlockBlobClient(blobName);
  await blockBlob.upload(summary.csv, Buffer.byteLength(summary.csv), {
    blobHTTPHeaders: { blobContentType: "text/csv" }
  });

  const blobUrl = blockBlob.url;
  context.log(`Saved report to ${blobUrl}`);
  return { blobUrl };
};
