import { useEffect, useState } from 'react';
import { fetchOrders } from '../services/orderService';
import Layout from '@/components/Layout';
import { FaBoxOpen } from 'react-icons/fa';
import { MdRefresh } from 'react-icons/md';

export default function Dashboard() {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadOrders = async () => {
    try {
      setRefreshing(true);
      const data = await fetchOrders('sql');
      setOrders(data);
    } catch (err) {
      console.error('Fetch error:', err);
      setError('Failed to load orders. Please try again later.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  return (
    <Layout>
      <div className="p-8 max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
            <FaBoxOpen className="text-blue-600" />
            Recent Orders
          </h2>
          <button
            onClick={loadOrders}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition disabled:opacity-50"
          >
            <MdRefresh className={`transition ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Loading / Error / Empty states */}
        {loading && (
          <p className="text-gray-600 text-center py-12 animate-pulse">
            Loading recent orders...
          </p>
        )}
        {error && (
          <p className="text-red-600 bg-red-50 p-4 rounded-lg text-center font-medium">
            {error}
          </p>
        )}
        {!loading && !error && orders.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-gray-500">
            <FaBoxOpen size={40} className="mb-3 opacity-70" />
            <p>No recent orders found.</p>
          </div>
        )}

        {/* Orders Table */}
        {orders.length > 0 && (
          <div className="overflow-x-auto rounded-lg shadow border border-gray-100 bg-white">
            <table className="w-full border-collapse">
              <thead className="bg-gray-50 text-gray-700 text-sm">
                <tr>
                  <th className="py-3 px-4 text-left font-medium">Order ID</th>
                  <th className="py-3 px-4 text-left font-medium">Item</th>
                  <th className="py-3 px-4 text-left font-medium">Total</th>
                  <th className="py-3 px-4 text-left font-medium">City</th>
                  <th className="py-3 px-4 text-left font-medium">Order Date</th>
                </tr>
              </thead>
              <tbody className="text-sm text-gray-700">
                {orders.map((o, idx) => (
                  <tr
                    key={o.OrderId}
                    className={`hover:bg-blue-50 transition ${
                      idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                    }`}
                  >
                    <td className="py-3 px-4 font-mono text-xs text-blue-700">{o.OrderId}</td>
                    <td className="py-3 px-4">{o.Item}</td>
                    <td className="py-3 px-4 font-semibold">${o.Total.toFixed(2)}</td>
                    <td className="py-3 px-4">{o.City}</td>
                    <td className="py-3 px-4 text-gray-600">
                      {new Date(o.OrderDate).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Layout>
  );
}
