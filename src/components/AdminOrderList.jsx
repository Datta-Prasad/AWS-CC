import React, { useEffect, useState } from 'react';
import { generateClient } from 'aws-amplify/data';
import { toast } from 'react-toastify';
import { getNextStatus, canCancelOrder } from '../utils/statusFlow';

const client = generateClient();

const SAMPLE_DELIVERY_BOYS = [
  { id: 'db-1', name: 'Alex Driver (alex@delivery.com)', value: 'alex@delivery.com' },
  { id: 'db-2', name: 'Sam Express (sam@delivery.com)', value: 'sam@delivery.com' },
  { id: 'db-3', name: 'Chris Rider (chris@delivery.com)', value: 'chris@delivery.com' },
];

export default function AdminOrderList() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [assignedBoys, setAssignedBoys] = useState({});

  useEffect(() => {
    const sub = client.models.Order.observeQuery().subscribe({
      next: ({ items }) => {
        const sortedItems = [...items].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setOrders(sortedItems.map(o => ({
          ...o,
          items: JSON.parse(o.items || '[]')
        })));
        setLoading(false);
      },
      error: (_err) => {
        setLoading(false);
        toast.error('Failed to load orders');
      }
    });

    return () => sub.unsubscribe();
  }, []);

  const handleUpdateStatus = async (order, newStatus) => {
    setUpdatingId(order.id);
    try {
      const updateData = { id: order.id, status: newStatus };

      // If advancing from PREPARING to OUT_FOR_DELIVERY, attach assignedDeliveryBoy if selected
      if (order.status === 'PREPARING' && newStatus === 'OUT_FOR_DELIVERY') {
        const selectedBoy = assignedBoys[order.id] || order.assignedDeliveryBoy || SAMPLE_DELIVERY_BOYS[0].value;
        updateData.assignedDeliveryBoy = selectedBoy;
      }

      await client.models.Order.update(updateData);
      toast.success(`Order status updated to ${newStatus.replace(/_/g, ' ')}`);
    } catch (err) {
      console.error('Error updating status:', err);
      toast.error(err.errors?.[0]?.message || err.message || 'Failed to update order status.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeliveryBoyChange = (orderId, boyValue) => {
    setAssignedBoys(prev => ({ ...prev, [orderId]: boyValue }));
  };

  if (loading) {
    return (
      <div className="card">
        <div className="spinner-container">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h2 className="page-title" style={{ margin: 0 }}>Vendor / Admin Dashboard</h2>
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
                <th>Customer</th>
                <th>Items Count</th>
                <th>Total</th>
                <th>Status</th>
                <th>Assigned Delivery</th>
                <th>Created At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => {
                const nextStatus = getNextStatus(order.status);
                const isCancelable = canCancelOrder(order.status);
                const isUpdating = updatingId === order.id;
                const isPreparing = order.status === 'PREPARING';

                return (
                  <tr key={order.id}>
                    <td>
                      <div style={{ fontWeight: '600' }}>{order.customerName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{order.customerEmail}</div>
                    </td>
                    <td>
                      {order.items?.length || 0} item(s)
                    </td>
                    <td style={{ fontWeight: '600' }}>
                      ${order.totalAmount?.toFixed(2)}
                    </td>
                    <td>
                      <span className={`status-tag ${order.status}`}>
                        {order.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td>
                      {isPreparing ? (
                        <select
                          className="form-input"
                          style={{ padding: '0.3rem 0.5rem', fontSize: '0.8rem' }}
                          value={assignedBoys[order.id] || order.assignedDeliveryBoy || SAMPLE_DELIVERY_BOYS[0].value}
                          onChange={(e) => handleDeliveryBoyChange(order.id, e.target.value)}
                        >
                          {SAMPLE_DELIVERY_BOYS.map(boy => (
                            <option key={boy.id} value={boy.value}>
                              {boy.name}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span style={{ fontSize: '0.85rem', color: order.assignedDeliveryBoy ? 'var(--text-primary)' : 'var(--text-muted)' }}>
                          {order.assignedDeliveryBoy || 'Unassigned'}
                        </span>
                      )}
                    </td>
                    <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      {order.createdAt ? `${new Date(order.createdAt).toLocaleDateString()} ${new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'N/A'}
                    </td>
                    <td>
                      <div className="action-cell">
                        <button
                          className="btn-add"
                          style={{
                            borderStyle: 'solid',
                            padding: '0.35rem 0.6rem',
                            fontSize: '0.75rem',
                            backgroundColor: nextStatus ? 'var(--primary-color)' : '#cbd5e1',
                            color: 'white',
                            borderColor: 'transparent'
                          }}
                          disabled={!nextStatus || isUpdating}
                          onClick={() => handleUpdateStatus(order, nextStatus)}
                        >
                          {nextStatus ? `Advance to ${nextStatus.replace(/_/g, ' ')}` : 'Completed'}
                        </button>

                        <button
                          className="btn-add"
                          style={{
                            borderStyle: 'solid',
                            padding: '0.35rem 0.6rem',
                            fontSize: '0.75rem',
                            backgroundColor: isCancelable ? 'var(--danger-color)' : '#cbd5e1',
                            color: 'white',
                            borderColor: 'transparent'
                          }}
                          disabled={!isCancelable || isUpdating}
                          onClick={() => handleUpdateStatus(order, 'CANCELLED')}
                        >
                          Cancel Order
                        </button>
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
  );
}
