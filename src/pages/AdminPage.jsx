import React from "react";
import AdminOrderList from "../components/AdminOrderList";

export default function AdminPage() {
  return (
    <div className="page-container" style={{ maxWidth: "1100px" }}>
      <h2>Admin Dashboard</h2>
      <AdminOrderList />
    </div>
  );
}