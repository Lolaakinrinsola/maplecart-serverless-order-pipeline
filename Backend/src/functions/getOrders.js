const { app } = require('@azure/functions');
const sql = require('mssql');
const { CosmosClient } = require('@azure/cosmos');
const { DefaultAzureCredential } = require('@azure/identity');

app.http('GetOrders', {
  methods: ['GET'],
  authLevel: 'anonymous',
  handler: async (req, ctx) => {
    try {
      const source = req.query.get('source') || 'sql'; // 'sql' or 'cosmos'

      if (source === 'sql') {
        const credential = new DefaultAzureCredential();
        const token = await credential.getToken("https://database.windows.net/");
        await sql.connect({
          server: process.env.SQL_SERVER,
          database: process.env.SQL_DATABASE,
          options: { encrypt: true },
          authentication: {
            type: 'azure-active-directory-access-token',
            options: { token: token.token }
          }
        });

        const result = await sql.query`
          SELECT TOP 20 OrderId, Item, Total, City, OrderDate
          FROM Orders ORDER BY OrderDate DESC
        `;
        return { status: 200, jsonBody: result.recordset };
      }

      // Cosmos path
      const client = new CosmosClient(process.env.COSMOS_CONN);
      const container = client.database('OrdersDB').container('OrdersSummary');
      const { resources } = await container.items
        .query('SELECT * FROM c ORDER BY c.createdAt DESC OFFSET 0 LIMIT 20')
        .fetchAll();

      return { status: 200, jsonBody: resources };
    } catch (err) {
      ctx.log(`Error fetching orders: ${err.message}`);
      return { status: 500, jsonBody: { message: err.message } };
    }
  }
});
