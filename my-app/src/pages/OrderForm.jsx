import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateClient } from 'aws-amplify/api';
import { toast } from 'react-toastify';
import { createOrder } from '../graphql/mutations';

const client = generateClient();

export default function OrderForm({ user }) {
  const navigate = useNavigate();
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState(user?.signInDetails?.loginId || '');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [items, setItems] = useState([
    { productName: 'Margherita Pizza', quantity: 1, price: 12.99 }
  ]);
  const [loading, setLoading] = useState(false);

  const handleItemChange = (index, field, value) => {
    const newItems = [...items];
    if (field === 'quantity') {
      newItems[index][field] = Math.max(1, parseInt(value) || 1);
    } else if (field === 'price') {
      newItems[index][field] = Math.max(0, parseFloat(value) || 0);
    } else {
      newItems[index][field] = value;
    }
    setItems(newItems);
  };

  const addItem = () => {
    setItems([...items, { productName: '', quantity: 1, price: 0.00 }]);
  };

  const removeItem = (index) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!customerName || !customerEmail || !deliveryAddress) {
      toast.error('Please fill in all required fields.');
      return;
    }

    if (items.some(item => !item.productName.trim())) {
      toast.error('Please provide a product name for all items.');
      return;
    }

    setLoading(true);
    const totalAmount = calculateTotal();

    const input = {
      customerName,
      customerEmail,
      deliveryAddress,
      items: items.map(item => ({
        productName: item.productName,
        quantity: Number(item.quantity),
        price: Number(item.price)
      })),
      totalAmount: Number(totalAmount.toFixed(2)),
      status: 'PLACED'
    };

    try {
      const response = await client.graphql({
        query: createOrder,
        variables: { input }
      });

      const newOrder = response.data.createOrder;
      toast.success('Order placed successfully!');
      navigate(`/track/${newOrder.id}`);
    } catch (err) {
      console.error('Error creating order:', err);
      toast.error(err.errors?.[0]?.message || 'Failed to place order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="card">
        <h2 className="page-title">Place New Order</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Customer Name</label>
            <input
              type="text"
              className="form-input"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="John Doe"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Customer Email</label>
            <input
              type="email"
              className="form-input"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              placeholder="john@example.com"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Delivery Address</label>
            <input
              type="text"
              className="form-input"
              value={deliveryAddress}
              onChange={(e) => setDeliveryAddress(e.target.value)}
              placeholder="123 Main St, City, Country"
              required
            />
          </div>

          <div className="items-section-header">
            <h3 style={{ fontSize: '1.1rem', fontWeight: '600' }}>Order Items</h3>
            <button type="button" className="btn-add" onClick={addItem}>
              + Add Item
            </button>
          </div>

          {items.map((item, index) => (
            <div key={index} className="item-row">
              <input
                type="text"
                className="form-input"
                placeholder="Product Name"
                value={item.productName}
                onChange={(e) => handleItemChange(index, 'productName', e.target.value)}
                required
              />
              <input
                type="number"
                min="1"
                className="form-input"
                placeholder="Qty"
                value={item.quantity}
                onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                required
              />
              <input
                type="number"
                step="0.01"
                min="0"
                className="form-input"
                placeholder="Price ($)"
                value={item.price}
                onChange={(e) => handleItemChange(index, 'price', e.target.value)}
                required
              />
              {items.length > 1 && (
                <button
                  type="button"
                  className="btn-remove"
                  onClick={() => removeItem(index)}
                  title="Remove item"
                >
                  &times;
                </button>
              )}
            </div>
          ))}

          <div className="order-total-summary">
            <span>Total Amount:</span>
            <span>${calculateTotal().toFixed(2)}</span>
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Submitting Order...' : 'Submit Order'}
          </button>
        </form>
      </div>
    </div>
  );
}
