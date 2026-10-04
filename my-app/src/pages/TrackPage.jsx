import React from "react";
import { useParams } from "react-router-dom";
import OrderTracker from "../components/OrderTracker";

export default function TrackPage() {
  const { orderId } = useParams();

  if (!orderId) {
    return (
      <div className="page-container">
        <h3>Invalid Order ID</h3>
      </div>
    );
  }

  return (
    <div className="page-container">
      <h2>Track Order</h2>
      <OrderTracker orderId={orderId} />
    </div>
  );
}