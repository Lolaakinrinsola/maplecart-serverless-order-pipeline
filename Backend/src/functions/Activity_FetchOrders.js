const sql = require("mssql");
const { DefaultAzureCredential } = require("@azure/identity");

module.exports = async function (context,input) {
  const { start, end } = input; // payload from orchestrator

  const credential = new DefaultAzureCredential();
  const token = await credential.getToken("https://database.windows.net/");

  await sql.connect({
    server: process.env.SQL_SERVER,
    database: process.env.SQL_DATABASE,
    options: { encrypt: true },
    authentication: {
      type: "azure-active-directory-access-token",
      options: { token: token.token }
    }
});

  const result = await sql.query`
    SELECT OrderId, Item, Quantity, Price, Total, City, OrderDate
    FROM dbo.Orders
    WHERE OrderDate >= ${start} AND OrderDate < ${end}
    ORDER BY OrderDate DESC
  `;

  context.log(`Fetched ${result.recordset.length} orders for window ${start} - ${end}`);
  return result.recordset;
};
