import React, { useEffect, useState } from 'react';
import { generateClient } from 'aws-amplify/data';
import { getCurrentUser, fetchUserAttributes } from 'aws-amplify/auth';
import { toast } from 'react-toastify';

const client = generateClient();

export default function DeliveryOrderList() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);
  const [currentUserId, setCurrentUserId] = useState('');
  const [currentUserEmail, setCurrentUserEmail] = useState('');

  useEffect(() => {
    let isMounted = true;

    async function loadUser() {
      try {
        const user = await getCurrentUser();
        const attrs = await fetchUserAttributes().catch(() => null);
        if (isMounted) {
          setCurrentUserId(user.userId);
          if (attrs?.email) {
            setCurrentUserEmail(attrs.email);
          }
        }
      } catch (err) {
        console.error('Error fetching current user:', err);
      }
    }

    loadUser();

    const sub = client.models.Order.observeQuery().subscribe({
      next: ({ items }) => {
        if (!isMounted) return;
        const sortedItems = [...items].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        setOrders(sortedItems.map(o => ({
          ...o,
          items: typeof o.items === 'string' ? JSON.parse(o.items || '[]') : (o.items || [])
        })));
        setLoading(false);
      },
      error: (err) => {
        if (!isMounted) return;
        setLoading(false);
        toast.error('Failed to load orders');
      }
    });

    return () => {
      isMounted = false;
      sub.unsubscribe();
    };
  }, []);

  const handleAcceptOrder = async (orderId) => {
    setUpdatingId(orderId);
    try {
      await client.models.Order.update({
        id: orderId,
        assignedDeliveryBoy: currentUserId
      });
      toast.success('Order accepted!');
    } catch (err) {
      console.error('Error accepting order:', err);
      toast.error(err.errors?.[0]?.message || err.message || 'Failed to accept order.');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleMarkDelivered = async (orderId) => {
    setUpdatingId(orderId);
    try {
      await client.models.Order.update({
        id: orderId,
        status: 'DELIVERED'
      });
      toast.success('Order marked as DELIVERED!');
    } catch (err) {
      console.error('Error updating order:', err);
      toast.error(err.errors?.[0]?.message || err.message || 'Failed to update order status.');
    } finally {
      setUpdatingId(null);
    }
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

  // Filter 1: Available Orders (status === OUT_FOR_DELIVERY AND assignedDeliveryBoy is null/empty)
  const availableOrders = orders.filter(order => 
    order.status === 'OUT_FOR_DELIVERY' && (!order.assignedDeliveryBoy || order.assignedDeliveryBoy.trim() === '')
  );

  // Filter 2: My Active Deliveries (assignedDeliveryBoy equals current user id or email AND status === OUT_FOR_DELIVERY)
  const myActiveDeliveries = orders.filter(order => 
    order.status === 'OUT_FOR_DELIVERY' && 
    (order.assignedDeliveryBoy === currentUserId || (currentUserEmail && order.assignedDeliveryBoy === currentUserEmail))
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* SECTION 1: AVAILABLE ORDERS */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 className="page-title" style={{ margin: 0 }}>📦 Available Orders</h2>
          <span className="user-role-badge" style={{ fontSize: '0.85rem' }}>
            {availableOrders.length} Ready for Pickup
          </span>
        </div>

        {availableOrders.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
            No orders currently available for pickup.
          </p>
        ) : (
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Delivery Address</th>
                  <th>Items & Total</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {availableOrders.map((order) => {
                  const isUpdating = updatingId === order.id;

                  return (
                    <tr key={order.id}>
                      <td>
                        <div style={{ fontWeight: '600' }}>{order.customerName}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{order.customerEmail}</div>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.9rem' }}>{order.deliveryAddress}</div>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.85rem' }}>
                          {order.items?.map((item, i) => (
                            <div key={i}>• {item.productName} (x{item.quantity})</div>
                          ))}
                        </div>
                        <div style={{ fontWeight: '600', marginTop: '0.25rem' }}>
                          Total: ${order.totalAmount?.toFixed(2)}
                        </div>
                      </td>
                      <td>
                        <span className={`status-tag ${order.status}`}>
                          {order.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn-add"
                          style={{
                            borderStyle: 'solid',
                            padding: '0.4rem 0.8rem',
                            fontSize: '0.8rem',
                            backgroundColor: 'var(--primary-color, #2563eb)',
                            color: 'white',
                            borderColor: 'transparent'
                          }}
                          disabled={isUpdating}
                          onClick={() => handleAcceptOrder(order.id)}
                        >
                          {isUpdating ? 'Accepting...' : 'Accept Order'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* SECTION 2: MY ACTIVE DELIVERIES */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 className="page-title" style={{ margin: 0 }}>🚚 My Active Deliveries</h2>
          <span className="user-role-badge" style={{ fontSize: '0.85rem' }}>
            {myActiveDeliveries.length} In Transit
          </span>
        </div>

        {myActiveDeliveries.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
            You have no active deliveries assigned to you.
          </p>
        ) : (
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Delivery Address</th>
                  <th>Items & Total</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {myActiveDeliveries.map((order) => {
                  const isUpdating = updatingId === order.id;

                  return (
                    <tr key={order.id}>
                      <td>
                        <div style={{ fontWeight: '600' }}>{order.customerName}</div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{order.customerEmail}</div>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.9rem' }}>{order.deliveryAddress}</div>
                      </td>
                      <td>
                        <div style={{ fontSize: '0.85rem' }}>
                          {order.items?.map((item, i) => (
                            <div key={i}>• {item.productName} (x{item.quantity})</div>
                          ))}
                        </div>
                        <div style={{ fontWeight: '600', marginTop: '0.25rem' }}>
                          Total: ${order.totalAmount?.toFixed(2)}
                        </div>
                      </td>
                      <td>
                        <span className={`status-tag ${order.status}`}>
                          {order.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn-add"
                          style={{
                            borderStyle: 'solid',
                            padding: '0.4rem 0.8rem',
                            fontSize: '0.8rem',
                            backgroundColor: 'var(--success-color, #10b981)',
                            color: 'white',
                            borderColor: 'transparent'
                          }}
                          disabled={isUpdating}
                          onClick={() => handleMarkDelivered(order.id)}
                        >
                          {isUpdating ? 'Updating...' : 'Mark as Delivered'}
                        </button>
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
