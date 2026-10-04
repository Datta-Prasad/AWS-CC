import React from "react";
import OrderForm from "../components/OrderForm";

export default function OrderPage({ user }) {
  return (
    <div className="page-container">
      <h2>Create New Order</h2>
      <OrderForm user={user} />
    </div>
  );
}