import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { generateClient } from 'aws-amplify/data';
import { toast } from 'react-toastify';
import StatusStepper from './StatusStepper';

const client = generateClient();

const ACTIVE_STATUSES = ['PLACED', 'CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY'];
const HISTORY_STATUSES = ['DELIVERED', 'CANCELLED'];

export default function CustomerDashboard() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const sub = client.models.Order.observeQuery().subscribe({
      next: ({ items }) => {
        if (!isMounted) return;
        const sortedItems = [...items].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        const parsedOrders = sortedItems.map(o => ({
          ...o,
          items: JSON.parse(o.items || '[]')
        }));
        setOrders(parsedOrders);
        setLoading(false);
      },
      error: (_err) => {
        if (!isMounted) return;
        setLoading(false);
        toast.error('Failed to load orders.');
      }
    });

    return () => {
      isMounted = false;
      sub.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="card">
        <div className="spinner-container">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  const activeOrders = orders.filter(o => ACTIVE_STATUSES.includes(o.status));
  const historyOrders = orders.filter(o => HISTORY_STATUSES.includes(o.status));

  // Friendly empty state if user has no orders at all
  if (orders.length === 0) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
        <h2 className="page-title" style={{ marginBottom: '0.75rem' }}>Welcome to OrderTracker!</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '1rem' }}>
          You haven't placed any orders yet.
        </p>
        <Link to="/order" className="btn-primary" style={{ display: 'inline-block', textDecoration: 'none', width: 'auto', padding: '0.75rem 1.5rem' }}>
          🛒 Place your first order
        </Link>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Active Orders Section */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <h2 className="page-title" style={{ margin: 0 }}>Active Orders</h2>
          <Link to="/order" className="btn-add" style={{ textDecoration: 'none', borderStyle: 'solid' }}>
            + Place New Order
          </Link>
        </div>

        {activeOrders.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', padding: '1rem 0' }}>
            No active orders right now.
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {activeOrders.map((order) => (
              <div
                key={order.id}
                style={{
                  border: '1px solid var(--border-color)',
                  borderRadius: '8px',
                  padding: '1.25rem',
                  backgroundColor: 'var(--background-card, #ffffff)'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div>
                    <h3 style={{ fontSize: '1.05rem', fontWeight: '600', margin: 0 }}>
                      Order #{order.id.slice(0, 8)}...
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>
                      📍 {order.deliveryAddress}
                    </p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span className={`status-tag ${order.status}`}>
                      {order.status.replace(/_/g, ' ')}
                    </span>
                    <div style={{ marginTop: '0.5rem' }}>
                      <Link
                        to={`/track/${order.id}`}
                        style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--primary-color)' }}
                      >
                        View Details &rarr;
                      </Link>
                    </div>
                  </div>
                </div>

                <StatusStepper status={order.status} />

                <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', borderTop: '1px solid var(--border-color)', paddingTop: '0.75rem' }}>
                  <span>{order.items?.length || 0} item(s)</span>
                  <span style={{ fontWeight: '700' }}>Total: ${order.totalAmount?.toFixed(2)}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Order History Section */}
      <div className="card">
        <h2 className="page-title" style={{ marginBottom: '1.25rem' }}>Order History</h2>

        {historyOrders.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontStyle: 'italic', padding: '1rem 0' }}>
            No completed or cancelled orders yet.
          </p>
        ) : (
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Items Summary</th>
                  <th>Total Amount</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {historyOrders.map((order) => (
                  <tr key={order.id}>
                    <td style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : 'N/A'}
                    </td>
                    <td>
                      <div style={{ fontSize: '0.85rem' }}>
                        {order.items?.map((item, i) => (
                          <div key={i}>• {item.productName} (x{item.quantity})</div>
                        ))}
                      </div>
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
                      <Link
                        to={`/track/${order.id}`}
                        style={{ fontSize: '0.85rem', fontWeight: '600', color: 'var(--primary-color)' }}
                      >
                        Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
