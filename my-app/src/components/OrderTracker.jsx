import React, { useEffect, useState, useRef } from 'react';
import { generateClient } from 'aws-amplify/data';
import { toast } from 'react-toastify';
import StatusStepper from './StatusStepper';

const client = generateClient();

export default function OrderTracker({ orderId }) {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const prevStatusRef = useRef(null);

  useEffect(() => {
    const sub = client.models.Order.observeQuery({
      filter: { id: { eq: orderId } }
    }).subscribe({
      next: ({ items }) => {
        setLoading(false);
        if (items[0]) {
          const currentOrder = items[0];
          const parsedOrder = {
            ...currentOrder,
            items: JSON.parse(currentOrder.items || '[]')
          };
          setOrder(parsedOrder);

          if (prevStatusRef.current && prevStatusRef.current !== currentOrder.status) {
            toast.info(`🔔 Status update: ${currentOrder.status.replace(/_/g, ' ')}`, {
              position: "top-right",
              autoClose: 4000
            });
          }
          prevStatusRef.current = currentOrder.status;
        } else {
          setOrder(null);
        }
      },
      error: (err) => {
        setLoading(false);
        toast.error('Failed to load order updates');
      }
    });

    return () => sub.unsubscribe();
  }, [orderId]);

  if (loading) {
    return (
      <div className="card">
        <div className="spinner-container">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="card" style={{ textAlign: 'center' }}>
        <h2>Order Not Found</h2>
        <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
          No order exists with ID: <code>{orderId}</code>
        </p>
      </div>
    );
  }

  return (
    <div className="card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2 className="page-title" style={{ marginBottom: '0.25rem' }}>Order Tracking</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>ID: {order.id}</p>
        </div>
        <span className={`status-tag ${order.status}`}>
          {order.status.replace(/_/g, ' ')}
        </span>
      </div>

      <StatusStepper status={order.status} />

      {/* Details Section */}
      <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem' }}>Order Details</h3>
        <p><strong>Customer:</strong> {order.customerName} ({order.customerEmail})</p>
        <p><strong>Delivery Address:</strong> {order.deliveryAddress}</p>
        <p><strong>Placed At:</strong> {order.createdAt ? new Date(order.createdAt).toLocaleString() : 'N/A'}</p>

        <h4 style={{ fontSize: '1rem', fontWeight: '600', marginTop: '1.25rem', marginBottom: '0.5rem' }}>
          Items Ordered
        </h4>
        <ul style={{ listStylePosition: 'inside', color: 'var(--text-main)' }}>
          {order.items?.map((item, i) => (
            <li key={i} style={{ padding: '0.25rem 0' }}>
              {item.productName} &times; {item.quantity} - ${item.price?.toFixed(2)} each
            </li>
          ))}
        </ul>
        <div style={{ marginTop: '1rem', fontSize: '1.1rem', fontWeight: '700' }}>
          Total Paid: ${order.totalAmount?.toFixed(2)}
        </div>
      </div>
    </div>
  );
}
