import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { generateClient } from 'aws-amplify/api';
import { toast } from 'react-toastify';
import { getOrder } from '../graphql/queries';
import { onUpdateOrder } from '../graphql/subscriptions';

const client = generateClient();

const STATUSES = ['PLACED', 'CONFIRMED', 'PREPARING', 'OUT_FOR_DELIVERY', 'DELIVERED'];

export default function OrderTracking() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch initial order details
  useEffect(() => {
    let isMounted = true;

    async function fetchOrder() {
      try {
        setLoading(true);
        const response = await client.graphql({
          query: getOrder,
          variables: { id: orderId }
        });
        if (isMounted) {
          if (response.data.getOrder) {
            setOrder(response.data.getOrder);
          } else {
            toast.error('Order not found');
          }
        }
      } catch (err) {
        console.error('Error fetching order:', err);
        toast.error('Failed to fetch order details.');
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchOrder();

    return () => {
      isMounted = false;
    };
  }, [orderId]);

  // Subscribe to real-time order updates
  useEffect(() => {
    let subscription = null;

    try {
      const subResponse = client.graphql({
        query: onUpdateOrder,
        variables: {
          filter: { id: { eq: orderId } }
        }
      });

      subscription = subResponse.subscribe({
        next: ({ data }) => {
          const updatedOrder = data.onUpdateOrder;
          if (updatedOrder && updatedOrder.id === orderId) {
            setOrder(updatedOrder);
            toast.info(`🔔 Order Status Updated: ${updatedOrder.status.replace(/_/g, ' ')}`, {
              position: "top-right",
              autoClose: 4000
            });
          }
        },
        error: (err) => {
          console.error('Subscription error:', err);
        }
      });
    } catch (err) {
      console.error('Failed to subscribe:', err);
    }

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [orderId]);

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

  if (!order) {
    return (
      <div className="page-container">
        <div className="card" style={{ textAlign: 'center' }}>
          <h2>Order Not Found</h2>
          <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>
            No order exists with ID: <code>{orderId}</code>
          </p>
        </div>
      </div>
    );
  }

  const isCancelled = order.status === 'CANCELLED';
  const currentStepIndex = STATUSES.indexOf(order.status);
  const progressPercentage = isCancelled 
    ? 0 
    : currentStepIndex >= 0 
      ? (currentStepIndex / (STATUSES.length - 1)) * 100 
      : 0;

  return (
    <div className="page-container">
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

        {/* Stepper Display */}
        {isCancelled ? (
          <div className="cancelled-badge">
            This order has been CANCELLED.
          </div>
        ) : (
          <div className="stepper-container">
            <div className="stepper-progress-bar">
              <div
                className="stepper-progress-fill"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
            {STATUSES.map((statusStep, index) => {
              const isCompleted = currentStepIndex > index;
              const isActive = currentStepIndex === index;

              return (
                <div
                  key={statusStep}
                  className={`step-item ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}`}
                >
                  <div className="step-circle">
                    {isCompleted ? '✓' : index + 1}
                  </div>
                  <div className="step-label">
                    {statusStep.replace(/_/g, ' ')}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Details Section */}
        <div style={{ marginTop: '2rem', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem' }}>
          <h3 style={{ fontSize: '1.1rem', fontWeight: '600', marginBottom: '1rem' }}>Order Details</h3>
          <p><strong>Customer:</strong> {order.customerName} ({order.customerEmail})</p>
          <p><strong>Delivery Address:</strong> {order.deliveryAddress}</p>
          <p><strong>Placed At:</strong> {new Date(order.createdAt).toLocaleString()}</p>

          <h4 style={{ fontSize: '1rem', fontWeight: '600', marginTop: '1.25rem', marginBottom: '0.5rem' }}>
            Items Ordered
          </h4>
          <ul style={{ listStylePosition: 'inside', color: 'var(--text-main)' }}>
            {order.items?.map((item, i) => (
              <li key={i} style={{ padding: '0.25rem 0' }}>
                {item.productName} &times; {item.quantity} - ${item.price.toFixed(2)} each
              </li>
            ))}
          </ul>
          <div style={{ marginTop: '1rem', fontSize: '1.1rem', fontWeight: '700' }}>
            Total Paid: ${order.totalAmount?.toFixed(2)}
          </div>
        </div>
      </div>
    </div>
  );
}
