module.exports = async function (context) {
    const orders = context.bindings.context || [];
    const totalRevenue = orders.reduce((a, o) => a + Number(o.Total || 0), 0);
    const totalOrders = orders.length;
  
    const byItem = {};
    for (const o of orders) {
      const key = o.Item || "Unknown";
      byItem[key] = (byItem[key] || 0) + 1;
    }
    const topItems = Object.entries(byItem)
      .map(([item, count]) => ({ item, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  
    // Basic CSV
    const csvHeader = "OrderId,Item,Quantity,Price,Total,City,OrderDate";
    const csvRows = orders.map(o =>
      [
        o.OrderId,
        csvEscape(o.Item),
        o.Quantity,
        o.Price,
        o.Total,
        csvEscape(o.City),
        o.OrderDate?.toISOString?.() || o.OrderDate
      ].join(",")
    );
    const csv = [csvHeader, ...csvRows].join("\n");
  
    const summary = {
      totalRevenue,
      totalOrders,
      topItems,
      csv
    };
  
    context.log(`Summary: orders=${totalOrders}, revenue=${totalRevenue.toFixed(2)}`);
    return summary;
  };
  
  function csvEscape(value) {
    if (value == null) return "";
    const s = String(value);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  }
  