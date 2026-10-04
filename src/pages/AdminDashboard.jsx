import React, { useEffect, useState } from 'react';
import { generateClient } from 'aws-amplify/api';
import { toast } from 'react-toastify';
import { listOrders } from '../graphql/queries';
import { updateOrder } from '../graphql/mutations';

const client = generateClient();

const STATUSES = ['PLACED', 'CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'];

export default function AdminDashboard() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await client.graphql({
        query: listOrders
      });
      const fetchedOrders = response.data.listOrders.items || [];
      // Sort orders by createdAt descending
      fetchedOrders.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setOrders(fetchedOrders);
    } catch (err) {
      console.error('Error fetching orders:', err);
      toast.error('Failed to load orders.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleStatusChange = async (orderId, newStatus) => {
    setUpdatingId(orderId);
    try {
      const response = await client.graphql({
        query: updateOrder,
        variables: {
          input: {
            id: orderId,
            status: newStatus
          }
        }
      });

      const updated = response.data.updateOrder;
      setOrders(prevOrders =>
        prevOrders.map(o => (o.id === orderId ? { ...o, status: updated.status } : o))
      );
      toast.success(`Order status updated to ${newStatus.replace(/_/g, ' ')}`);
    } catch (err) {
      console.error('Error updating status:', err);
      toast.error(err.errors?.[0]?.message || 'Failed to update order status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const getNextStatus = (currentStatus) => {
    const nextMap = {
      'PLACED': 'CONFIRMED',
      'CONFIRMED': 'PREPARING',
      'PREPARING': 'OUT_FOR_DELIVERY',
      'OUT_FOR_DELIVERY': 'DELIVERED'
    };
    return nextMap[currentStatus] || null;
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="card">
          <div className="spinner-container">
            <div className="spinner"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container" style={{ maxWidth: '1100px' }}>
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 className="page-title" style={{ margin: 0 }}>Vendor / Admin Dashboard</h2>
          <button
            onClick={fetchOrders}
            className="btn-add"
            style={{ borderStyle: 'solid' }}
          >
            Refresh List
          </button>
        </div>

        {orders.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
            No orders placed yet.
          </p>
        ) : (
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Total</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const nextStatus = getNextStatus(order.status);
                  const isUpdating = updatingId === order.id;

                  return (
                    <tr key={order.id}>
                      <td style={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
                        {order.id.slice(0, 8)}...
                      </td>
                      <td>
                        <div style={{ fontWeight: '600' }}>{order.customerName}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{order.customerEmail}</div>
                      </td>
                      <td style={{ fontWeight: '600' }}>
                        ${order.totalAmount?.toFixed(2)}
                      </td>
                      <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        {new Date(order.createdAt).toLocaleDateString()} {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td>
                        <span className={`status-tag ${order.status}`}>
                          {order.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td>
                        <div className="action-cell">
                          <select
                            className="form-select"
                            style={{ padding: '0.35rem 0.5rem', fontSize: '0.85rem', width: 'auto' }}
                            value={order.status}
                            disabled={isUpdating}
                            onChange={(e) => handleStatusChange(order.id, e.target.value)}
                          >
                            {STATUSES.map(s => (
                              <option key={s} value={s}>
                                {s.replace(/_/g, ' ')}
                              </option>
                            ))}
                          </select>

                          {nextStatus && (
                            <button
                              className="btn-add"
                              style={{ borderStyle: 'solid', padding: '0.35rem 0.6rem', fontSize: '0.75rem' }}
                              disabled={isUpdating}
                              onClick={() => handleStatusChange(order.id, nextStatus)}
                            >
                              Advance to {nextStatus.replace(/_/g, ' ')}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
